# Deploy in 15 minutes (two free services)

Backend (Render) + Frontend (Vercel). Do the backend first.

## A. Push to GitHub
```
cd DraftMate_Integrated_Deployable
git init && git add . && git commit -m "DraftMate" && git branch -M main
git remote add origin https://github.com/<you>/draftmate.git && git push -u origin main
```
(.env and node_modules are git-ignored. Never commit API keys.)

## B. Backend on Render
1. render.com -> New + -> Blueprint -> pick the repo (it reads render.yaml).
2. Environment: add GEMINI_API_KEY (or OPENAI_API_KEY / ANTHROPIC_API_KEY).
3. Wait for deploy. Open https://<name>.onrender.com/api/health -> {"ok":true}
   Also check /api/models and /docs.

## C. Frontend on Vercel
1. vercel.com -> Add New Project -> same repo.
2. Root Directory: frontend    (Framework: Next.js, auto-detected)
3. Environment Variable: NEXT_PUBLIC_API_URL = https://<name>.onrender.com   (no trailing slash)
4. Deploy. Open the Vercel URL. Top bar must say "Live backend".

## D. Before the demo
- Open the Render URL /api/health 2 minutes early (free tier sleeps).
- Test in Chrome: Run guided demo, voice, export.
- If the backend is down the UI falls back to demo data automatically.
