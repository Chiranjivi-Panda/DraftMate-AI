# DraftMate

**AI-assisted drafting workspace with verification, voice control, and export.**

This repository integrates work from all four members. **Member 4** (Voice, Docs & DevOps) deliverables are complete and wired to Member 3’s verification engine.

---

## Quick start

```bash
# Install
pip install -r requirements.txt

# Run API (verification + voice + docs)
export PYTHONPATH=.
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Open API docs
open http://127.0.0.1:8000/docs

# Demo UI (static)
# Serve frontend/public (or open index.html; needs API on :8000)
# Or: docker compose -f docker/docker-compose.yml up --build
```

Smoke test everything Member 4 owns:

```bash
bash scripts/demo.sh
```

---

## Member responsibilities

| Member | Focus | Status in this tree |
|--------|--------|---------------------|
| **1** Frontend & UX | 3-pane workspace, TipTap, SSE, skill UI | Demo page + voice JS ready for embed |
| **2** AI Core & Skills | Skill engine, LLM gateway, style profiler | ActionQueue ready for skill handlers |
| **3** Verification & Context | Extractor, matcher, scorer, BM25, panel API | Included (`verification/`, `context/`) |
| **4** Voice, Docs & DevOps | **This deliverable** | Complete |

---

## Member 4 deliverables

### Hard — Voice Agent

| Component | Location | Notes |
|-----------|----------|--------|
| Web Speech client | `frontend/src/voiceAgent.js` | SpeechRecognition + SpeechSynthesis |
| Intent parser | `voice/intent_parser.py` | Pattern table + confidence |
| Action queue | `voice/action_queue.py` | FIFO, statuses, handlers |
| Confirm gate | `voice/confirm_gate.py` | Blocks edit / run_skill until confirm |
| API | `POST /voice/process`, `GET /voice/status` | In `backend/main.py` |

**Example utterances**

- `verify citations` → executes immediately  
- `export as PDF` → executes  
- `edit the text to make it formal` → **awaiting confirm** → say `confirm` or `cancel`  
- `run skill clause-check` → awaiting confirm  
- `help` → spoken command list  

### Medium — Document Pipeline

| Component | Location |
|-----------|----------|
| MarkItDown converter | `docs_pipeline/converter.py` |
| DOCX / PDF exporter | `docs_pipeline/exporter.py` |
| Verification Summary | Appended as final section/page in both formats |
| API | `POST /docs/export` (body: content, format, optional verification JSON) |

Colour-coded match status cells (green / amber / red) appear in the summary table.

### Polish — DevOps & packaging

| Item | Path |
|------|------|
| Dockerfile | `docker/Dockerfile` |
| Compose (API + nginx UI) | `docker/docker-compose.yml` |
| CI-lite | `ci/github-actions-lite.yml` → copy to `.github/workflows/ci.yml` |
| Demo script | `scripts/demo.sh` |
| Slides | `docs/DraftMate_Member4_Voice_Docs_DevOps.pptx` |
| Demo UI | `frontend/public/index.html` |

---

## API surface (backend)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness |
| POST | `/verify` | Member-3 verification panel |
| POST | `/extract` | Citation extraction only |
| POST | `/voice/process` | Utterance → intent → queue / confirm |
| GET | `/voice/status` | Pending + history |
| POST | `/voice/confirm` | Shortcut confirm |
| POST | `/voice/cancel` | Shortcut cancel |
| POST | `/docs/export` | DOCX or PDF (+ optional verification summary) |

---

## Project layout

```
.
├── backend/main.py          # Aggregated FastAPI app
├── voice/                   # Intent, queue, confirm gate
├── docs_pipeline/           # MarkItDown + DOCX/PDF + verification summary
├── verification/            # Member 3
├── context/                 # Member 3
├── frontend/
│   ├── public/index.html    # Voice + export demo
│   └── src/voiceAgent.js
├── docker/
├── ci/
├── scripts/demo.sh
├── docs/                    # Slides + this README
└── tests/                   # Member 3 fixtures
```

---

## Docker

```bash
docker compose -f docker/docker-compose.yml up --build
# API  → http://localhost:8000
# Demo → http://localhost:8080
```

---

## Notes & limits

- Voice recognition quality depends on the browser (Chrome recommended).  
- Confirm gate is intentionally conservative for `edit` and `run_skill`.  
- Verification summary is **triage only** (Member 3 disclaimer applies).  
- `first.zip` (full Member-1 frontend) was not present in the environment; the demo UI and voice JS are provided for integration.  
- PDF export uses ReportLab (no WeasyPrint system deps required).

---

## License / attribution

Prototype for team demo. Review all generated legal content against authoritative sources before any real-world use.


## Integrated deployment
See [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) for the Render public URL setup and environment variables. The FastAPI service serves the website at `/` and the API from the same origin. The model gateway runs in offline mode until a provider API key is configured.
