import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Initialiser la draft config


export async function initDraftConfig(participants, draftOrders) {
  const normalizedParticipants = participants.map(p => {
    const name = typeof p === 'string' ? p : p.name
    const id = typeof p === 'string'
      ? name.toLowerCase().replace(/\s+/g, '_')
      : p.id

    return { id, name }
  })

  const { error: participantsError } = await supabase
    .from('participants')
    .upsert(normalizedParticipants, { onConflict: 'id' })

  if (participantsError) throw participantsError

  const { data, error } = await supabase
    .from('draft_config')
    .update({
      participants_list: normalizedParticipants,
      draft_orders: draftOrders,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)
    .select()
    .single()

  if (error) throw error
  return data
}



// Récupérer config actuelle
export async function getDraftConfig() {
  const { data, error } = await supabase
    .from('draft_config')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) throw error
  return data
}

// Récupérer l'état de la draft
export async function getDraftState() {
  const { data, error } = await supabase
    .from('draft_state')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) throw error
  return data
}

// Mettre à jour l'état de la draft
export async function updateDraftState(updates) {
  const { data, error } = await supabase
    .from('draft_state')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', 1)
    .select()

  if (error) throw error
  return data
}

// Enregistrer un pick
export async function recordDraft(playerId, playerData, participantId, round) {
  const { data, error } = await supabase
    .from('drafted_players')
    .insert([{
      player_id: playerId,
      player_name: playerData.name,
      player_position: playerData.position,
      player_club: playerData.club,
      player_cote: playerData.cote,
      drafted_by: participantId,
      round: round,
    }])

  if (error) throw error
  return data
}

// Récupérer tous les picks
export async function getAllDraftedPlayers() {
  const { data, error } = await supabase
    .from('drafted_players')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

// Subscribe to draft state changes
export function subscribeToDraftState(callback) {
  const subscription = supabase
    .from('draft_state')
    .on('*', payload => {
      callback(payload.new)
    })
    .subscribe()

  return subscription
}

// Subscribe to drafted players changes
export function subscribeToDraftedPlayers(callback) {
  const subscription = supabase
    .from('drafted_players')
    .on('*', payload => {
      callback(payload.new)
    })
    .subscribe()

  return subscription
}

// Lancer la draft (admin)

export async function startDraft() {
  const config = await getDraftConfig()

  const firstParticipant =
    config.draft_orders?.['Gardien']?.[0]

  if (!firstParticipant) {
    throw new Error(
      'Aucun premier participant défini pour les gardiens'
    )
  }

  return updateDraftState({
    status: 'in_progress',
    current_turn: 0,
    current_position: 'Gardien',
    current_participant_id: firstParticipant,
    time_remaining: 30,
  })
}


// Réinitialiser la draft
export async function resetDraft() {
  // Vider les tables
  await supabase.from('drafted_players').delete().neq('id', -1)
  
  return updateDraftState({
    status: 'waiting',
    current_turn: 0,
    current_position: 'Gardien',
    current_participant_id: null,
    time_remaining: 30,
  })
}
