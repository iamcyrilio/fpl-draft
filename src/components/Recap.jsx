import { useState } from 'react'
import { generateDraftRecap, exportRecapAsJSON } from '../utils/helpers'
import { Download } from 'lucide-react'

const POSITIONS = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant']

export default function Recap({ draftedPlayers, participants, onReset }) {
  const [selectedParticipant, setSelectedParticipant] = useState(
    participants?.[0]?.name || participants?.[0]
  )

  const recap = generateDraftRecap(draftedPlayers, participants.map(p => ({
    id: p.id || p.name.toLowerCase().replace(/\s+/g, '_'),
    name: p.name || p
  })))

  const currentTeam = recap[selectedParticipant]

  const handleExport = () => {
    exportRecapAsJSON(recap, 'fpl-draft-recap.json')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">✅ Draft Terminée!</h1>
          <p className="text-gray-600 text-lg">Résumé complet des sélections</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            <Download size={20} />
            Télécharger le JSON
          </button>
          <button
            onClick={onReset}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
          >
            Retour à l'écran d'accueil
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Participants List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">👥 Participants</h2>
              <div className="space-y-2">
                {participants.map(p => {
                  const name = p.name || p
                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedParticipant(name)}
                      className={`w-full p-3 rounded-lg font-semibold transition-all text-left ${
                        selectedParticipant === name
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Team Details */}
          <div className="lg:col-span-3">
            {currentTeam && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">
                  ⚽ {selectedParticipant}'s Team
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {POSITIONS.map(position => (
                    <div key={position}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-3xl">
                          {position === 'Gardien' ? '🥅' : 
                           position === 'Défenseur' ? '🛡️' :
                           position === 'Milieu' ? '⚙️' : '🎯'}
                        </span>
                        <h3 className="text-2xl font-bold text-gray-800">{position}</h3>
                        <span className="text-lg text-gray-500 font-semibold">
                          ({currentTeam.teams[position].length})
                        </span>
                      </div>

                      <div className="space-y-2">
                        {currentTeam.teams[position].map((player, idx) => (
                          <div key={`${position}-${idx}`} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-1">
                              <div>
                                <div className="font-bold text-gray-800">{player.name}</div>
                                <div className="text-sm text-gray-600">{player.club}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-blue-600">Cote: {player.cote}</div>
                                <div className="text-xs text-gray-500">Round {player.round}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Stats */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="grid grid-cols-4 gap-4">
                    {POSITIONS.map(position => (
                      <div key={`stat-${position}`} className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl mb-2">
                          {position === 'Gardien' ? '🥅' : 
                           position === 'Défenseur' ? '🛡️' :
                           position === 'Milieu' ? '⚙️' : '🎯'}
                        </div>
                        <div className="text-3xl font-bold text-blue-600">
                          {currentTeam.teams[position].length}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{position}</div>
                      </div>
                    ))}
                  </div>

                  {/* Total Cote */}
                  <div className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                    <div className="text-sm opacity-90">Cote totale</div>
                    <div className="text-4xl font-bold mt-2">
                      {POSITIONS.reduce((sum, pos) => {
                        return sum + currentTeam.teams[pos].reduce((pSum, p) => pSum + (p.cote || 0), 0)
                      }, 0).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* All Teams Summary */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 Résumé de tous les participants</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {participants.map(p => {
                const name = p.name || p
                const team = recap[name]
                const totalPlayers = POSITIONS.reduce((sum, pos) => sum + team.teams[pos].length, 0)
                const totalCote = POSITIONS.reduce((sum, pos) => {
                  return sum + team.teams[pos].reduce((pSum, pl) => pSum + (pl.cote || 0), 0)
                }, 0)

                return (
                  <div key={name} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-4">{name}</h3>
                    <div className="space-y-2 mb-4">
                      {POSITIONS.map(pos => (
                        <div key={`${name}-${pos}`} className="flex justify-between text-sm">
                          <span className="text-gray-600">{pos}</span>
                          <span className="font-bold text-gray-800">{team.teams[pos].length}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-blue-200 pt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Total joueurs</span>
                        <span className="font-bold text-gray-800">{totalPlayers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cote totale</span>
                        <span className="font-bold text-blue-600">{totalCote.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
