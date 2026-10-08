import { useState, useEffect, useRef } from 'react'
import { supabase, getDraftConfig, getDraftState, subscribeToDraftState, subscribeToDraftedPlayers, getAllDraftedPlayers, resetDraft } from './utils/supabase'
import LoginScreen from './components/LoginScreen'
import AdminPanel from './components/AdminPanel'
import DraftBoard from './components/DraftBoard'
import Recap from './components/Recap'
import './App.css'

export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [draftConfig, setDraftConfig] = useState(null)
  const [draftState, setDraftState] = useState(null)
  const [draftedPlayers, setDraftedPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const subscriptionRef = useRef(null)


  // Retrouver automatiquement le participant connecté
  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        const { data: { user }, error: authError } =
          await supabase.auth.getUser()

        if (authError && user) throw authError
        if (!user) return

        const { data, error } =
          await supabase.rpc('get_my_fpl_identity')

        if (error) throw error

        const names = {
          vince: 'Vince',
          cyril: 'Cyril',
          steve: 'Steve',
          clement: 'Clément',
          jeremy: 'Jeremy',
          florent: 'Florent',
          bex: 'Bex',
          mathieu: 'Mathieu'
        }

        if (!cancelled && data?.participant_id) {
          const name = names[data.participant_id]

          if (name) {
            setCurrentUser(
              data.is_admin && data.participant_id === 'cyril'
                ? 'admin'
                : name
            )
          }
        }
      } catch (error) {
        console.error('Restauration de session :', error)
      } finally {
        if (!cancelled) setAuthLoading(false)
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  // Déconnexion et libération du participant
  const handleLogout = async () => {
    if (!window.confirm('Te déconnecter et libérer ton prénom ?')) {
      return
    }

    try {
      const { error: leaveError } =
        await supabase.rpc('leave_fpl_draft')

      if (leaveError) throw leaveError

      const { error: signOutError } =
        await supabase.auth.signOut()

      if (signOutError) throw signOutError

      setCurrentUser(null)
    } catch (error) {
      console.error('Erreur de déconnexion :', error)
      alert(error.message || 'Impossible de se déconnecter')
    }
  }

  // Charger la config et l'état initial
  useEffect(() => {
    async function initializeApp() {
      try {
        const config = await getDraftConfig()
        setDraftConfig(config)

        const state = await getDraftState()
        setDraftState(state)

        const drafted = await getAllDraftedPlayers()
        setDraftedPlayers(drafted || [])

        // Subscribe to real-time updates
        const stateSubscription = subscribeToDraftState((newState) => {
          setDraftState(newState)
        })

        const playerSubscription = subscribeToDraftedPlayers((newPlayer) => {
          setDraftedPlayers(prev => {
            const exists = prev.find(p => p.id === newPlayer.id)
            if (exists) return prev
            return [...prev, newPlayer]
          })
        })

        subscriptionRef.current = [stateSubscription, playerSubscription]
      } catch (error) {
        console.error('Erreur initialisation:', error)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.forEach(sub => {
  if (sub) supabase.removeChannel(sub)
})
      }
    }
  }, [])

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de la draft...</p>
        </div>
      </div>
    )
  }

  // Pas de user connecté
  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} participants={draftConfig?.participants_list} />
  }

  // Admin panel
  if (currentUser === 'admin' && draftState?.status !== 'in_progress' && draftState?.status !== 'completed') {
  return (
    <AdminPanel
      onLogout={handleLogout}
      draftConfig={draftConfig}
      onReset={() => resetDraft()}
      onStarted={async () => {
        const config = await getDraftConfig()
        const state = await getDraftState()

        setDraftConfig(config)
        setDraftState(state)
      }}
    />
  )
}

  // Draft terminée
  if (draftState?.status === 'completed') {
    return <Recap draftedPlayers={draftedPlayers} participants={draftConfig?.participants_list} onReset={() => {
      resetDraft()
      setDraftedPlayers([])
      setCurrentUser(null)
    }} />
  }

  // Draft en attente (pas lancée)
  if (draftState?.status === 'waiting') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">⚽ FPL Draft Fantasy</h1>
          <p className="text-gray-600 mb-6">En attente du lancement de la draft...</p>
          <p className="text-sm text-gray-500">Connecté en tant que: <span className="font-semibold text-blue-600">{currentUser}</span></p>
        </div>
      </div>
    )
  }

  // Draft en cours
  return (
    <DraftBoard 
      currentUser={currentUser === 'admin' ? 'Cyril' : currentUser}
      draftState={draftState}
      draftConfig={draftConfig}
      draftedPlayers={draftedPlayers}
      onLogout={handleLogout}
    />
  )
}
