
import { useState } from 'react'
import { supabase } from '../utils/supabase'

const PARTICIPANTS = [
  { id: 'vince', name: 'Vince' },
  { id: 'cyril', name: 'Cyril' },
  { id: 'steve', name: 'Steve' },
  { id: 'clement', name: 'Clément' },
  { id: 'jeremy', name: 'Jeremy' },
  { id: 'florent', name: 'Florent' },
  { id: 'bex', name: 'Bex' },
  { id: 'mathieu', name: 'Mathieu' }
]

export default function LoginScreen({ onLogin }) {
  const [selected, setSelected] = useState('')
  const [code, setCode] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()

    if (!selected || !code.trim()) return

    setLoading(true)
    setError('')

    try {
      // Reutiliser une session existante si possible
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError && userData?.user) {
        throw userError
      }

      if (!userData?.user) {
        const { error: authError } =
          await supabase.auth.signInAnonymously()

        if (authError) throw authError
      }

      // Verification du code et du participant
      const { data, error: joinError } =
        await supabase.rpc('join_fpl_draft', {
          p_participant_id: selected,
          p_code: code,
          p_admin_code: selected === 'cyril'
            ? adminCode
            : null
        })

      if (joinError) throw joinError

      if (!data?.success) {
        throw new Error('Connexion non autorisée')
      }

      const participant = PARTICIPANTS.find(
        p => p.id === data.participant_id
      )

      if (!participant) {
        throw new Error('Participant inconnu')
      }

      onLogin(
        data.is_admin ? 'admin' : participant.name
      )

    } catch (err) {
      setError(
        err.message || 'Impossible de rejoindre la draft'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg">

        <div className="text-center mb-8">
          <h1 className="text-5xl mb-3">⚽</h1>
          <h2 className="text-3xl font-bold text-gray-800">
            FPL Draft Fantasy
          </h2>
          <p className="text-gray-500 mt-2">
            Rejoins la draft entre amis
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block font-semibold mb-2">
              Ton prénom
            </label>
            <select
              value={selected}
              onChange={e => setSelected(e.target.value)}
              required
              className="w-full border rounded-lg p-3"
            >
              <option value="">Choisis ton prénom</option>
              {PARTICIPANTS.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-2">
              Code de la draft
            </label>
            <input
              type="password"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              autoComplete="off"
              placeholder="Code reçu sur WhatsApp"
              className="w-full border rounded-lg p-3"
            />
          </div>

          {selected === 'cyril' && (
            <div>
              <label className="block font-semibold mb-2">
                Code administrateur
              </label>
              <input
                type="password"
                value={adminCode}
                onChange={e => setAdminCode(e.target.value)}
                required
                autoComplete="off"
                placeholder="Code réservé à Cyril"
                className="w-full border rounded-lg p-3"
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-red-600 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !selected || !code.trim()}
            className="w-full bg-blue-600 text-white rounded-lg p-4 font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Rejoindre la draft'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-400 mt-6">
          8 participants • Snake Draft • Premier League
        </p>
      </div>
    </div>
  )
}
