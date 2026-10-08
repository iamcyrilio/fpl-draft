# ✅ Checklist - FPL Draft Fantasy v1.0

## Avant la draft (À faire une fois)

### Setup Supabase
- [ ] Créer compte Supabase
- [ ] Créer nouveau projet
- [ ] Exécuter `supabase/init.sql` dans SQL Editor
- [ ] Copier credentials dans `.env.local`

### Setup Local
- [ ] `npm install`
- [ ] Créer `.env.local` avec credentials
- [ ] `npm run dev` - Vérifie que ça marche localement

### Deploy GitHub
- [ ] Créer repo GitHub (public!)
- [ ] Push le code
- [ ] Ajouter 2 secrets GitHub (Supabase credentials)
- [ ] Activer GitHub Pages (Source: GitHub Actions)
- [ ] Attendre le déploiement (~2min)

### Test Production
- [ ] Ouvrir `https://YOUR_USERNAME.github.io/fpl-draft/`
- [ ] Vérifie que c'est accessible
- [ ] Cyril peut se connecter

---

## Jour de la draft

### 30 minutes avant
- [ ] Vérifie que le site est accessible
- [ ] Cyril accède au panel admin
- [ ] Vérifie que les 8 noms sont corrects

### 15 minutes avant
- [ ] Cyril génère les ordres aléatoires
- [ ] Vérifie les ordres (doivent être différents par poste)
- [ ] Tout le monde a son ordi/mobile prêt

### Lancement
- [ ] Cyril clique "LANCER LA DRAFT"
- [ ] Tout le monde rafraîchit la page (F5)
- [ ] Chacun sélectionne son nom
- [ ] Le 1er participant peut commencer
- [ ] ⏱️ Timer démarre automatiquement!

### Pendant la draft
- [ ] Les joueurs disparaissent instantanément (real-time)
- [ ] Timer 30s par pick
- [ ] Queue de joueurs fonctionne (⭐ button)
- [ ] Auto-draft kick-in après 30s
- [ ] Progression visible en temps réel

### Fin de la draft
- [ ] Récap automatique s'affiche
- [ ] Chacun voit son équipe complète
- [ ] Option télécharger en JSON

---

## Fonctionnalités Implémentées ✅

### Core
- [x] Login par nom (8 participants)
- [x] Admin panel (Cyril only)
- [x] Génération ordre aléatoire par poste
- [x] Snake draft (ordre inversé tous les 2 tours)
- [x] Timer 30s
- [x] Auto-draft au timeout (cote max)
- [x] Real-time sync Supabase
- [x] Joueurs disparaissent après draft

### UI/UX
- [x] Responsive design (mobile + desktop)
- [x] Tabs pour filtrer par position
- [x] Queue de joueurs avec filtre
- [x] Progression bar par participant
- [x] Leaderboard en temps réel
- [x] Équipe du joueur en sidebar

### Récap
- [x] Affichage équipe par position
- [x] Stats par participant
- [x] Export JSON
- [x] Total cotes par équipe

### Persistance
- [x] Sauvegarde état en Supabase (temps réel)
- [x] Récupération de l'état si refresh
- [x] Fallback polling si WebSocket fail

---

## Points À Vérifier

### Avant le lancement
- [ ] Supabase Realtime activé sur les tables
- [ ] CORS configuré en `*` (ou domaine exact si prod)
- [ ] GitHub Pages déployé et accessible
- [ ] Env vars loadées correctement

### Pendant le test
- [ ] Real-time sync entre plusieurs onglets
- [ ] Timer compte correctement
- [ ] Auto-draft fonctionne (30s timeout)
- [ ] Queue filtre correctement
- [ ] Joueurs disparaissent partout

### Après la draft
- [ ] Récap affiche tous les participants
- [ ] JSON exportable
- [ ] Cotes totales correctes

---

## FAQ Rapide

**Q: Pourquoi 30 secondes?**
A: Arbitraire mais équitable. À ajuster dans `DraftBoard.jsx` si besoin.

**Q: Peut-on changer l'ordre après le lancement?**
A: Pas en v1.0. Faut reset et relancer. À faire avant!

**Q: Que se passe si quelqu'un loses la connexion?**
A: L'état est sauvé en Supabase. Ils peuvent rafraîchir et reprendre.

**Q: Peut-on undoer un pick?**
A: Pas en v1.0. À ajouter si besoin (admin only).

**Q: Où sont les joueurs importés?**
A: 538 joueurs Premier League dans `src/data/players.json`

**Q: Comment partager le recap après?**
A: Télécharger en JSON, envoyer sur Discord/email, etc.

---

## Logs & Debugging

### Ouvrir la console
- F12 (Windows/Linux) ou Cmd+Option+I (Mac)
- Onglet "Console"

### Erreurs courantes
```
"CORS error"
→ Settings > API > CORS allowed origins

"Table not found"
→ init.sql pas exécuté

"Env not loaded"
→ .env.local mal nommé ou mauvaise location

"Realtime not working"
→ Pas activé sur les tables
```

---

## Après la draft

### Garder les données
- Dump le JSON du recap
- Sauvegarde sur ton ordi

### Pour relancer une draft
- Cyril clique "Reset"
- Les données anciennes sont supprimées
- Nouvelle draft peut commencer

### Amélioration
- Note les bugs/features manquantes
- Fork/clone pour faire des changements
- Redéploie à chaque modification

---

## Support

Si quelque chose casse:
1. Check la console (F12)
2. Regarde le status Supabase
3. Vérifie les env vars
4. Check la doc ARCHITECTURE.md
5. Contacte un dev si c'est vraiment casse!

---

**Bon courage pour la draft! 🎉⚽**
