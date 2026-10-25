// Tiny Markdown → HTML converter (headings, bold/italic, bullets, paragraphs).
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const inline = (s: string) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\*)/g, "$1<em>$2</em>");

export function mdToHtml(md: string): string {
  const out: string[] = [];
  let para: string[] = [];
  let list: string[] = [];
  const flushP = () => {
    if (para.length) { out.push(`<p>${para.map(inline).join("<br>")}</p>`); para = []; }
  };
  const flushL = () => {
    if (list.length) { out.push(`<ul>${list.map((i) => `<li><p>${inline(i)}</p></li>`).join("")}</ul>`); list = []; }
  };
  for (const line of md.split("\n")) {
    const l = line.trimEnd();
    let m: RegExpMatchArray | null;
    if (!l.trim()) { flushP(); flushL(); continue; }
    if ((m = l.match(/^(#{1,3})\s+(.*)$/))) {
      flushP(); flushL();
      out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
    } else if (/^---+$/.test(l.trim())) {
      flushP(); flushL(); out.push("<hr>");
    } else if ((m = l.match(/^[-*]\s+(.*)$/))) {
      flushP(); list.push(m[1]);
    } else {
      flushL(); para.push(l);
    }
  }
  flushP(); flushL();
  return out.join("");
}
