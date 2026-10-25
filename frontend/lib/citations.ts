import { mdToHtml } from "./md";
import type { Citation, CitationKind } from "./types";

// Backend/LLM must wrap every authority as  [CITE: Section 138, NI Act, 1881]
const RE = /\[CITE:\s*([^\]]+?)\s*\]/g;

export function classify(t: string): CitationKind {
  if (/\bv\.?\s|\bvs\.?\s/i.test(t)) return "case";
  if (/\b(section|sec\.|s\.|article)\s*\d+/i.test(t)) return "statute";
  if (/\b(order|rule)\s+[ivxlc\d]+/i.test(t)) return "rule";
  return "other";
}

const unesc = (s: string) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** Markdown draft (with [CITE: …] markers) → editor HTML + ordered citation list. IDs: c1, c2 … */
export function buildHtml(raw: string): { html: string; citations: Citation[] } {
  const ids = new Map<string, string>();
  const citations: Citation[] = [];
  const html = mdToHtml(raw).replace(RE, (_m, t: string) => {
    const key = t.trim();
    let id = ids.get(key);
    if (!id) {
      id = `c${ids.size + 1}`;
      ids.set(key, id);
      citations.push({ id, text: unesc(key), kind: classify(unesc(key)), status: "pending", confidence: 0 });
    }
    return `<span data-cite-id="${id}" data-status="pending">${key}</span>`;
  });
  return { html, citations };
}
