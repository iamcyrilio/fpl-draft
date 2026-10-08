# ⚡ Quick Start (5 min)

## 1️⃣ Supabase Setup

- Go to [supabase.com](https://supabase.com) → Create project
- In **SQL Editor** → Run `supabase/init.sql`
- In **Settings > API** → Copy `Project URL` + `anon key`

## 2️⃣ Local Setup

```bash
npm install
```

Create `.env.local`:
```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

```bash
npm run dev
```

Open `http://localhost:5173`

## 3️⃣ Deploy to GitHub Pages

```bash
git remote add origin https://github.com/YOUR_USERNAME/fpl-draft.git
git push -u origin main
```

**Add GitHub Secrets:**
- Settings > Secrets and variables > Actions
- Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

**Enable GitHub Pages:**
- Settings > Pages > Source: GitHub Actions

✅ Your site: `https://YOUR_USERNAME.github.io/fpl-draft/`

---

## 🎮 Usage

1. **Cyril** logs in → Generates draft orders → Clicks "LANCER LA DRAFT"
2. **Others** log in with their name → Can draft!
3. **Auto-draft** kicks in after 30s of inactivity
4. **Recap** shows up when everyone's done

---

See `SETUP.md` for detailed instructions & troubleshooting
