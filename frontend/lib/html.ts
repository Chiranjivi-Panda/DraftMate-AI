// Small DOM helpers used by edit / delete / dictate actions (client only).
export function plainText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function parse(html: string): HTMLElement {
  return new DOMParser().parseFromString(`<div id="r">${html}</div>`, "text/html").getElementById("r")!;
}

export function findPara(root: HTMLElement, n: number): Element | null {
  const ps = Array.from(root.querySelectorAll("p"));
  return ps.find((p) => new RegExp(`^\\s*${n}[.)]\\s`).test(p.textContent || "")) ?? ps[n - 1] ?? null;
}

export function removeParagraph(html: string, n: number): { html: string; removed: boolean } {
  const root = parse(html);
  const p = findPara(root, n);
  if (!p) return { html, removed: false };
  p.remove();
  return { html: root.innerHTML, removed: true };
}

export function appendParagraph(html: string, text: string): string {
  const safe = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `${html}<p>${safe}</p>`;
}

export function rewriteText(html: string, dict: [RegExp, string][], n?: number): { html: string; changed: number } {
  const root = parse(html);
  const scope: Element | null = n ? findPara(root, n) : root;
  if (!scope) return { html, changed: 0 };
  const walker = scope.ownerDocument.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  let changed = 0;
  let node: Node | null;
  while ((node = walker.nextNode())) {
    let t = node.nodeValue || "";
    const before = t;
    for (const [re, rep] of dict) t = t.replace(re, rep);
    if (t !== before) { node.nodeValue = t; changed++; }
  }
  return { html: root.innerHTML, changed };
}
