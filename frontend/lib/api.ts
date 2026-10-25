// ── API LAYER ──  Single place where the UI talks to the backend.
// Every function has a LIVE branch (FastAPI) and an automatic DEMO fallback.
// Backend teammates: implement the endpoints; the UI needs no other change.
import type { Citation, DraftEvent, DraftRequest, ModelId, RouteResult, Skill, StyleProfile, UploadedDoc } from "./types";
import * as mock from "./mock";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");
const PREF = (process.env.NEXT_PUBLIC_API_MODE ?? "auto") as "auto" | "mock" | "live";
let live = PREF === "live";

export const getMode = (): "live" | "demo" => (live ? "live" : "demo");

export async function init() {
  if (PREF === "mock") { live = false; return; }
  if (PREF === "live") { live = true; return; }
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 1500);
    const r = await fetch(`${BASE}/api/health`, { signal: ctl.signal });
    clearTimeout(t);
    live = r.ok;
  } catch { live = false; }
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...init });
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json() as Promise<T>;
}

async function withFallback<T>(liveFn: () => Promise<T>, demoFn: () => Promise<T> | T): Promise<T> {
  if (!live) return demoFn();
  try { return await liveFn(); } catch (e) { console.warn("[api] live call failed → demo data", e); return demoFn(); }
}

// GET /api/skills → Skill[]  (or { skills: Skill[] })
export function listSkills(): Promise<Skill[]> {
  return withFallback(
    async () => { const r = await json<Skill[] | { skills: Skill[] }>("/api/skills"); return Array.isArray(r) ? r : r.skills; },
    () => mock.SKILLS,
  );
}

// POST /api/upload (multipart "file") → { id, name, size, tokens, style }
export function uploadDoc(file: File): Promise<UploadedDoc> {
  return withFallback(
    async () => {
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch(`${BASE}/api/upload`, { method: "POST", body: fd });
      if (!r.ok) throw new Error("upload failed");
      const d = (await r.json()) as { id: string; name?: string; size?: number; tokens?: number; style?: StyleProfile };
      return { id: d.id, name: d.name ?? file.name, size: d.size ?? file.size, status: "ready" as const, tokens: d.tokens, style: d.style };
    },
    async () => { await mock.sleep(1300); return mock.mockUpload(file); },
  );
}

// POST /api/route { instruction, has_draft } → RouteResult
export function routeInstruction(instruction: string, hasDraft: boolean): Promise<RouteResult> {
  return withFallback(
    () => json<RouteResult>("/api/route", { method: "POST", body: JSON.stringify({ instruction, has_draft: hasDraft }) }),
    async () => { await mock.sleep(450); return mock.mockRoute(instruction, hasDraft); },
  );
}

// POST /api/draft (SSE) → DraftEvent stream
export async function streamDraft(req: DraftRequest, onEvent: (e: DraftEvent) => void, signal?: AbortSignal) {
  if (live) {
    let started = false;
    try {
      const res = await fetch(`${BASE}/api/draft`, {
        method: "POST", signal, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: req.instruction, skill_id: req.skillId, model: req.model, doc_ids: req.docIds }),
      });
      if (!res.ok || !res.body) throw new Error("draft failed");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const p of parts) {
          const line = p.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;
          let ev: DraftEvent | null = null;
          try { ev = JSON.parse(line.slice(5).trim()) as DraftEvent; } catch { /* skip bad frame */ }
          if (ev) { started = true; onEvent(ev); }
        }
      }
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError" || started) throw e;
      console.warn("[api] draft live failed → demo stream", e);
    }
  }
  await mock.mockStream(req.skillId, onEvent, signal);
}

// POST /api/edit { instruction, html, model, paragraph? } → { html, summary }
export function editText(p: { instruction: string; html: string; model: ModelId; paragraph?: number }): Promise<{ html: string; summary: string }> {
  return withFallback(
    () => json<{ html: string; summary: string }>("/api/edit", { method: "POST", body: JSON.stringify(p) }),
    async () => { await mock.sleep(1100); return mock.mockEdit(p.html, p.instruction, p.paragraph); },
  );
}

// POST /api/verify { citations:[{id,text,kind}] } → { citations: Citation[] }
export async function verifyCitations(cites: Citation[], onResult: (c: Citation) => void) {
  if (live) {
    try {
      const r = await json<{ citations: Citation[] }>("/api/verify", {
        method: "POST", body: JSON.stringify({ citations: cites.map(({ id, text, kind }) => ({ id, text, kind })) }),
      });
      for (const c of r.citations) { await mock.sleep(380); onResult(c); } // stagger for the reveal animation
      return;
    } catch (e) { console.warn("[api] verify live failed → demo", e); }
  }
  await mock.mockVerify(cites, onResult);
}

function download(blob: Blob, name: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

function summaryHtml(cites: Citation[]) {
  const n = (s: string) => cites.filter((c) => c.status === s).length;
  return `<hr/><p><b>Verification Summary:</b> ${n("verified")} verified · ${n("partial")} partially verified · ${n("unverified")} unverified.</p><p><i>Generated with DraftMate Studio. Requires review by a qualified advocate before use.</i></p>`;
}

// POST /api/export?fmt=docx|pdf { title, html, citations } → file blob
export async function exportDoc(fmt: "docx" | "pdf", p: { title: string; html: string; citations: Citation[] }) {
  const slug = (p.title || "draft").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "draft";
  if (live) {
    try {
      const r = await fetch(`${BASE}/api/export?fmt=${fmt}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
      if (!r.ok) throw new Error("export failed");
      download(await r.blob(), `${slug}.${fmt}`);
      return;
    } catch (e) { console.warn("[api] export live failed → local export", e); }
  }
  const body = `<html><head><meta charset="utf-8"><title>${p.title}</title><style>body{font-family:'Times New Roman',serif;line-height:1.7;max-width:760px;margin:40px auto}h1{text-align:center}p{text-align:justify}</style></head><body>${p.html}${summaryHtml(p.citations)}</body></html>`;
  if (fmt === "pdf") {
    const w = window.open("", "_blank");
    if (w) { w.document.write(body); w.document.close(); setTimeout(() => w.print(), 400); }
    return;
  }
  download(new Blob(["\ufeff", body], { type: "application/msword" }), `${slug}.doc`);
}
