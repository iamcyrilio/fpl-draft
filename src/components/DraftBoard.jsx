import { useState, useEffect, useRef } from 'react'
import {
  launchFplDraft,
  submitManualPick,
  getMyDraftQueue,
  saveMyDraftQueue,
  forceAutoPick
} from '../utils/supabase'
import { getNextDraftParticipant, getAvailablePlayers, getBestAvailablePlayer, countParticipantPicks, getParticipantId, getParticipantName } from '../utils/helpers'
import players from '../data/players.json'
import PlayerCard from './PlayerCard'
import './DraftBoard.css'

const POSITIONS = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant']
const PICKS_REQUIRED = {
  'Gardien': 2,
  'Défenseur': 6,
  'Milieu': 6,
  'Attaquant': 4
}

export default function DraftBoard({ currentUser, draftState, draftConfig, draftedPlayers, onLogout, isAdmin }) {
  const [selectedPosition, setSelectedPosition] = useState('Gardien')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClub, setSelectedClub] = useState('Tous')
  const [queue, setQueue] = useState([])
  const [filteredQueue, setFilteredQueue] = useState(false)
  const [timer, setTimer] = useState(30)
  const timerRef = useRef(null)
  const pickInProgressRef = useRef(false)
  const timeoutTriggeredRef = useRef(false)
  const currentUserIdRef = useRef(getParticipantId(currentUser))
  
  const queueLoadedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function loadQueue() {
      try {
        const savedQueue = await getMyDraftQueue(
          currentUserIdRef.current
        )

        if (!cancelled) {
          setQueue(savedQueue)
          queueLoadedRef.current = true
        }
      } catch (error) {
  console.error('Erreur de chargement Queue :', error)
  if (!cancelled) {
    alert('Erreur Supabase Queue : ' + error.message)
  }
}
    }

    loadQueue()

    return () => {
      cancelled = true
    }
  }, [])


  const draftedPlayerIds = draftedPlayers.map(d => d.player_id)
  
const availablePlayersForPosition = getAvailablePlayers(
  selectedPosition,
  draftedPlayerIds
)

const clubs = [...new Set(
  players.map(p => p.club).filter(Boolean)
)].sort((a, b) => a.localeCompare(b))

const normalizeSearch = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const displayedPlayers = availablePlayersForPosition.filter(player => {
  const matchesQueue = !filteredQueue || queue.includes(player.id)

  const matchesName = normalizeSearch(player.name).includes(
    normalizeSearch(searchTerm.trim())
  )

  const matchesClub =
    selectedClub === 'Tous' || player.club === selectedClub

  return matchesQueue && matchesName && matchesClub
})


  const currentParticipantId = draftState?.current_participant_id
  const isCurrentUser = currentParticipantId === currentUserIdRef.current
  const currentPosition = draftState?.current_position || 'Gardien'
  
  // Nombre de sélections avant le prochain pick du joueur
  const getPicksUntilMyTurn = () => {
    if (!['in_progress', 'break'].includes(draftState?.status)) {
      return null
    }

    const participantId = currentUserIdRef.current
    const participantCount = draftConfig?.participants_list?.length || 0

    if (!participantCount) return null

    const startingPositionIndex = POSITIONS.indexOf(currentPosition)

    for (
      let posIndex = startingPositionIndex;
      posIndex < POSITIONS.length;
      posIndex++
    ) {
      const position = POSITIONS[posIndex]
      const order = draftConfig?.draft_orders?.[position]
      const required = PICKS_REQUIRED[position]

      if (!Array.isArray(order) || order.length !== participantCount) {
        return null
      }

      const firstTurn = posIndex === startingPositionIndex
        ? (draftState.current_turn || 0)
        : 0

      for (let turn = firstTurn; turn < participantCount * required; turn++) {
        const round = Math.floor(turn / participantCount)
        let index = turn % participantCount

        if (round % 2 === 1) {
          index = participantCount - 1 - index
        }

        if (order[index] === participantId) {
          const picksRemainingCurrentPosition =
            participantCount * PICKS_REQUIRED[currentPosition] -
            (draftState.current_turn || 0)

          return posIndex === startingPositionIndex
            ? turn - firstTurn
            : picksRemainingCurrentPosition +
              POSITIONS.slice(startingPositionIndex + 1, posIndex)
                .reduce(
                  (sum, p) => sum + participantCount * PICKS_REQUIRED[p],
                  0
                ) +
              turn
        }
      }
    }

    return null
  }

  const picksUntilMyTurn = getPicksUntilMyTurn()

useEffect(() => {
  setSelectedPosition(currentPosition)
}, [currentPosition])

  
  // Chronomètre partagé via Supabase
  useEffect(() => {
    const deadline = draftState?.turn_deadline

    if (!['in_progress', 'break'].includes(draftState?.status) || !deadline) {
  setTimer(30)
  return
}

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(deadline).getTime() - Date.now()) / 1000
        )
      )

      setTimer(remaining)

      
    }

    updateTimer()

    const interval = setInterval(updateTimer, 250)

    return () => clearInterval(interval)
  }, [
    draftState?.turn_deadline,
    draftState?.status,
    draftState?.current_turn,
    currentParticipantId,
    currentPosition,
    isCurrentUser
  ])

  // Réarmer l'auto-draft à chaque nouveau tour
  useEffect(() => {
    timeoutTriggeredRef.current = false
  }, [
    draftState?.turn_deadline,
    draftState?.current_turn,
    currentPosition
  ])


  // Auto-draft immédiat réservé à l'administrateur
  const handleForceAutoPick = async () => {
    if (!isAdmin || draftState?.status !== 'in_progress') return
    if (pickInProgressRef.current) return

    const participantName =
      draftConfig?.participants_list?.find(
        p => p.id === currentParticipantId
      )?.name || currentParticipantId

    const confirmed = window.confirm(
      `Forcer l'auto-draft de ${participantName} ?\n\n` +
      `Le premier joueur disponible de sa Queue sera choisi ` +
      `au poste ${currentPosition}. Sinon, le meilleur joueur disponible.`
    )

    if (!confirmed) return

    pickInProgressRef.current = true

    try {
      await forceAutoPick()
    } catch (error) {
      console.error('Erreur auto-draft forcé :', error)
      alert(error.message || "Impossible de forcer l'auto-draft")
    } finally {
      pickInProgressRef.current = false
    }
  }


  // Handle player selection
  
const handleDraftPlayer = async (playerId) => {
  if (pickInProgressRef.current) return

  if (!isCurrentUser || draftState?.status !== 'in_progress') {
    return
  }

  const player = players.find(p => p.id === playerId)

  if (!player) return

  if (player.position !== currentPosition) {
    alert(`Tu dois sélectionner un joueur au poste : ${currentPosition}`)
    return
  }

  if (draftedPlayers.some(p => String(p.player_id) === String(playerId))) {
    alert('Ce joueur a déjà été sélectionné.')
    return
  }

  pickInProgressRef.current = true

  try {
    await submitManualPick(
  playerId,
  currentUserIdRef.current
)

  } catch (error) {
    console.error('Erreur pendant la sélection :', error)

    alert(
      'Impossible de valider ce choix : ' +
      (error.message || 'Erreur inconnue')
    )
  } finally {
    pickInProgressRef.current = false
  }
}


  const handleAutoDraft = async () => {
    if (!isCurrentUser) return

    // Get best available player for current position
    const bestPlayer = getBestAvailablePlayer(currentPosition, draftedPlayerIds)
    if (bestPlayer) {
      await handleDraftPlayer(bestPlayer.id)
    }
  }

  

  // Toggle queue
  
  // Ajouter ou retirer un joueur de la Queue et sauvegarder
  const toggleQueue = async (playerId) => {
    if (!queueLoadedRef.current) {
      alert('Chargement de ta Queue en cours.')
      return
    }

    const nextQueue = queue.includes(playerId)
      ? queue.filter(id => id !== playerId)
      : [...queue, playerId]

    try {
      await saveMyDraftQueue(
        currentUserIdRef.current,
        nextQueue
      )

      setQueue(nextQueue)
    } catch (error) {
      console.error('Erreur sauvegarde Queue :', error)
      alert('Impossible de sauvegarder ta Queue.')
    }
  }

  
  // Modifier l'ordre de priorité de la Queue
  const moveQueuePlayer = async (playerId, direction) => {
    if (!queueLoadedRef.current) return

    const currentIndex = queue.indexOf(playerId)
    const targetIndex = currentIndex + direction

    if (
      currentIndex === -1 ||
      targetIndex < 0 ||
      targetIndex >= queue.length
    ) {
      return
    }

    const updatedQueue = [...queue]

    ;[
      updatedQueue[currentIndex],
      updatedQueue[targetIndex]
    ] = [
      updatedQueue[targetIndex],
      updatedQueue[currentIndex]
    ]

    try {
      await saveMyDraftQueue(
        currentUserIdRef.current,
        updatedQueue
      )

      setQueue(updatedQueue)
    } catch (error) {
      console.error('Erreur réorganisation Queue :', error)
      alert('Impossible de modifier les priorités.')
    }
  }


  if (!draftConfig || !draftState) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

{draftState?.status === 'ready' && (
  <div className="bg-blue-100 border-b border-blue-300 p-6 text-center">
    <h2 className="text-2xl font-bold text-blue-900 mb-2">
      ⚽ Préparation de la draft
    </h2>

    <p className="text-blue-800 mb-4">
      Explorez les joueurs et préparez vos sélections.
      Le chronomètre n'a pas encore démarré.
    </p>

    {isAdmin && (
      <button
        onClick={async () => {
          try {
            await launchFplDraft()
          } catch (error) {
            alert(error.message || 'Erreur de lancement')
          }
        }}
        className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl text-xl font-bold"
      >
        🚀 LET'S GO !
      </button>
    )}
  </div>
)}

{draftState?.status === 'break' && (
  <div className="bg-amber-100 border-b border-amber-300 p-6 text-center">
    <h2 className="text-2xl font-bold text-amber-900">
      ⏸️ Pause — prochain poste : {currentPosition}
    </h2>

    <p className="text-lg font-semibold text-amber-800 mt-2">
      Reprise dans {timer ?? 30} secondes
    </p>
  </div>
)}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">⚽ FPL Draft Fantasy</h1>
	     
{draftState?.status === 'in_progress' && picksUntilMyTurn !== null && (
  <div className="mt-2 text-sm font-bold text-indigo-700">
    {picksUntilMyTurn === 0
      ? '🔥 C’est à toi de drafter !'
      : `⏳ Tu draftes dans ${picksUntilMyTurn} pick${picksUntilMyTurn > 1 ? 's' : ''}`}
  </div>
)}

{draftState?.status === 'break' && (
  <div className="mt-2 text-sm font-bold text-amber-700">
    ⏸️ Pause entre deux postes
  </div>
)}

              <p className="text-gray-600">Connecté en tant que: <span className="font-semibold text-blue-600">{currentUser}</span></p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Déconnexion
            </button>
          </div>
	 
{isAdmin && draftState?.status === 'in_progress' && (
  <div className="mb-4 flex justify-end">
    <button
      onClick={handleForceAutoPick}
      className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-lg font-bold shadow-md"
    >
      ⚡ Forcer l'auto-draft de {
        draftConfig?.participants_list?.find(
          p => p.id === currentParticipantId
        )?.name || currentParticipantId
      }
    </button>
  </div>
)}

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600 font-semibold">POSITION EN COURS</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{currentPosition}</div>
            </div>
            <div className={`p-3 rounded-lg ${isCurrentUser ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="text-xs text-gray-600 font-semibold">À JOUER</div>
              <div className={`text-2xl font-bold mt-1 ${isCurrentUser ? 'text-green-600' : 'text-gray-600'}`}>
                {getParticipantName(currentParticipantId, draftConfig.participants_list.map(p => p.name || p))}
              </div>
            </div>
            <div className={`p-3 rounded-lg ${isCurrentUser ? 'bg-orange-50' : 'bg-gray-50'}`}>
              <div className="text-xs text-gray-600 font-semibold">TEMPS RESTANT</div>
              <div className={`text-2xl font-bold mt-1 ${timer <= 10 ? 'text-orange-600 animate-pulse' : 'text-gray-600'}`}>
                {timer}s
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-xs text-gray-600 font-semibold">JOUEURS RESTANTS</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">{draftedPlayerIds.length}/{players.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Players Grid */}
          <div className="lg:col-span-3">
            {/* Position tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {POSITIONS.map(position => (
                <button
                  key={position}
                  onClick={() => setSelectedPosition(position)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedPosition === position
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {position}
                </button>
              ))}
            </div>

            {/* Filter toggle */}
            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setFilteredQueue(!filteredQueue)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  filteredQueue
                    ? 'bg-purple-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200'
                }`}
              >
                ⭐ Queue ({queue.length})
              </button>
            </div>

            {/* Players Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
	      
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
  <input
    type="search"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder="🔎 Rechercher un joueur..."
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
  />

  <select
    value={selectedClub}
    onChange={(e) => setSelectedClub(e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
  >
    <option value="Tous">Tous les clubs</option>
    {clubs.map(club => (
      <option key={club} value={club}>
        {club}
      </option>
    ))}
  </select>
</div>

<p className="text-xs text-gray-500 mb-3">
  {displayedPlayers.length} joueur(s) disponible(s)
</p>

              {displayedPlayers.map(player => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onDraft={() => handleDraftPlayer(player.id)}
                  onToggleQueue={() => toggleQueue(player.id)}
                  isQueued={queue.includes(player.id)}
                  isDrafted={false}
                  isCurrentUser={isCurrentUser}
                  draftedBy={draftedPlayers.find(d => d.player_id === player.id)?.drafted_by}
                />
              ))}
            </div>

            {displayedPlayers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Pas de joueurs disponibles pour cette position</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
	    
{/* Queue prioritaire */}
<div className="bg-white rounded-xl shadow-lg p-6">
  <h3 className="font-bold text-lg text-gray-800 mb-2">
    ⭐ Ma Queue prioritaire
  </h3>

  <p className="text-xs text-gray-500 mb-4">
    L'auto-draft choisira le premier joueur disponible
    de cette liste au poste en cours.
  </p>

  <div className="space-y-2 max-h-96 overflow-y-auto">
    {queue.map((playerId, index) => {
      const player = players.find(
        p => p.id === playerId
      )

      if (!player) return null

      const alreadyDrafted = draftedPlayerIds.includes(playerId)

      return (
        <div
          key={playerId}
          className={`flex items-center gap-2 rounded-lg p-2 ${
            alreadyDrafted ? 'bg-gray-100 opacity-60' : 'bg-blue-50'
          }`}
        >
          <span className="font-bold text-blue-600 text-sm w-6">
            {index + 1}.
          </span>

          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-sm ${
              alreadyDrafted ? 'line-through' : ''
            }`}>
              {player.name}
            </div>
            <div className="text-xs text-gray-500">
              {player.position} · {player.club}
            </div>
          </div>

          <button
            onClick={() => moveQueuePlayer(playerId, -1)}
            disabled={index === 0}
            className="px-2 py-1 bg-white border rounded disabled:opacity-30"
            title="Monter dans la Queue"
          >
            ↑
          </button>

          <button
            onClick={() => moveQueuePlayer(playerId, 1)}
            disabled={index === queue.length - 1}
            className="px-2 py-1 bg-white border rounded disabled:opacity-30"
            title="Descendre dans la Queue"
          >
            ↓
          </button>
        </div>
      )
    })}

    {queue.length === 0 && (
      <p className="text-sm text-gray-500 text-center py-4">
        Aucun joueur dans ta Queue.
      </p>
    )}
  </div>
</div>

            {/* Current user team */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">👥 Ton équipe</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {POSITIONS.map(position => {
                  const picks = draftedPlayers.filter(d => d.drafted_by === currentUserIdRef.current && d.player_position === position)
                  return (
                    <div key={position}>
                      <div className="text-xs font-semibold text-gray-600 uppercase mb-1">
                        {position} ({picks.length}/{PICKS_REQUIRED[position]})
                      </div>
                      <div className="space-y-1">
                        {picks.map(pick => (
                          <div key={pick.id} className="bg-blue-50 p-2 rounded text-sm">
                            <div className="font-semibold text-gray-800">{pick.player_name}</div>
                            <div className="text-xs text-gray-500">{pick.player_club}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

	   
            {/* Live draft history */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-800">
                  📋 Picks en direct
                </h3>
                <span className="text-xs font-bold text-green-600">
                  🔴 LIVE
                </span>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                {draftedPlayers.length} / 144 sélections
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {[...draftedPlayers]
                  .sort((a, b) =>
                    new Date(b.created_at) - new Date(a.created_at) ||
                    b.id - a.id
                  )
                  .map((pick, index, sortedPicks) => {
                    const participant = draftConfig.participants_list.find(
                      p => (p.id || getParticipantId(p.name || p)) === pick.drafted_by
                    )

                    const managerName =
                      participant?.name || participant || pick.drafted_by

                    const pickNumber = sortedPicks.length - index

                    return (
                      <div
                        key={pick.id}
                        className={`rounded-lg p-3 border ${
                          index === 0
                            ? 'bg-green-50 border-green-300'
                            : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-blue-600 text-sm min-w-[35px]">
                            #{pickNumber}
                          </span>

                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-800 text-sm">
                              {managerName}
                            </div>

                            <div className="text-sm text-gray-700">
                              {pick.player_name}
                            </div>

                            <div className="text-xs text-gray-500 mt-1">
                              {pick.player_club} · {pick.player_position}
                            </div>
                          </div>

                          {index === 0 && (
                            <span className="text-xs font-bold text-green-700">
                              NEW
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}

                {draftedPlayers.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-6">
                    Aucun joueur sélectionné pour le moment.
                  </p>
                )}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">📊 Progression</h3>
              <div className="space-y-2">
                {draftConfig.participants_list.map(p => {
                  const participantId = p.id || p.name.toLowerCase().replace(/\s+/g, '_')
                  const picks = draftedPlayers.filter(d => d.drafted_by === participantId).length
                  const totalNeeded = 18 // 2+6+6+4
                  return (
                    <div key={participantId} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-gray-800">{p.name || p}</span>
                        <span className="text-gray-600">{picks}/18</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${(picks / totalNeeded) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
