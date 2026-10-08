# 🚀 Guide de Setup - FPL Draft Fantasy

## Étape 1: Créer un compte Supabase (2 minutes)

1. Va sur [supabase.com](https://supabase.com)
2. Clique sur "Start your project"
3. Sign up avec ton email
4. Crée une organisation (ou entre dans une existante)
5. Clique sur "New project"
   - Choisis un nom (ex: `fpl-draft`)
   - Choisis la région la plus proche (ex: Europe - Frankfurt)
   - Crée un mot de passe fort
   - Clique "Create new project"

**Attends 2-3 minutes que le projet se crée...**

---

## Étape 2: Initialiser la base de données (3 minutes)

Une fois ton projet créé:

1. Ouvre l'onglet **"SQL Editor"** (à gauche)
2. Clique sur **"New Query"**
3. Copy/paste le **contenu complet** du fichier `supabase/init.sql`
4. Clique sur **"Run"** (triangle ▶ en haut à droite)
5. Attends que ça s'exécute (tu dois voir un checkmark ✓)

**✅ Tables créées!**

---

## Étape 3: Récupérer tes credentials Supabase (2 minutes)

1. Clique sur **"Settings"** (engrenage en bas à gauche)
2. Clique sur **"API"** dans le menu
3. Copie:
   - `Project URL` (copie toute l'URL)
   - `anon public` (sous "Project API keys")

Tu vas les utiliser à l'étape suivante.

---

## Étape 4: Setup local (3 minutes)

### 4a. Clone ou télécharge ce repo

```bash
git clone https://github.com/TON_USERNAME/fpl-draft.git
cd fpl-draft
```

### 4b. Crée un fichier `.env.local` à la racine

Crée un nouveau fichier appelé `.env.local` (attention: point au début!)

Colle ça dedans (remplace les valeurs par les tiennes):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Exemple concret:**
```env
VITE_SUPABASE_URL=https://abcdef123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4c. Installe les dépendances

```bash
npm install
```

### 4d. Lance le site en local

```bash
npm run dev
```

Tu verras quelque chose comme:
```
  VITE v5.0.0  ready in 123 ms

  ➜  Local:   http://localhost:5173/
```

Ouvre `http://localhost:5173/` dans ton navigateur 🎉

---

## Étape 5: Déployer sur GitHub Pages (5 minutes)

### 5a. Crée un repo GitHub public

- Va sur [github.com/new](https://github.com/new)
- Nomme-le `fpl-draft`
- Rends-le **public**
- Clique "Create repository"

### 5b. Push ton code

```bash
git remote add origin https://github.com/TON_USERNAME/fpl-draft.git
git branch -M main
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 5c. Ajoute les secrets GitHub

Ces secrets permettent à GitHub Actions d'accéder à Supabase lors du build.

1. Va dans: **Repo > Settings > Secrets and variables > Actions**
2. Clique sur **"New repository secret"**
3. Ajoute 2 secrets:

**Secret 1:**
- Name: `VITE_SUPABASE_URL`
- Value: (copie/colle ta URL Supabase)

**Secret 2:**
- Name: `VITE_SUPABASE_ANON_KEY`
- Value: (copie/colle ta clé anon)

### 5d. Active GitHub Pages

1. Va dans: **Repo > Settings > Pages**
2. Source: Change en **"GitHub Actions"**
3. C'est bon!

Le workflow va se lancer automatiquement. Attends ~2 minutes.

### 5e. Accède à ton site!

Une fois le workflow terminé, ton site sera à:

```
https://TON_USERNAME.github.io/fpl-draft/
```

**Remplace `TON_USERNAME` par ton username GitHub!**

---

## 🎮 Utilisation

### Avant la draft
1. **Cyril** ouvre le site et clique sur lui-même → Panel Admin
2. Clique "Générer aléatoirement" pour créer l'ordre de draft pour chaque poste
3. Clique "LANCER LA DRAFT" ✅

### Pendant la draft
1. Chaque participant clique sur son nom pour se connecter
2. Vous voyez tous les joueurs disponibles en temps réel
3. Quand c'est ton tour, tu as 30 secondes pour choisir
4. Si tu fais rien, le meilleur joueur (cote) est auto-drafté
5. Les joueurs drafté disparaissent pour tout le monde instantanément

### Après la draft
- Récap auto-généré avec l'équipe de chacun
- Option pour télécharger en JSON

---

## 🐛 Troubleshooting

### "CORS Error" ou "Unauthorized"
→ Supabase CORS mal configuré
- Va dans Supabase: Settings > API > CORS allowed origins
- Ajoute `*` (dev) ou ton domaine exact (prod)

### "Table not found"
→ Pas exécuté `init.sql`
- Retourne à Supabase SQL Editor et lance la script

### Realtime pas marche
→ Realtime pas activé sur les tables
- Supabase: Table Properties > Realtime > Enable pour chaque table

### Env vars pas loadées
→ `.env.local` mal nommé ou mauvaise location
- Vérifie que c'est `.env.local` (pas `.env`)
- Doit être à la racine (même niveau que `package.json`)
- Restart le dev server après création

### Draft pas sync en temps réel
→ WebSocket fail, fallback à polling
- Regarde la console F12 pour les erreurs
- Vérifie que Supabase Realtime est activé

---

## 📝 Notes dev

- **538 joueurs** Premier League avec stats (cote, note, club, etc.)
- **8 participants** configurables
- **Snake draft** par poste (ordre différent par position)
- **Timer 30s** auto-draft si timeout
- **Real-time sync** via Supabase WebSocket + polling fallback
- **Récap JSON** exportable

---

## 🚨 Questions?

- Check les logs: `F12 > Console`
- Vérifie que ton `.env.local` est setup
- Regarde que Supabase est réachable (Status page)
- Contacte le dev (Cyril) si ça marche pas!

Enjoy la draft! 🎉⚽
