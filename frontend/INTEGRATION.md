# Integration guide (read this, teammates!)

The UI runs fully on built-in demo data. To go live, implement the endpoints below —
**no frontend change needed**. Set `NEXT_PUBLIC_API_MODE=auto` (default) and the UI
switches to live as soon as `GET /api/health` returns 200. Any failing live call
falls back to demo data automatically, so the demo can never break on stage.

| Owner | Endpoint | Request → Response (see `lib/types.ts`) |
|---|---|---|
| All | `GET /api/health` | `200 {"ok":true}` |
| M2 | `GET /api/skills` | `Skill[]` (or `{skills: Skill[]}`) |
| M2 | `POST /api/route` | `{instruction, has_draft}` → `{intent, skill_id?, paragraph?, text?}` |
| M2 | `POST /api/draft` (SSE) | `{instruction, skill_id, model, doc_ids}` → frames `data: {"type":"skill","skill_id":".."}` · `{"type":"token","text":".."}` · `{"type":"usage","raw":18420,"sent":3110}` · `{"type":"done"}` |
| M2 | `POST /api/edit` | `{instruction, html, model, paragraph?}` → `{html, summary}` |
| M3 | `POST /api/verify` | `{citations:[{id,text,kind}]}` → `{citations: Citation[]}` |
| M4 | `POST /api/upload` | multipart `file` → `{id, name, size, tokens, style: StyleProfile}` |
| M4 | `POST /api/export?fmt=docx\|pdf` | `{title, html, citations}` → file blob |

## Rules
1. The model MUST wrap every authority in the draft as `[CITE: Section 138, NI Act, 1881]` — the editor turns these into highlighted, verifiable spans.
2. Stream the draft as **Markdown** (`# Title`, `**bold**`, `- bullets`, numbered paragraphs as plain `1. text` lines separated by blank lines).
3. CORS: allow `http://localhost:3000` and your Vercel domain.
4. Voice: `lib/voice.ts` (Web Speech). Member 4 may extend it; any transcript is sent through `runInstruction()` in `lib/actions.ts`.
5. Destructive intents (`delete`, `overwrite`) automatically trigger the confirm modal — just return the right `intent` from `/api/route`.

## Where things live
- `lib/actions.ts` — all workflows (draft, verify, edit, delete, export, upload)
- `lib/api.ts`     — every network call (live + demo fallback)
- `lib/store.ts`   — global state (zustand)
- `components/`    — presentational UI only
