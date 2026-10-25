"""M2 tests — run offline (no API keys needed):  cd backend && pytest -q"""
import asyncio
import json

import pytest
from fastapi.testclient import TestClient

from core import skill_engine as engine
from core import style_profiler


@pytest.fixture(autouse=True)
def no_keys(monkeypatch):
    for k in ("ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY"):
        monkeypatch.delenv(k, raising=False)


@pytest.fixture
def client():
    from main import app

    return TestClient(app)


def test_ten_skills_loaded_and_valid():
    skills = engine.load_skills(force=True)
    assert len(skills) == 10
    for s in skills.values():
        assert s.system_prompt.strip() and s.triggers and s.example and s.category


def test_skills_endpoint_matches_contract(client):
    data = client.get("/api/skills").json()
    assert len(data) == 10
    assert {"id", "name", "category", "description", "triggers", "example", "requires_verification"} <= set(data[0])


@pytest.mark.parametrize(
    "text,has,expect",
    [
        ("Draft a legal notice for non-payment of ₹5 lakh under Section 138 NI Act", False, {"intent": "draft", "skill_id": "legal_notice"}),
        ("Draft a master services contract between two Indian companies", False, {"intent": "draft", "skill_id": "contract_drafting"}),
        ("Draft a residential rent agreement for 11 months in Lucknow", False, {"intent": "draft", "skill_id": "agreement"}),
        ("Draft a writ petition under Article 226 for delayed pension", False, {"intent": "draft", "skill_id": "petition"}),
        ("Review the uploaded vendor contract and flag risky clauses", False, {"intent": "draft", "skill_id": "contract_review"}),
        ("Prepare a due-diligence checklist for a startup acquisition", False, {"intent": "draft", "skill_id": "due_diligence"}),
        ("Research the law on presumption under Section 139 NI Act", False, {"intent": "draft", "skill_id": "legal_research"}),
        ("Analyse Dashrath Rupsingh Rathod v. State of Maharashtra", False, {"intent": "draft", "skill_id": "case_analysis"}),
        ("Summarise the uploaded judgment in one page", False, {"intent": "draft", "skill_id": "summarisation"}),
        ("Make paragraph 3 more formal", True, {"intent": "edit", "paragraph": 3}),
        ("Delete paragraph five", True, {"intent": "delete", "paragraph": 5}),
        ("delete the second paragraph", True, {"intent": "delete", "paragraph": 2}),
        ("Verify all citations", True, {"intent": "verify"}),
        ("Export as Word", True, {"intent": "export"}),
        ("Dictate: The parties shall arbitrate at Lucknow", True, {"intent": "dictate", "text": "The parties shall arbitrate at Lucknow"}),
    ],
)
def test_router(text, has, expect):
    r = asyncio.run(engine.route(text, has))
    for k, v in expect.items():
        assert r.get(k) == v, (text, r)


def test_router_unsure_returns_no_skill():
    r = asyncio.run(engine.route("help me with this matter", False))
    assert r["intent"] == "draft" and "skill_id" not in r


def test_hot_reload(tmp_path, monkeypatch):
    (tmp_path / "x.yaml").write_text("id: x\nname: X\nsystem_prompt: hi\ntriggers: [xyz]\n", encoding="utf-8")
    monkeypatch.setattr(engine, "SKILLS_DIR", tmp_path)
    assert list(engine.load_skills(force=True)) == ["x"]
    (tmp_path / "y.yaml").write_text("id: y\nname: Y\nsystem_prompt: hi\n", encoding="utf-8")
    assert set(engine.load_skills()) == {"x", "y"}
    (tmp_path / "bad.yaml").write_text("id: z\n", encoding="utf-8")  # invalid → skipped, no crash
    assert set(engine.load_skills()) == {"x", "y"}
    monkeypatch.undo()
    engine.load_skills(force=True)


def test_draft_sse_contract(client):
    r = client.post("/api/draft", json={"instruction": "Draft a legal notice under Section 138 NI Act", "model": "claude", "doc_ids": []})
    assert r.status_code == 200 and r.headers["content-type"].startswith("text/event-stream")
    evs = [json.loads(f[5:]) for f in r.text.split("\n\n") if f.startswith("data:")]
    types = [e["type"] for e in evs]
    assert types[0] == "skill" and types[1] == "usage" and types[-1] == "done" and "token" in types
    assert evs[0]["skill_id"] == "legal_notice"
    assert evs[1]["raw"] >= evs[1]["sent"] > 0
    assert "[CITE: Section 138" in "".join(e["text"] for e in evs if e["type"] == "token")


def test_chain_uses_last_skill(client):
    r = client.post("/api/draft", json={"instruction": "x", "skill_id": "legal_research+legal_notice"})
    first = json.loads(r.text.split("\n\n")[0][5:])
    assert first["skill_id"] == "legal_notice"


HTML = '<h1>NOTICE</h1><p>1. Please note that you must pay within 15 days.</p><p>2. See <span data-cite-id="c1" data-status="pending">Section 138, NI Act</span> and pay.</p>'


def test_edit_paragraph_keeps_citations(client):
    r = client.post("/api/edit", json={"instruction": "make it more formal", "html": HTML, "paragraph": 2}).json()
    assert 'data-cite-id="c1"' in r["html"] and "Section 138, NI Act</span>" in r["html"]
    assert "remit" in r["html"] and "<p>1. Please note" in r["html"]


def test_edit_missing_paragraph(client):
    r = client.post("/api/edit", json={"instruction": "make it formal", "html": HTML, "paragraph": 9}).json()
    assert r["html"] == HTML and "Couldn" in r["summary"]


def test_style_profile_heuristic():
    md = "# LEGAL NOTICE\n\n1. That you shall pay within 15 days failing which my client is constrained to act without prejudice.\n\n2. That you are liable hereinafter.\n\n3. Sent by Registered Post A.D.\n"
    s = asyncio.run(style_profiler.profile(md))
    assert set(s) == {"tone", "structure", "terminology", "clausePatterns", "formatting"}
    assert "Reservation of rights" in s["clausePatterns"] and "Numbered paragraphs" in s["formatting"]
    assert "STYLE CARD" in style_profiler.style_card(s)
