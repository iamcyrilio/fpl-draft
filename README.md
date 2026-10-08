# ⚽ FPL Draft Fantasy

Plateforme de draft fantasy pour 8 participants en snake draft. Support temps réel avec Supabase, timer 30s par pick, queue de joueurs, et récap final.

## 🚀 Setup (5 minutes)

### 1. Créer un compte Supabase (gratuit)
- Va sur [supabase.com](https://supabase.com)
- Crée un compte, puis une organisation
- Crée un nouveau projet (choisis la région la plus proche)

### 2. Initialiser la base de données
Une fois le projet créé:
- Ouvre l'onglet "SQL Editor"
- Copy/paste le contenu de `supabase/init.sql`
- Exécute la requête

### 3. Récupérer tes credentials
- Va dans Settings > API
- Copie `Project URL` et `anon public`
- Crée un fichier `.env.local` à la racine du projet:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 4. Installer et lancer en local
```bash
npm install
npm run dev
```

Visite `http://localhost:5173` 🎉

### 5. Déployer sur GitHub Pages

#### 5a. Crée un repo GitHub public
```bash
git remote add origin https://github.com/TON_USERNAME/fpl-draft.git
git branch -M main
git push -u origin main
```

#### 5b. Ajoute les secrets GitHub
- Repo > Settings > Secrets and variables > Actions > New repository secret
- Ajoute 2 secrets:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

#### 5c. Active GitHub Pages
- Repo > Settings > Pages
- Source: GitHub Actions
- Deploy ✅

Ton site sera en direct à: `https://TON_USERNAME.github.io/fpl-draft/`

---

## 📋 Utilisation

### Avant la draft
1. **Cyril** va sur le site → Clique sur "Admin Panel"
2. Entre les 8 noms des participants
3. Dans chaque poste (Gardien, Défenseur, Milieu, Attaquant), rentre l'ordre de draft aléatoire
   - Ex: `Cyril, Marc, Sophie, Alex, Jordan, Léa, Thomas, Nina`
4. Clique "Lancer la draft" ✅

### Pendant la draft
1. Chaque participant se connecte avec son nom
2. Queue de joueurs: clique sur ⭐ pour favoriser un joueur
3. Filtre par position et par queue
4. 30 secondes pour picker → sinon auto-draft de la meilleure cote restante
5. Les picks disparaissent en temps réel pour tout le monde

### Après la draft
- Récap auto-généré avec l'équipe complète de chaque joueur
- Export en JSON possible pour analyse

---

## 🛠 Tech Stack

- **Frontend:** React 18 + Vite + TypeScript
- **Real-time:** Supabase (Postgres + Realtime)
- **UI:** Tailwind CSS
- **Deploy:** GitHub Pages (auto via GitHub Actions)

## 📁 Structure

```
fpl-draft/
├── src/
│   ├── components/
│   │   ├── LoginScreen.jsx
│   │   ├── AdminPanel.jsx
│   │   ├── DraftBoard.jsx
│   │   ├── PlayerCard.jsx
│   │   └── Recap.jsx
│   ├── utils/
│   │   ├── supabase.js
│   │   └── helpers.js
│   ├── App.jsx
│   └── main.jsx
├── supabase/
│   └── init.sql
├── .env.local (git ignored)
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🔧 Troubleshooting

**"CORS Error"** → Supabase CORS mal config
- Settings > API > CORS allowed origins
- Ajoute `*` (dev) ou ton domaine exact (prod)

**"Table not found"** → Pas exécuté `init.sql`
- Retourne à Supabase SQL Editor et lance la script

**"Real-time pas marche"** → Supabase Realtime pas activé
- Table Properties > Realtime > Enable

---

## 📝 Notes

- Les joueurs sont stockés en JSON local (538 joueurs Premier League)
- L'état de la draft est sauvegardé en Supabase en temps réel
- Auto-refresh toutes les 2s si WebSocket fail (fallback)
- Timeout à 30s par pick = auto-draft du meilleur joueur restant par cote
- Récap généré à la fin = JSON téléchargeable

---

Besoin d'aide? Check les logs en ouvrant DevTools (F12 > Console)
