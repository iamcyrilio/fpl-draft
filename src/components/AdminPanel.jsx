import { useState, useEffect } from 'react'
import { initDraftConfig, startDraft } from '../utils/supabase'
import { generateDraftOrder, getParticipantId } from '../utils/helpers'

const DEFAULT_PARTICIPANTS = [
  'Cyril',
  'Marc',
  'Sophie',
  'Alex',
  'Jordan',
  'Léa',
  'Thomas',
  'Nina'
]

const POSITIONS = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant']

export default function AdminPanel({ onLogout, draftConfig, onReset }) {
  const [participants, setParticipants] = useState(DEFAULT_PARTICIPANTS)
  const [draftOrders, setDraftOrders] = useState({
    'Gardien': [],
    'Défenseur': [],
    'Milieu': [],
    'Attaquant': []
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  // Charger les ordres existants
  useEffect(() => {
    if (draftConfig?.draft_orders) {
      setDraftOrders(draftConfig.draft_orders)
    }
    if (draftConfig?.participants_list) {
      setParticipants(draftConfig.participants_list.map(p => p.name || p))
    }
  }, [draftConfig])

  // Générer les ordres aléatoires
  const handleGenerateOrders = () => {
    const newOrders = {}
    POSITIONS.forEach(position => {
      const order = participants
        .map(p => ({ id: getParticipantId(p), name: p }))
        .sort(() => 0.5 - Math.random())
      newOrders[position] = order.map(p => p.id)
    })
    setDraftOrders(newOrders)
    setStatus('✅ Ordres générés aléatoirement!')
    setTimeout(() => setStatus(''), 3000)
  }

  // Mettre à jour l'ordre d'un poste
  const handleReorderPosition = (position, newOrder) => {
    setDraftOrders(prev => ({
      ...prev,
      [position]: newOrder
    }))
  }

  // Lancer la draft
  const handleStartDraft = async () => {
    if (!draftOrders['Gardien']?.length || !draftOrders['Défenseur']?.length) {
      setStatus('❌ Génère d\'abord les ordres pour tous les postes!')
      return
    }

    setLoading(true)
    try {
      const participantList = participants.map(name => ({
        id: getParticipantId(name),
        name: name
      }))

      await initDraftConfig(participantList, draftOrders)
      await startDraft()
      setStatus('✅ Draft lancée! Les participants peuvent maintenant drafter.')
      setTimeout(() => setStatus(''), 3000)
    } catch (error) {
      console.error('Erreur:', error)
      setStatus('❌ Erreur lors du démarrage de la draft')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">👑 Panel Admin</h1>
            <p className="text-gray-600 mt-1">Configuration de la FPL Draft</p>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Déconnexion
          </button>
        </div>

        {/* Status Message */}
        {status && (
          <div className={`mb-6 p-4 rounded-lg font-semibold ${
            status.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {status}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Participants */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Participants</h2>
              <div className="space-y-2">
                {participants.map((p, idx) => (
                  <div key={p} className="bg-blue-50 p-3 rounded-lg">
                    <div className="font-semibold text-gray-800">{p}</div>
                    <div className="text-xs text-gray-500 mt-1">ID: {getParticipantId(p)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                <strong>{participants.length}</strong> participants seront dans la draft.
              </div>
            </div>
          </div>

          {/* Right: Draft Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">🎲 Ordre de Draft</h2>
                <button
                  onClick={handleGenerateOrders}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Générer aléatoirement
                </button>
              </div>

              <div className="space-y-4">
                {POSITIONS.map(position => (
                  <div key={position}>
                    <div className="font-semibold text-gray-800 mb-2 flex items-center">
                      <span className="text-2xl mr-2">
                        {position === 'Gardien' ? '🥅' : 
                         position === 'Défenseur' ? '🛡️' :
                         position === 'Milieu' ? '⚙️' : '🎯'}
                      </span>
                      {position}
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {draftOrders[position]?.length > 0 ? (
                        <div className="space-y-2">
                          {draftOrders[position].map((participantId, idx) => {
                            const participantName = participants.find(p => getParticipantId(p) === participantId) || participantId
                            return (
                              <div key={participantId} className="flex items-center gap-3 bg-white p-2 rounded">
                                <div className="font-bold text-blue-600 min-w-[30px]">#{idx + 1}</div>
                                <div className="flex-1 font-semibold text-gray-800">{participantName}</div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">Ordre non généré - Clique sur "Générer aléatoirement"</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex gap-3">
                <button
                  onClick={handleStartDraft}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-bold text-lg transition-all"
                >
                  {loading ? '⏳ Démarrage...' : '🚀 LANCER LA DRAFT'}
                </button>
                <button
                  onClick={onReset}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">📝 Instructions</h3>
          <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
            <li>Vérifie que tous les 8 participants sont listés</li>
            <li>Clique sur "Générer aléatoirement" pour créer un ordre de draft par poste</li>
            <li>Les ordres peuvent être modifiés manuellement si besoin</li>
            <li>Une fois prêt, clique sur "LANCER LA DRAFT"</li>
            <li>Les participants verront l'écran de draft en temps réel</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
