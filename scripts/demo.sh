#!/usr/bin/env bash
# DraftMate Member-4 demo script
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PYTHONPATH="$ROOT"

echo "════════════════════════════════════════════"
echo "  DraftMate — Member 4 Demo"
echo "  Voice • Docs Pipeline • DevOps"
echo "════════════════════════════════════════════"
echo

# 1. Voice intent smoke test
echo "▶ Voice intent parser"
python - <<'PY'
from voice.intent_parser import parse_intent
samples = [
    "verify citations",
    "export as PDF",
    "edit the text to make it formal",
    "help",
    "confirm",
    "cancel",
    "run skill clause-check",
]
for s in samples:
    i = parse_intent(s)
    print(f"  '{s}' → {i.type.value} (conf={i.confidence:.2f}, confirm={i.requires_confirmation})")
print("  ✓ intent parser OK")
PY

# 2. Confirm gate + action queue
echo
echo "▶ Confirm gate + action queue"
python - <<'PY'
from voice.confirm_gate import ConfirmGate
g = ConfirmGate()
r1 = g.process_utterance("edit the introduction")
assert r1["state"] == "awaiting_confirm", r1
print("  edit → awaiting_confirm ✓")
r2 = g.process_utterance("confirm")
assert r2["state"] == "executed", r2
print("  confirm → executed ✓")
r3 = g.process_utterance("verify")
assert r3["state"] == "executed", r3
print("  verify → executed ✓")
print("  ✓ confirm gate OK")
PY

# 3. Doc pipeline export with verification summary
echo
echo "▶ Doc pipeline (DOCX + PDF with verification summary)"
python - <<'PY'
from docs_pipeline.exporter import export_with_verification
from pathlib import Path
out = Path("artifacts_demo")
out.mkdir(exist_ok=True)
content = """# Demo Memo

This agreement is governed by Delaware law.

See *Smith v. Jones*, 123 F.3d 456 (2d Cir. 2020).
"""
verification = {
    "document_id": "demo-001",
    "overall_status": "REVIEW_REQUIRED",
    "notice": "Prototype triage only.",
    "citations": [
        {
            "original_text": "Smith v. Jones, 123 F.3d 456 (2d Cir. 2020)",
            "match_status": "PARTIAL_MATCH",
            "score": 0.72,
            "matched_url": "https://example.com/case",
        }
    ],
    "sources": [{"url": "https://example.com/case", "title": "Example Reporter", "fetch_status": "ok"}],
}
files = export_with_verification(content, verification, formats=["docx", "pdf"], title="DraftMate_Demo", output_dir=str(out))
for fmt, data in files.items():
    print(f"  wrote {fmt}: {len(data)} bytes → artifacts_demo/")
print("  ✓ export OK")
PY

# 4. API health (if running)
echo
echo "▶ API health check (start server with: uvicorn backend.main:app --reload)"
if curl -sf http://127.0.0.1:8000/health >/dev/null 2>&1; then
  curl -s http://127.0.0.1:8000/health | python -m json.tool
  echo "  ✓ API is up"
else
  echo "  (API not running — start it to test /voice and /docs endpoints)"
fi

echo
echo "════════════════════════════════════════════"
echo "  Demo complete. Open frontend/public/index.html"
echo "  or: docker compose -f docker/docker-compose.yml up --build"
echo "════════════════════════════════════════════"
