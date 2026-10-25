"""LLM Gateway — ONE interface for Claude / GPT / Gemini.

    async for chunk in stream(system, user, model="claude"): ...
    text = await complete(system, user, model="gpt")
    data = await complete_json(system, user)            # parsed dict

* Provider SDKs are imported lazily, so a missing key/SDK never breaks startup.
* If the requested model has no key, we fall back to any other provider that has one.
* If NO key is configured at all, `stream()` yields a clearly-labelled OFFLINE
  placeholder draft so the pipeline can still be tested end to end.
* Model names are env-overridable (CLAUDE_MODEL / GPT_MODEL / GEMINI_MODEL).
"""
from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from typing import AsyncIterator

try:  # optional
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # pragma: no cover
    pass

log = logging.getLogger("draftmate.llm")

MODEL_IDS = ("claude", "gpt", "gemini")
KEY_ENV = {"claude": "ANTHROPIC_API_KEY", "gpt": "OPENAI_API_KEY", "gemini": "GEMINI_API_KEY"}
NAME_ENV = {"claude": "CLAUDE_MODEL", "gpt": "GPT_MODEL", "gemini": "GEMINI_MODEL"}
NAME_DEFAULT = {"claude": "claude-sonnet-5-5", "gpt": "gpt-4o", "gemini": "gemini-2.0-flash"}


def model_name(mid: str) -> str:
    return os.getenv(NAME_ENV[mid]) or NAME_DEFAULT[mid]


def has_key(mid: str) -> bool:
    return bool(os.getenv(KEY_ENV[mid], "").strip())


def available_models() -> list[str]:
    return [m for m in MODEL_IDS if has_key(m)]


def llm_available() -> bool:
    return bool(available_models())


def candidates(requested: str | None) -> list[str]:
    """Requested model first (if keyed), then DEFAULT_MODEL, then any other keyed model."""
    order = [requested or "", os.getenv("DEFAULT_MODEL", "claude")] + list(MODEL_IDS)
    seen: list[str] = []
    for m in order:
        if m in MODEL_IDS and has_key(m) and m not in seen:
            seen.append(m)
    return seen


# ───────────────────────────── providers ─────────────────────────────
async def _claude(system: str, user: str, max_tokens: int, temperature: float) -> AsyncIterator[str]:
    from anthropic import AsyncAnthropic

    client = AsyncAnthropic()
    async with client.messages.stream(
        model=model_name("claude"),
        max_tokens=max_tokens,
        temperature=temperature,
        system=system,
        messages=[{"role": "user", "content": user}],
    ) as s:
        async for t in s.text_stream:
            yield t


async def _gpt(system: str, user: str, max_tokens: int, temperature: float) -> AsyncIterator[str]:
    from openai import AsyncOpenAI

    client = AsyncOpenAI()
    resp = await client.chat.completions.create(
        model=model_name("gpt"),
        messages=[{"role": "system", "content": system}, {"role": "user", "content": user}],
        max_completion_tokens=max_tokens,
        stream=True,
    )
    async for ch in resp:
        if ch.choices and ch.choices[0].delta and ch.choices[0].delta.content:
            yield ch.choices[0].delta.content


async def _gemini(system: str, user: str, max_tokens: int, temperature: float) -> AsyncIterator[str]:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    stream = await client.aio.models.generate_content_stream(
        model=model_name("gemini"),
        contents=user,
        config=types.GenerateContentConfig(system_instruction=system, max_output_tokens=max_tokens, temperature=temperature),
    )
    async for chunk in stream:
        if getattr(chunk, "text", None):
            yield chunk.text


_IMPL = {"claude": _claude, "gpt": _gpt, "gemini": _gemini}


async def _offline(system: str, user: str) -> AsyncIterator[str]:
    m = re.search(r"INSTRUCTION:\s*(.+?)(?:\n\n|$)", user, re.S)
    instr = (m.group(1).strip() if m else "the requested document")[:300]
    cite = "\n\n3. That the dishonour attracts the offence under [CITE: Section 138, Negotiable Instruments Act, 1881]." if "138" in instr else ""
    text = (
        "# DRAFT (OFFLINE PLACEHOLDER)\n\n"
        "**No LLM API key is configured on the server, so this is a placeholder, not a real draft.**\n\n"
        f"**Instruction:** {instr}\n\n"
        "1. That [FACTS TO BE INSERTED BY ADVOCATE].\n\n"
        f"2. That [DEMAND / RELIEF TO BE INSERTED].{cite}\n\n"
        "Yours faithfully,\n\n**Advocate**"
    )
    for tok in re.findall(r"\s*\S+|\s+", text):
        yield tok
        await asyncio.sleep(0.01)


# ───────────────────────────── public API ─────────────────────────────
async def stream(
    system: str, user: str, model: str | None = "claude", max_tokens: int = 3000, temperature: float = 0.3
) -> AsyncIterator[str]:
    cands = candidates(model)
    if not cands:
        log.warning("No LLM API key configured → offline placeholder output")
        async for t in _offline(system, user):
            yield t
        return
    last: Exception | None = None
    for mid in cands:
        started = False
        try:
            async for t in _IMPL[mid](system, user, max_tokens, temperature):
                started = True
                yield t
            return
        except Exception as e:  # provider failed
            if started:  # can't switch model mid-stream
                raise
            last = e
            log.warning("provider %s failed before first token: %s", mid, e)
    raise RuntimeError(f"All LLM providers failed: {last}")


async def complete(system: str, user: str, model: str | None = "claude", max_tokens: int = 2000, temperature: float = 0.2) -> str:
    parts: list[str] = []
    async for t in stream(system, user, model, max_tokens, temperature):
        parts.append(t)
    return "".join(parts)


def extract_json(text: str) -> dict:
    text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.M).strip()
    s, e = text.find("{"), text.rfind("}")
    if s < 0 or e <= s:
        raise ValueError("no JSON object in model output")
    return json.loads(text[s : e + 1])


async def complete_json(system: str, user: str, model: str | None = None, max_tokens: int = 800) -> dict:
    out = await complete(system + "\n\nReply with ONLY one JSON object. No prose, no code fences.", user, model, max_tokens, 0.0)
    return extract_json(out)
