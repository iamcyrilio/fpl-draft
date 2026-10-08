# 🏗️ Architecture FPL Draft Fantasy

## Tech Stack

```
Frontend: React 18 + Vite
Styling: Tailwind CSS
Real-time: Supabase (PostgreSQL + Realtime WebSocket)
Deployment: GitHub Pages (static) + GitHub Actions (CI/CD)
```

## Data Model

### Tables Supabase

#### `draft_config`
Stocke la configuration globale de la draft
```json
{
  "id": 1,
  "participants_list": [
    {"id": "cyril", "name": "Cyril"},
    {"id": "marc", "name": "Marc"},
    ...
  ],
  "draft_orders": {
    "Gardien": ["cyril", "marc", ...],
    "Défenseur": ["marc", "cyril", ...],
    "Milieu": [...],
    "Attaquant": [...]
  },
  "picks_required": {
    "Gardien": 2,
    "Défenseur": 6,
    "Milieu": 6,
    "Attaquant": 4
  }
}
```

#### `draft_state`
État actuel de la draft (qui joue, tour, temps restant)
```json
{
  "id": 1,
  "status": "in_progress", // waiting, in_progress, completed
  "current_turn": 0,
  "current_position": "Gardien",
  "current_participant_id": "cyril",
  "time_remaining": 30
}
```

#### `drafted_players`
Historique de chaque joueur drafté
```json
{
  "id": 1,
  "player_id": 123,
  "player_name": "Haaland",
  "player_position": "Attaquant",
  "player_club": "Man. City",
  "player_cote": 42,
  "drafted_by": "cyril",
  "round": 1,
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### `participants` (optionnel - future amélioration)
Pour stocker les stats de chaque participant

### Local Data

#### `src/data/players.json`
538 joueurs Premier League avec:
- `id`: numéro unique
- `name`: nom du joueur
- `position`: Gardien, Défenseur, Milieu, Attaquant
- `club`: club du joueur
- `cote`: valeur du joueur (utilisée pour auto-draft)
- `note`: rating
- `buts`: nombre de buts
- `titularise`: % de titularisation

---

## Component Tree

```
App
├── LoginScreen
│   └── Sélection du participant
│
├── AdminPanel (Cyril only)
│   ├── Participants list
│   ├── Draft order generator
│   └── Launch button
│
├── DraftBoard (Pendant la draft)
│   ├── Header (stats)
│   ├── Position tabs
│   ├── Players grid
│   │   └── PlayerCard x N
│   └── Sidebar
│       ├── Current team
│       └── Leaderboard
│
└── Recap (Après la draft)
    ├── Participant selector
    ├── Team details
    └── Summary stats
```

---

## State Management

**Global State (React Context)** - Potentiel amélioration
```javascript
{
  currentUser: "cyril",
  draftConfig: {...},
  draftState: {...},
  draftedPlayers: [...],
  loading: false
}
```

**Supabase Real-time Subscriptions**
- `draft_state` - Mis à jour instantanément pour tous
- `drafted_players` - Sync temps réel des picks
- Fallback polling toutes les 2s si WebSocket fail

---

## Flow: Snake Draft

### Ordre de Draft par Tour
```
Tour 1: 1-2-3-4-5-6-7-8
Tour 2: 8-7-6-5-4-3-2-1  (inversé)
Tour 3: 1-2-3-4-5-6-7-8
Tour 4: 8-7-6-5-4-3-2-1
...
```

### Calcul du participant suivant
```javascript
round = Math.floor(currentTurn / nbParticipants)
indexInRound = currentTurn % nbParticipants

if (round % 2 === 1) {
  indexInRound = nbParticipants - 1 - indexInRound  // Inverse
}

nextParticipant = draftOrder[indexInRound]
```

---

## Timer & Auto-Draft

**Client-side Timer:**
- Compte de 30 à 0 secondes
- Quand timer atteint 0:
  1. Récupère les joueurs disponibles pour la position courante
  2. Trie par cote décroissante
  3. Auto-draft le premier (meilleur)
  4. Passe au tour suivant

---

## Real-time Sync

### WebSocket (Supabase Realtime)
```javascript
// Subscribe to state changes
supabase.from('draft_state')
  .on('*', payload => {
    setDraftState(payload.new)
  })
  .subscribe()
```

### Polling Fallback
- Si WebSocket échoue, polling toutes les 2s
- Fallback transparent pour l'utilisateur

---

## Positions & Quotas

| Position  | Nombre | Icone |
|-----------|--------|-------|
| Gardien   | 2      | 🥅    |
| Défenseur | 6      | 🛡️    |
| Milieu    | 6      | ⚙️    |
| Attaquant | 4      | 🎯    |
| **Total** | **18** |       |

Total picks = 8 participants × 18 joueurs = 144 picks

---

## File Structure

```
fpl-draft/
├── src/
│   ├── components/
│   │   ├── LoginScreen.jsx      # Écran de login
│   │   ├── AdminPanel.jsx        # Panel Cyril
│   │   ├── DraftBoard.jsx        # Tableau draft
│   │   ├── PlayerCard.jsx        # Carte joueur
│   │   └── Recap.jsx             # Récap final
│   │
│   ├── utils/
│   │   ├── supabase.js           # Client Supabase + requêtes
│   │   └── helpers.js            # Utilitaires (snake draft, export, etc)
│   │
│   ├── data/
│   │   └── players.json          # 538 joueurs
│   │
│   ├── App.jsx                   # Root component
│   ├── App.css                   # Global styles
│   └── main.jsx                  # Entry point
│
├── supabase/
│   └── init.sql                  # Schema DB
│
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions CI/CD
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── QUICKSTART.md
├── SETUP.md
└── ARCHITECTURE.md
```

---

## Flow Utilisateur

### 1. Login
```
Utilisateur arrive
→ Sélectionne son nom
→ Si Cyril: AdminPanel
→ Sinon: Attente écran loading
```

### 2. Configuration (Cyril only)
```
AdminPanel
→ Vérifie les 8 participants
→ Génère ordres aléatoires par poste
→ Lance la draft
```

### 3. Draft
```
Participant connecté
→ Voit les joueurs de la position courante
→ 30s pour choisir
→ Si timeout: auto-draft meilleure cote
→ Joueur disparaît en temps réel
→ Position passe au suivant
→ Quand position complète: passe poste suivant
```

### 4. Recap
```
Tous les 18 joueurs pické
→ Affiche équipes complètes
→ Possibilité exporter JSON
```

---

## Améliorations Futures

- [ ] Dark mode
- [ ] Stats détaillées (cotes par round, tendances)
- [ ] Undo derniers picks (Admin only)
- [ ] Draft simulée (sandbox mode)
- [ ] Notifications push
- [ ] Chat entre participants
- [ ] Sauvegarde multi-draft (historique)
- [ ] API pour intégrations externes
- [ ] Mobile app native

---

## Déploiement

### Local
```bash
npm run dev
```

### Build
```bash
npm run build  # → dist/
npm run preview  # Test du build
```

### Deploy GitHub Pages
```bash
npm run deploy  # Pousse dist/ vers gh-pages branch
```

Automatisé via GitHub Actions sur chaque push à `main`.

---

## Performance

- **Bundle size**: ~250KB (non-gzipped)
- **Page load**: <2s sur 4G
- **Real-time latency**: <100ms (WebSocket)
- **Polling fallback**: 2s max

---

Voir les fichiers source pour plus de détails! 🚀
