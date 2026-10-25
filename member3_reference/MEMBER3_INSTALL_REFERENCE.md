# Member 3 implementation pack — DraftMate

## Copy these files into the existing project
Merge the included `backend/` tree into the current `backend/` folder. Do not replace the complete backend.

## Register API router
In existing `backend/main.py`, add these two lines beside the M2 router:
```python
from api.verify import router as verify_router
app.include_router(verify_router)
```
Member 4 owns the shared `main.py`; coordinate rather than overwriting their changes.

## Dependencies
Add if missing in `backend/requirements.txt`:
```text
requests
beautifulsoup4
pytest
```

## Run tests
From the `backend/` folder:
```bash
pytest -q tests/test_member3.py
```

## API request
`POST /api/verify`
```json
{
  "citations": [{"id":"c1","text":"Section 21, Constitution of India","kind":"statute"}],
  "source_urls": ["https://www.indiacode.nic.in/"]
}
```
The `source_urls` field is optional. The response is `{ "citations": [...] }` with `id`, `text`, `kind`, `status`, `confidence`, `source_name`, `source_url`, `snippet`, `note`, and `suggestion`.

## Context manager contract
Member 2 imports `core.context_manager.build_context(instruction, doc_ids)`. Return fields:
- `text`: retrieved source chunks with document, section and chunk provenance
- `raw`: estimated tokens in all selected source documents
- `sent`: estimated tokens in retrieved context
- `chunks`: optional chunk metadata

The token counts are rough estimates, not exact model billing counts.

## Known limitations
- The URL fetcher only accepts HTTPS URLs on a small allowlist of official legal domains and does not follow redirects.
- PDF parsing and automatic source discovery are not included in this MVP.
- Lexical matching is evidence of text overlap only, not proof of case identity or proposition support.
- No match does not prove a citation is fictitious.
- The 15 fixtures are candidates, not a verified benchmark. Validate them before reporting accuracy.
