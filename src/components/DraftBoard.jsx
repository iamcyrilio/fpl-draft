import { useState, useEffect, useRef } from 'react'
import { updateDraftState, recordDraft, getAllDraftedPlayers, updateDraftState as updateState } from '../utils/supabase'
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

export default function DraftBoard({ currentUser, draftState, draftConfig, draftedPlayers, onLogout }) {
  const [selectedPosition, setSelectedPosition] = useState('Gardien')
  const [queue, setQueue] = useState([])
  const [filteredQueue, setFilteredQueue] = useState(false)
  const [timer, setTimer] = useState(30)
  const timerRef = useRef(null)
  const pickInProgressRef = useRef(false)
  const currentUserIdRef = useRef(getParticipantId(currentUser))

  const draftedPlayerIds = draftedPlayers.map(d => d.player_id)
  const availablePlayersForPosition = getAvailablePlayers(selectedPosition, draftedPlayerIds)
  const displayedPlayers = filteredQueue && queue.length > 0
    ? availablePlayersForPosition.filter(p => queue.includes(p.id))
    : availablePlayersForPosition

  const currentParticipantId = draftState?.current_participant_id
  const isCurrentUser = currentParticipantId === currentUserIdRef.current
  const currentPosition = draftState?.current_position || 'Gardien'

  // Timer logic
  useEffect(() => {
    if (!isCurrentUser || draftState?.status !== 'in_progress') {
      clearInterval(timerRef.current)
      return
    }

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          // Auto-draft
          handleAutoDraft()
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [isCurrentUser, draftState?.status, selectedPosition])

  // Reset timer when turn changes
  useEffect(() => {
    setTimer(30)
  }, [currentParticipantId])

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
    const totalParticipants = draftConfig.participants_list.length

    const picksForPosition = draftedPlayers.filter(
      p => p.player_position === currentPosition
    ).length

    const currentRound =
      Math.floor(picksForPosition / totalParticipants) + 1

    await recordDraft(
      playerId,
      player,
      currentUserIdRef.current,
      currentRound
    )

    await moveToNextTurn()

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

  
const moveToNextTurn = async () => {
  const picks = await getAllDraftedPlayers()
  const totalParticipants = draftConfig.participants_list.length

  const picksThisPosition = picks.filter(
    p => p.player_position === currentPosition
  ).length

  const required = PICKS_REQUIRED[currentPosition]
  const totalRequired = totalParticipants * required

  let nextPosition = currentPosition
  let nextTurn = picksThisPosition

  // Le dernier joueur du poste vient de jouer
  if (picksThisPosition >= totalRequired) {
    const index = POSITIONS.indexOf(currentPosition)

    // Tous les postes sont terminés
    if (index === POSITIONS.length - 1) {
      await updateDraftState({
        status: 'completed',
        current_participant_id: null,
        time_remaining: 0
      })
      return
    }

    // Passer au poste suivant
    nextPosition = POSITIONS[index + 1]
    nextTurn = 0
  }

  const order = draftConfig.draft_orders[nextPosition]

  if (!order || order.length !== totalParticipants) {
    throw new Error(
      `Ordre de draft invalide pour ${nextPosition}`
    )
  }

  // Calcul du snake draft
  const round = Math.floor(nextTurn / totalParticipants)
  let indexInRound = nextTurn % totalParticipants

  if (round % 2 === 1) {
    indexInRound = totalParticipants - 1 - indexInRound
  }

  const nextParticipantId = order[indexInRound]

  // Enregistrer le prochain tour
  await updateDraftState({
    current_position: nextPosition,
    current_turn: nextTurn,
    current_participant_id: nextParticipantId,
    time_remaining: 30
  })
}


  // Toggle queue
  const toggleQueue = (playerId) => {
    setQueue(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId)
      } else {
        return [...prev, playerId]
      }
    })
  }

  if (!draftConfig || !draftState) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">⚽ FPL Draft Fantasy</h1>
              <p className="text-gray-600">Connecté en tant que: <span className="font-semibold text-blue-600">{currentUser}</span></p>
            </div>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Déconnexion
            </button>
          </div>

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
