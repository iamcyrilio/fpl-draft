import { Star } from 'lucide-react'

const POSITION_COLORS = {
  'Gardien': 'from-green-50 to-green-100 border-green-300',
  'Défenseur': 'from-blue-50 to-blue-100 border-blue-300',
  'Milieu': 'from-purple-50 to-purple-100 border-purple-300',
  'Attaquant': 'from-orange-50 to-orange-100 border-orange-300'
}

const POSITION_ICONS = {
  'Gardien': '🥅',
  'Défenseur': '🛡️',
  'Milieu': '⚙️',
  'Attaquant': '🎯'
}

export default function PlayerCard({ player, onDraft, onToggleQueue, isQueued, isCurrentUser, draftedBy }) {
  return (
    <div className={`relative bg-gradient-to-br ${POSITION_COLORS[player.position]} border-2 rounded-lg p-4 hover:shadow-lg transition-all duration-200 ${
      draftedBy ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
    }`}>
      {/* Queue Button */}
      <button
        onClick={onToggleQueue}
        className={`absolute top-2 right-2 p-2 rounded-lg transition-all ${
          isQueued
            ? 'bg-yellow-400 text-white shadow-md'
            : 'bg-white text-gray-400 hover:text-yellow-400'
        }`}
      >
        <Star size={18} fill={isQueued ? 'currentColor' : 'none'} />
      </button>

      {/* Position Badge */}
      <div className="mb-2">
        <span className="text-2xl">{POSITION_ICONS[player.position]}</span>
      </div>

      {/* Player Info */}
      <div className="mb-3">
        <h3 className="font-bold text-gray-800 text-sm leading-tight">{player.name}</h3>
        <p className="text-xs text-gray-600 mt-1">{player.club}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div className="bg-white bg-opacity-60 p-1 rounded">
          <div className="text-gray-600 font-semibold">Cote</div>
          <div className="font-bold text-gray-800">{player.cote}</div>
        </div>
        <div className="bg-white bg-opacity-60 p-1 rounded">
          <div className="text-gray-600 font-semibold">Note</div>
          <div className="font-bold text-gray-800">{player.note}</div>
        </div>
      </div>

      {/* Draft Button */}
      <button
        onClick={onDraft}
        disabled={!isCurrentUser || draftedBy}
        className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
          draftedBy
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : isCurrentUser
            ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer active:scale-95'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {draftedBy ? `Drafté par ${draftedBy}` : isCurrentUser ? 'Me le drafter' : 'En attente...'}
      </button>
    </div>
  )
}
