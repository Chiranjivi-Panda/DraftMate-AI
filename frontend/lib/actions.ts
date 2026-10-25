// ── ORCHESTRATION ──  All user-facing workflows live here (UI stays dumb).
// Voice (Member 4) and the text command bar both call runInstruction().
import * as api from "./api";
import { buildHtml } from "./citations";
import { DEMO_INSTRUCTION } from "./mock";
import { appendParagraph, plainText, removeParagraph } from "./html";
import { speak } from "./speech";
import { useStore } from "./store";
import type { ConfirmRequest } from "./types";

const S = () => useStore.getState();
let abortCtl: AbortController | null = null;

const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const hasDraft = () => plainText(S().doc.html).length > 0;
const skillName = (id?: string | null) => S().skills.find((s) => s.id === id)?.name ?? "Legal skill";

function titleFrom(raw: string) {
  const m = raw.match(/^#\s+(.+)$/m);
  if (!m) return "Untitled draft";
  return m[1].toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function bootstrap() {
  await api.init();
  S().patch({ mode: api.getMode() });
  const skills = await api.listSkills();
  S().patch({ skills, skillsLoading: false });
}

export function requestConfirm(req: ConfirmRequest) {
  S().patch({ confirm: req });
  if (S().voice.state !== "idle") speak(`${req.title}. ${req.message} Say confirm or cancel.`);
}

export function resolveConfirm(accept: boolean) {
  const c = S().confirm;
  S().patch({ confirm: null });
  if (accept && c) c.onConfirm();
}

export function stopGeneration() { abortCtl?.abort(); }

export async function runInstruction(raw: string) {
  const text = raw.trim();
  if (!text) return;
  const s = S();
  if (["routing", "drafting", "editing"].includes(s.phase)) return;

  const act = s.addActivity(`Understood: “${trunc(text, 46)}”`);
  S().patch({ phase: "routing" });
  let route;
  try { route = await api.routeInstruction(text, hasDraft()); } catch { route = { intent: "draft" as const }; }
  S().updateActivity(act, { state: "done" });
  S().patch({ phase: hasDraft() ? "done" : "idle" });

  switch (route.intent) {
    case "verify": return runVerify();
    case "export": return exportDoc("docx");
    case "dictate": return dictate(route.text ?? text);
    case "edit": return runEdit(text, route.paragraph);
    case "delete":
      return requestConfirm({
        title: route.paragraph ? `Delete paragraph ${route.paragraph}?` : "Delete the entire draft?",
        message: "This changes your document. You can’t undo a delete from voice.",
        confirmLabel: "Delete", danger: true,
        onConfirm: () => doDelete(route.paragraph),
      });
    default:
      if (hasDraft())
        return requestConfirm({
          title: "Replace the current draft?",
          message: "A new draft will overwrite what is in the workspace.",
          confirmLabel: "Overwrite", danger: true,
          onConfirm: () => runDraft(text, route.skill_id),
        });
      return runDraft(text, route.skill_id);
  }
}

export async function runDraft(text: string, skillArg?: string) {
  const skillId = skillArg ?? S().activeSkillId ?? undefined;
  S().patch({ phase: "drafting", streaming: true, rawDraft: "", citations: [], activeCitationId: null, tokens: null, mobileTab: "draft" });
  S().setDoc("", "external");
  const act = S().addActivity("Retrieving context & style profile");
  abortCtl = new AbortController();
  let raw = "";
  let last = 0;
  const paint = (force = false) => {
    const now = performance.now();
    if (!force && now - last < 60) return;
    last = now;
    S().setDoc(buildHtml(raw).html, "stream");
  };
  try {
    await api.streamDraft(
      { instruction: text, skillId, model: S().model, docIds: S().docs.filter((d) => d.status === "ready").map((d) => d.id) },
      (ev) => {
        if (ev.type === "skill") { S().patch({ activeSkillId: ev.skill_id }); S().updateActivity(act, { label: `Skill: ${skillName(ev.skill_id)} · drafting` }); }
        else if (ev.type === "token") { raw += ev.text; paint(); }
        else if (ev.type === "usage") S().patch({ tokens: { raw: ev.raw, sent: ev.sent } });
        else if (ev.type === "error") throw new Error(ev.message);
      },
      abortCtl.signal,
    );
    const built = buildHtml(raw);
    S().patch({ rawDraft: raw, citations: built.citations, streaming: false, phase: "done", title: titleFrom(raw) });
    S().setDoc(built.html, "stream");
    S().updateActivity(act, { label: "Draft ready", state: "done" });
    if (built.citations.length) await runVerify();
  } catch (e) {
    const aborted = (e as Error).name === "AbortError";
    S().patch({ streaming: false, phase: hasDraft() ? "done" : "idle" });
    S().updateActivity(act, { label: aborted ? "Stopped" : `Draft failed: ${(e as Error).message}`, state: aborted ? "done" : "error" });
  }
}

export async function runVerify() {
  const cites = S().citations;
  if (!cites.length) { S().addActivity("No citations found in this draft", "done"); return; }
  S().patch({ phase: "verifying", mobileTab: S().mobileTab });
  cites.forEach((c) => S().updateCitation({ ...c, status: "pending" }));
  const act = S().addActivity(`Verifying ${cites.length} citations against legal sources`);
  try {
    await api.verifyCitations(cites, (c) => S().updateCitation(c));
    const f = S().citations;
    const n = (st: string) => f.filter((c) => c.status === st).length;
    S().updateActivity(act, { label: `${n("verified")} verified · ${n("partial")} partial · ${n("unverified")} unverified`, state: "done" });
  } catch (e) {
    S().updateActivity(act, { label: `Verification failed: ${(e as Error).message}`, state: "error" });
  }
  S().patch({ phase: "done" });
}

export async function runEdit(text: string, paragraph?: number) {
  S().patch({ phase: "editing" });
  const act = S().addActivity("Applying edit");
  try {
    const r = await api.editText({ instruction: text, html: S().doc.html, model: S().model, paragraph });
    S().setDoc(r.html, "external");
    S().patch({ flashKey: S().flashKey + 1 });
    S().updateActivity(act, { label: r.summary, state: "done" });
  } catch (e) {
    S().updateActivity(act, { label: `Edit failed: ${(e as Error).message}`, state: "error" });
  }
  S().patch({ phase: "done" });
}

function dictate(text: string) {
  S().setDoc(appendParagraph(S().doc.html, text), "external");
  S().patch({ flashKey: S().flashKey + 1 });
  S().addActivity("Dictated paragraph added", "done");
}

function doDelete(paragraph?: number) {
  if (!paragraph) {
    S().setDoc("", "external");
    S().patch({ citations: [], tokens: null, phase: "idle", rawDraft: "", title: "Untitled draft" });
    S().addActivity("Draft deleted", "done");
    return;
  }
  const r = removeParagraph(S().doc.html, paragraph);
  if (r.removed) { S().setDoc(r.html, "external"); S().patch({ flashKey: S().flashKey + 1 }); }
  S().addActivity(r.removed ? `Paragraph ${paragraph} deleted` : `Couldn’t find paragraph ${paragraph}`, r.removed ? "done" : "error");
}

export async function exportDoc(fmt: "docx" | "pdf") {
  if (!hasDraft()) { S().addActivity("Nothing to export yet", "error"); return; }
  const act = S().addActivity(`Exporting ${fmt.toUpperCase()}`);
  try {
    await api.exportDoc(fmt, { title: S().title, html: S().doc.html, citations: S().citations });
    S().updateActivity(act, { label: `${fmt.toUpperCase()} exported with verification summary`, state: "done" });
  } catch (e) {
    S().updateActivity(act, { label: `Export failed: ${(e as Error).message}`, state: "error" });
  }
}

export async function uploadFiles(files: File[]) {
  for (const f of files) {
    const tempId = `tmp-${Math.random().toString(36).slice(2, 8)}`;
    S().patch({ docs: [...S().docs, { id: tempId, name: f.name, size: f.size, status: "processing" }] });
    const act = S().addActivity(`Converting ${trunc(f.name, 26)} to Markdown`);
    try {
      const d = await api.uploadDoc(f);
      S().patch({ docs: S().docs.map((x) => (x.id === tempId ? d : x)) });
      S().updateActivity(act, { label: `Style profile learned from ${trunc(f.name, 22)}`, state: "done" });
    } catch {
      S().patch({ docs: S().docs.map((x) => (x.id === tempId ? { ...x, status: "error" as const } : x)) });
      S().updateActivity(act, { label: `Couldn’t process ${trunc(f.name, 22)}`, state: "error" });
    }
  }
}

export async function runDemo() {
  await uploadFiles([new File(["demo reference"], "Sample_Reference_Notice.docx", { type: "application/octet-stream" })]);
  await runInstruction(DEMO_INSTRUCTION);
}
