import { useState } from 'react'

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

export default function LoginScreen({ onLogin, participants = DEFAULT_PARTICIPANTS }) {
  const [selectedParticipant, setSelectedParticipant] = useState(null)
  
  const participantList = participants?.length > 0 
    ? participants.map(p => p.name || p)
    : DEFAULT_PARTICIPANTS

  const handleLogin = (participant) => {
    if (participant === 'Cyril') {
      // Cyril = Admin
      onLogin('admin')
    } else {
      onLogin(participant)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-2">⚽</h1>
            <h2 className="text-4xl font-bold text-gray-800 mb-2">FPL Draft Fantasy</h2>
            <p className="text-gray-600">Sélectionne ton nom pour te connecter</p>
          </div>

          {/* Participants Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {participantList.map((participant) => (
              <button
                key={participant}
                onClick={() => handleLogin(participant)}
                className={`p-4 rounded-lg font-semibold transition-all duration-200 ${
                  participant === 'Cyril'
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-105 border-2 border-purple-600'
                    : 'bg-blue-50 text-blue-900 hover:bg-blue-100 hover:scale-105 border-2 border-blue-200'
                }`}
              >
                <div className="text-2xl mb-1">
                  {participant === 'Cyril' ? '👑' : '⚽'}
                </div>
                <div className="text-sm">{participant}</div>
                {participant === 'Cyril' && (
                  <div className="text-xs mt-1 opacity-90">Admin</div>
                )}
              </button>
            ))}
          </div>

          {/* Info message */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">💡 Astuce:</span> Si tu es Cyril, tu accéderas au panel d'admin pour configurer et lancer la draft.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white text-sm">
          <p>FPL Draft v1.0 - Snake Draft en temps réel</p>
        </div>
      </div>
    </div>
  )
}
