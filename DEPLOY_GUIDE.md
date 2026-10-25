# DraftMate integrated deployment

## What is integrated
- Member 1: browser UI delivered by FastAPI from `/` (the source archive did not include the full React application source files, so this deployment uses the provided Member 4 demo UI, enhanced with the Member 2 drafting controls).
- Member 2: skill catalog, skill routing, streaming draft endpoint, edit endpoint, style profiler, model gateway and model availability endpoint.
- Member 3: citation extraction/matching/scoring API (`/verify`, `/extract`) plus the context manager connected to the M2 context bridge. A copy of the original Member 3 implementation pack is preserved in `member3_pack/`.
- Member 4: browser voice agent, confirmation gate/action queue, document conversion/export to DOCX/PDF, Docker and deployment config.

## Deploy to a public URL (Render)
1. Create a GitHub repository and upload the contents of this folder (not the ZIP itself). Do not upload `.env`, API keys, `.venv`, or `node_modules`.
2. In Render, choose **New + → Blueprint** and connect that repository. Render reads `render.yaml` and creates the `draftmate-ai` web service.
3. In the Render service's **Environment** settings, add `GEMINI_API_KEY` with your own valid Google AI Studio key. Alternatively add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` if you want those configured providers. Never put the key in frontend JavaScript or commit it.
4. Wait for the deploy to finish. Open the public `https://<service-name>.onrender.com` URL shown by Render. The same URL serves the site, API and `/docs`.
5. Check `/health`, `/api/models`, then test drafting, voice, verify, and export. Voice input requires a browser with Web Speech API support; Chrome is recommended.

## Important deployment caveats
- I cannot create the public URL directly from this workspace because it requires signing in to your hosting account and connecting a repository. This package includes a Render Blueprint so the public URL is created by Render after you authorize deployment.
- Without a model API key, the AI gateway intentionally uses an offline placeholder mode. Health, API docs, voice intent processing, citation triage and document export can still be exercised, but real LLM drafting needs a configured key.
- Citation verification is a triage aid, not legal advice or proof that a legal proposition is correct/current. Add authoritative source URLs and have a qualified person review outputs.
- Render free services may sleep after inactivity and have ephemeral local storage. Uploaded reference documents are stored in process memory for the current service session only; do not treat this demo as persistent document storage.
- The provided source archive had no populated `frontend/src` React app files. The deployable site therefore uses the available `frontend/public/index.html` interface and the voice JS. It is a functional integrated demo UI, not a claim that the missing React workspace has been reconstructed.
