import players from '../data/players.json'

// Obtenir le prochain joueur de l'ordre de draft (snake draft)
export function getNextDraftParticipant(currentTurn, draftOrder, position) {
  const round = Math.floor(currentTurn / draftOrder.length)
  let indexInRound = currentTurn % draftOrder.length

  // Snake draft: inverse le sens tous les 2 tours
  if (round % 2 === 1) {
    indexInRound = draftOrder.length - 1 - indexInRound
  }

  return draftOrder[indexInRound]
}

// Récupérer les joueurs disponibles pour une position
export function getAvailablePlayers(position, draftedPlayerIds) {
  return players
    .filter(p => p.position === position && !draftedPlayerIds.includes(p.id))
    .sort((a, b) => b.cote - a.cote) // Trier par cote décroissante
}

// Obtenir le meilleur joueur disponible (pour timeout)
export function getBestAvailablePlayer(position, draftedPlayerIds) {
  const available = getAvailablePlayers(position, draftedPlayerIds)
  return available.length > 0 ? available[0] : null
}

// Générer un récap de draft
export function generateDraftRecap(draftedPlayers, participants, positions = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant']) {
  const recap = {}

  participants.forEach(p => {
    recap[p.name] = {
      name: p.name,
      teams: {}
    }
    positions.forEach(pos => {
      recap[p.name].teams[pos] = []
    })
  })

  draftedPlayers.forEach(draft => {
    const participant = participants.find(p => p.id === draft.drafted_by)
    if (participant && recap[participant.name]) {
      recap[participant.name].teams[draft.player_position].push({
        name: draft.player_name,
        club: draft.player_club,
        cote: draft.player_cote,
        round: draft.round,
      })
    }
  })

  return recap
}

// Exporter le récap en JSON
export function exportRecapAsJSON(recap, filename = 'draft-recap.json') {
  const element = document.createElement('a')
  element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(recap, null, 2)))
  element.setAttribute('download', filename)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}

// Compter les picks d'un participant
export function countParticipantPicks(participantId, draftedPlayers, position) {
  return draftedPlayers.filter(
    d => d.drafted_by === participantId && d.player_position === position
  ).length
}

// Vérifier si un participant a fini (tous les postes remplis)
export function isParticipantDone(participantId, draftedPlayers, requiredPicks) {
  let isDone = true
  Object.entries(requiredPicks).forEach(([position, count]) => {
    const picked = countParticipantPicks(participantId, draftedPlayers, position)
    if (picked < count) isDone = false
  })
  return isDone
}

// Générer l'ordre de draft pour un poste (aléatoire)
export function generateDraftOrder(participants) {
  const shuffled = [...participants].sort(() => 0.5 - Math.random())
  return shuffled.map(p => p.id || p.toLowerCase().replace(/\s+/g, '_'))
}

// Mapper les noms courts pour les IDs
export function getParticipantId(name) {
  return name.toLowerCase().replace(/\s+/g, '_')
}

export function getParticipantName(id, participants) {
  const p = participants.find(p => (p.id || p.toLowerCase().replace(/\s+/g, '_')) === id)
  return p?.name || p
}
