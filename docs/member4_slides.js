/**
 * DraftMate — Member 4: Voice, Docs & DevOps
 */
const pptxgen = require("pptxgenjs");

const C = {
  navy: "0B2344",
  primary: "1A56DB",
  gold: "B5935A",
  white: "FFFFFF",
  offWhite: "F5F4F0",
  slate: "4A5568",
  midGrey: "718096",
  lightGrey: "E2E8F0",
  bodyText: "1A202C",
};

const pptx = new pptxgen();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "DraftMate Member 4";
pptx.title = "DraftMate — Voice, Docs & DevOps";

// Slide 1 Title
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.navy } });
  s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: C.primary } });
  s.addText("DRAFTMATE", {
    x: 0.8, y: 2.0, w: 11, h: 0.4,
    fontSize: 14, fontFace: "Arial", color: C.gold, bold: true, charSpacing: 4,
  });
  s.addText("Member 4 — Voice, Docs & DevOps", {
    x: 0.8, y: 2.5, w: 11, h: 0.8,
    fontSize: 36, fontFace: "Arial", color: C.white, bold: true,
  });
  s.addText("Web Speech Agent  ·  Document Pipeline  ·  Docker / CI / Demo", {
    x: 0.8, y: 3.4, w: 11, h: 0.4,
    fontSize: 16, fontFace: "Arial", color: C.lightGrey,
  });
  s.addText("Hard · Medium · Polish deliverables complete", {
    x: 0.8, y: 6.5, w: 11, h: 0.3,
    fontSize: 12, fontFace: "Arial", color: C.midGrey,
  });
}

// Slide 2 Scope
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 0.7, fill: { color: C.navy } });
  s.addText("Scope — Member 4", {
    x: 0.5, y: 0.18, w: 12, h: 0.4,
    fontSize: 20, fontFace: "Arial", color: C.white, bold: true,
  });
  const cards = [
    { title: "HARD", sub: "Voice Agent", items: ["Web Speech API (STT + TTS)", "Intent parser", "Action queue", "Confirm gate", "Speech feedback"] },
    { title: "MEDIUM", sub: "Doc Pipeline", items: ["MarkItDown conversion", "DOCX export", "PDF export", "Verification Summary", "API /docs/export"] },
    { title: "POLISH", sub: "DevOps & Demo", items: ["Docker + Compose", "CI-lite", "demo.sh script", "Slides + README", "Frontend voice demo"] },
  ];
  cards.forEach((c, i) => {
    const x = 0.5 + i * 4.2;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.2, w: 3.9, h: 5.5, fill: { color: C.offWhite }, rectRadius: 0.1,
    });
    s.addShape(pptx.shapes.RECTANGLE, { x, y: 1.2, w: 3.9, h: 0.08, fill: { color: C.primary } });
    s.addText(c.title, { x: x + 0.25, y: 1.45, w: 3.4, h: 0.3, fontSize: 12, color: C.primary, bold: true, fontFace: "Arial" });
    s.addText(c.sub, { x: x + 0.25, y: 1.8, w: 3.4, h: 0.4, fontSize: 18, color: C.navy, bold: true, fontFace: "Arial" });
    c.items.forEach((item, j) => {
      s.addText("•  " + item, {
        x: x + 0.25, y: 2.5 + j * 0.55, w: 3.4, h: 0.5,
        fontSize: 13, color: C.bodyText, fontFace: "Arial",
      });
    });
  });
}

// Slide 3 Voice
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 0.7, fill: { color: C.navy } });
  s.addText("Voice Agent Architecture", {
    x: 0.5, y: 0.18, w: 12, h: 0.4,
    fontSize: 20, fontFace: "Arial", color: C.white, bold: true,
  });
  const steps = [
    { n: "1", t: "Web Speech", d: "Browser STT\nSpeechRecognition" },
    { n: "2", t: "Intent Parser", d: "Regex patterns\n+ confidence" },
    { n: "3", t: "Confirm Gate", d: "Sensitive actions\nrequire confirm" },
    { n: "4", t: "Action Queue", d: "FIFO + status\nPENDING to DONE" },
    { n: "5", t: "Speech Feedback", d: "TTS response\nto the user" },
  ];
  steps.forEach((st, i) => {
    const x = 0.4 + i * 2.55;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x, y: 2.0, w: 2.35, h: 3.2, fill: { color: C.offWhite }, rectRadius: 0.08,
    });
    s.addShape(pptx.shapes.OVAL, {
      x: x + 0.85, y: 2.25, w: 0.65, h: 0.65, fill: { color: C.primary },
    });
    s.addText(st.n, {
      x: x + 0.85, y: 2.35, w: 0.65, h: 0.5,
      fontSize: 18, color: C.white, bold: true, align: "center", fontFace: "Arial",
    });
    s.addText(st.t, {
      x: x + 0.1, y: 3.1, w: 2.15, h: 0.4,
      fontSize: 14, color: C.navy, bold: true, align: "center", fontFace: "Arial",
    });
    s.addText(st.d, {
      x: x + 0.1, y: 3.6, w: 2.15, h: 1.2,
      fontSize: 12, color: C.slate, align: "center", fontFace: "Arial",
    });
  });
  s.addText("API: POST /voice/process  ·  GET /voice/status  ·  Frontend: voiceAgent.js", {
    x: 0.5, y: 6.6, w: 12, h: 0.3,
    fontSize: 12, color: C.midGrey, fontFace: "Arial",
  });
}

// Slide 4 Docs
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 0.7, fill: { color: C.navy } });
  s.addText("Document Pipeline + Verification Summary", {
    x: 0.5, y: 0.18, w: 12, h: 0.4,
    fontSize: 20, fontFace: "Arial", color: C.white, bold: true,
  });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 1.2, w: 6, h: 5.5, fill: { color: C.offWhite }, rectRadius: 0.1,
  });
  s.addText("Pipeline", {
    x: 0.75, y: 1.4, w: 5.5, h: 0.4, fontSize: 16, bold: true, color: C.navy, fontFace: "Arial",
  });
  const pipe = [
    "1. Input: Markdown / editor content",
    "2. Optional: MarkItDown convert",
    "3. Attach Member-3 verification result",
    "4. export_docx() / export_pdf()",
    "5. Verification Summary page appended",
    "6. Download via /docs/export",
  ];
  pipe.forEach((p, i) => {
    s.addText(p, {
      x: 0.75, y: 2.1 + i * 0.55, w: 5.5, h: 0.5,
      fontSize: 14, color: C.bodyText, fontFace: "Arial",
    });
  });
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.8, y: 1.2, w: 6, h: 5.5, fill: { color: C.offWhite }, rectRadius: 0.1,
  });
  s.addText("Verification Summary", {
    x: 7.05, y: 1.4, w: 5.5, h: 0.4, fontSize: 16, bold: true, color: C.navy, fontFace: "Arial",
  });
  const fields = [
    "Overall status (colour coded)",
    "Citation excerpt",
    "Match status + score",
    "Source URL from Member 3",
    "Prototype disclaimer notice",
    "Sources consulted list",
  ];
  fields.forEach((f, i) => {
    s.addText("•  " + f, {
      x: 7.05, y: 2.1 + i * 0.55, w: 5.5, h: 0.5,
      fontSize: 14, color: C.bodyText, fontFace: "Arial",
    });
  });
}

// Slide 5 DevOps
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 0.7, fill: { color: C.navy } });
  s.addText("Docker · CI-lite · Demo", {
    x: 0.5, y: 0.18, w: 12, h: 0.4,
    fontSize: 20, fontFace: "Arial", color: C.white, bold: true,
  });
  const items = [
    { t: "Docker", d: "docker/Dockerfile + docker-compose.yml — API :8000 · nginx demo UI :8080" },
    { t: "CI-lite", d: "ci/github-actions-lite.yml — unittest + import check + image build" },
    { t: "demo.sh", d: "scripts/demo.sh — intent parser · confirm gate · DOCX/PDF export smoke test" },
    { t: "Frontend", d: "frontend/public/index.html + voiceAgent.js (push-to-talk Web Speech)" },
  ];
  items.forEach((it, i) => {
    const y = 1.2 + i * 1.4;
    s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y, w: 12.3, h: 1.25, fill: { color: C.offWhite }, rectRadius: 0.08,
    });
    s.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y, w: 0.12, h: 1.25, fill: { color: C.primary } });
    s.addText(it.t, { x: 0.9, y: y + 0.35, w: 2.5, h: 0.45, fontSize: 16, bold: true, color: C.navy, fontFace: "Arial" });
    s.addText(it.d, { x: 3.6, y: y + 0.35, w: 8.8, h: 0.55, fontSize: 14, color: C.bodyText, fontFace: "Arial" });
  });
}

// Slide 6 Integration
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 0.7, fill: { color: C.navy } });
  s.addText("Integration with Members 1–3", {
    x: 0.5, y: 0.18, w: 12, h: 0.4,
    fontSize: 20, fontFace: "Arial", color: C.white, bold: true,
  });
  const rows = [
    ["Member 1", "Frontend / TipTap", "Embed voiceAgent.js, call /docs/export, show confirm prompts"],
    ["Member 2", "Skills / LLM", "Register skill handlers on ActionQueue; voice “run skill X”"],
    ["Member 3", "Verification", "Already wired: /verify + summary injected into DOCX/PDF"],
    ["Member 4", "Voice · Docs · Ops", "This deliverable — ready for joint demo"],
  ];
  s.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 0.5, y: 1.3, w: 12.3, h: 5.2, fill: { color: C.offWhite }, rectRadius: 0.08,
  });
  s.addShape(pptx.shapes.RECTANGLE, { x: 0.5, y: 1.3, w: 12.3, h: 0.55, fill: { color: C.navy } });
  ["Member", "Area", "Integration point"].forEach((h, i) => {
    const xs = [0.7, 3.0, 6.5];
    s.addText(h, { x: xs[i], y: 1.4, w: 3, h: 0.35, fontSize: 13, bold: true, color: C.white, fontFace: "Arial" });
  });
  rows.forEach((r, i) => {
    const y = 2.1 + i * 1.0;
    r.forEach((cell, j) => {
      const xs = [0.7, 3.0, 6.5];
      const ws = [2.2, 3.3, 5.8];
      s.addText(cell, {
        x: xs[j], y, w: ws[j], h: 0.8,
        fontSize: 14, color: j === 0 ? C.primary : C.bodyText, bold: j === 0, fontFace: "Arial",
      });
    });
  });
}

// Slide 7 Closing
{
  const s = pptx.addSlide();
  s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.navy } });
  s.addShape(pptx.shapes.RECTANGLE, { x: 0, y: 0, w: 0.15, h: 7.5, fill: { color: C.primary } });
  s.addText("Ready for joint demo", {
    x: 0.8, y: 2.5, w: 11, h: 0.6,
    fontSize: 32, fontFace: "Arial", color: C.white, bold: true,
  });
  s.addText("uvicorn backend.main:app --reload\nbash scripts/demo.sh\ndocker compose -f docker/docker-compose.yml up --build", {
    x: 0.8, y: 3.4, w: 11, h: 1.5,
    fontSize: 16, fontFace: "Consolas", color: C.lightGrey,
  });
  s.addText("DraftMate  ·  Member 4", {
    x: 0.8, y: 6.5, w: 11, h: 0.3,
    fontSize: 12, fontFace: "Arial", color: C.midGrey,
  });
}

pptx.writeFile({ fileName: "/home/workdir/artifacts/docs/DraftMate_Member4_Voice_Docs_DevOps.pptx" })
  .then(() => console.log("Wrote slides"))
  .catch((e) => console.error(e));
