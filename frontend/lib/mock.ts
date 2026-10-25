// Demo data + simulators. Lets the UI run end-to-end with NO backend.
import type { Citation, DraftEvent, RouteResult, Skill, StyleProfile } from "./types";
import { plainText, rewriteText } from "./html";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const SKILLS: Skill[] = [
  { id: "legal_notice", name: "Legal Notice", category: "Drafting", description: "Statutory demand & legal notices with numbered paragraphs and reservation of rights.", triggers: ["legal notice", "demand notice", "notice"], example: "Draft a legal notice for non-payment of ₹5 lakh under Section 138 NI Act", requires_verification: true },
  { id: "contract_drafting", name: "Contract Drafting", category: "Drafting", description: "Commercial contracts with definitions, obligations, indemnity and dispute clauses.", triggers: ["contract", "master services"], example: "Draft a master services contract between two Indian companies", requires_verification: true },
  { id: "agreement", name: "Agreements", category: "Drafting", description: "NDA, rent, service and partnership agreements in your preferred clause style.", triggers: ["agreement", "nda", "lease", "rent"], example: "Draft a residential rent agreement for 11 months in Lucknow", requires_verification: true },
  { id: "petition", name: "Petitions & Pleadings", category: "Litigation", description: "Writ petitions, plaints and applications with facts, grounds and prayer.", triggers: ["petition", "plaint", "writ", "pleading"], example: "Draft a writ petition under Article 226 for delayed pension", requires_verification: true },
  { id: "contract_review", name: "Contract Review", category: "Review", description: "Clause-by-clause risk review with severity flags and suggested fixes.", triggers: ["review contract", "contract review", "review"], example: "Review the uploaded vendor contract and flag risky clauses", requires_verification: true },
  { id: "redlining", name: "Redlining", category: "Review", description: "Tracked-style edits that tighten language while preserving intent.", triggers: ["redline", "markup"], example: "Redline the indemnity clause to favour the buyer", requires_verification: false },
  { id: "due_diligence", name: "Due Diligence", category: "Review", description: "Checklist-driven diligence summaries with gaps and red flags.", triggers: ["due diligence", "diligence"], example: "Prepare a due-diligence checklist for a startup acquisition", requires_verification: true },
  { id: "legal_research", name: "Legal Research", category: "Research", description: "Issue-framed research memos grounded in retrievable authorities.", triggers: ["research", "memo"], example: "Research the law on presumption under Section 139 NI Act", requires_verification: true },
  { id: "case_analysis", name: "Case Analysis", category: "Research", description: "Facts, issues, holding, ratio and relevance — structured case briefs.", triggers: ["case analysis", "analyse case", "analyze case"], example: "Analyse Dashrath Rupsingh Rathod v. State of Maharashtra", requires_verification: true },
  { id: "summarisation", name: "Document Summary", category: "Research", description: "Faithful executive summaries of long judgments, contracts and orders.", triggers: ["summar"], example: "Summarise the uploaded judgment in one page", requires_verification: false },
];

export const MOCK_STYLE: StyleProfile = {
  tone: "Formal, assertive, third-person",
  structure: "Title → Parties → Subject → Numbered facts → Demand → Consequences",
  terminology: ["hereinbefore", "without prejudice", "the noticee", "at your risk as to costs"],
  clausePatterns: ["Time-bound demand (15 days)", "Reservation of rights", "Registered Post A.D. dispatch"],
  formatting: "Bold headings · numbered paragraphs · justified text",
};

const NOTICE = `# LEGAL NOTICE

**Under Section 138 of the Negotiable Instruments Act, 1881**

**By Registered Post A.D. and Email**

**To,**
M/s Rajdhani Traders Pvt. Ltd.,
Through its Director, Mr. Anil Verma,
14, Civil Lines, Lucknow, Uttar Pradesh – 226001

**Subject: Statutory demand for payment of ₹5,00,000/- (Rupees Five Lakh only) against dishonoured Cheque No. 004512.**

Sir,

Under instructions from and on behalf of my client, M/s Amethi Agro Supplies, I hereby serve upon you the following notice:

1. That my client is engaged in the business of supply of agricultural inputs and has, at your request, supplied goods worth ₹5,00,000/- vide Invoice No. AAS/2026/118 dated 12.06.2026.

2. That in discharge of the said liability, you issued Cheque No. 004512 dated 15.08.2026 for ₹5,00,000/- drawn on State Bank of India, Hazratganj Branch, Lucknow, in favour of my client.

3. That the said cheque, when presented for encashment, was returned unpaid vide Bank Memo dated 22.08.2026 with the remark "Funds Insufficient".

4. That the dishonour of the said cheque attracts the offence under [CITE: Section 138, Negotiable Instruments Act, 1881], and this notice is issued within thirty days of receipt of information regarding dishonour, as the law requires.

5. That the Hon'ble Supreme Court has dealt with territorial jurisdiction in such matters in [CITE: Dashrath Rupsingh Rathod v. State of Maharashtra, (2014) 9 SCC 129], and has laid down guidelines for summary trial in [CITE: Meters and Instruments Pvt. Ltd. v. Kanchan Mehta, (2018) 1 SCC 560].

6. That reliance is further placed on [CITE: Sharma v. Gupta Enterprises, AIR 2019 SC 4421] in support of my client's claim.

7. That you are hereby called upon to pay ₹5,00,000/- within fifteen (15) days of receipt of this notice, failing which my client shall be constrained to initiate criminal proceedings in terms of [CITE: Section 142, Negotiable Instruments Act, 1881], at your risk as to costs and consequences.

8. That you please note that this notice is issued without prejudice to my client's other rights and remedies.

Yours faithfully,

**Advocate for the Claimant**`;

const AGREEMENT = `# RESIDENTIAL RENT AGREEMENT

This Agreement is made at Lucknow on this ___ day of ________, 2026,

**BETWEEN** Mr. Rakesh Kumar (hereinafter the "Lessor") **AND** Ms. Neha Singh (hereinafter the "Lessee").

## 1. Nature of Tenancy
1. The Lessor lets the premises at 22, Gomti Nagar, Lucknow to the Lessee for residential use for a term of eleven (11) months, as a lease within the meaning of [CITE: Section 105, Transfer of Property Act, 1882].

## 2. Rent and Deposit
2. The Lessee shall pay monthly rent of ₹18,000/- on or before the 5th of each month and a refundable security deposit of ₹36,000/-.

## 3. Registration
3. The parties acknowledge that a lease exceeding twelve months requires registration under [CITE: Section 17, Registration Act, 1908]; this lease is intentionally limited to eleven months.

## 4. Termination
4. Either party may terminate this Agreement by giving thirty (30) days' written notice.

**Signed by the parties on the date first above written.**`;

const MEMO = `# LEGAL RESEARCH MEMORANDUM

**Issue:** Whether the presumption of consideration operates in favour of a holder of a dishonoured cheque.

## 1. Short Answer
Yes. Once execution of the cheque is admitted, a statutory presumption arises that the cheque was issued for a legally enforceable debt, which the accused may rebut on a preponderance of probabilities.

## 2. Analysis
1. The presumption is recognised and its standard of rebuttal explained in [CITE: Rangappa v. Sri Mohan, (2010) 11 SCC 441].

2. Procedure for summary disposal and compounding of such offences is addressed in [CITE: Meters and Instruments Pvt. Ltd. v. Kanchan Mehta, (2018) 1 SCC 560].

3. Interim compensation to the complainant may be sought under [CITE: Section 143A, Negotiable Instruments Act, 1881].

4. A further authority, [CITE: Verma Holdings v. Union of India, 2021 SCC OnLine SC 9917], is sometimes cited for a stricter standard.

## 3. Recommendation
Plead the presumption expressly, annex the bank memo, and seek interim compensation at the first hearing.`;

export function draftFor(skillId: string): string {
  if (skillId === "agreement" || skillId === "contract_drafting") return AGREEMENT;
  if (["legal_research", "case_analysis", "contract_review", "due_diligence", "summarisation", "redlining"].includes(skillId)) return MEMO;
  return NOTICE;
}

export function matchSkill(text: string): string {
  const t = text.toLowerCase();
  for (const s of SKILLS) if (s.triggers.some((k) => t.includes(k))) return s.id;
  return "legal_notice";
}

const NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
function paraNumber(t: string): number | undefined {
  const m = t.match(/(?:paragraph|para|clause)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i);
  if (!m) return undefined;
  const v = m[1].toLowerCase();
  return NUM[v] ?? parseInt(v, 10);
}

export function mockRoute(text: string, hasDraft: boolean): RouteResult {
  const t = text.toLowerCase().trim();
  const dict = t.match(/^(?:dictate|add paragraph|insert)\s*[:,-]?\s*(.+)$/i);
  if (dict && hasDraft) return { intent: "dictate", text: dict[1] };
  if (/\b(verify|check|validate)\b.*\b(citation|authorit|reference)/.test(t) || /^verify\b/.test(t)) return { intent: "verify" };
  if (/\b(export|download)\b|save as/.test(t)) return { intent: "export" };
  if (hasDraft && /\b(delete|remove)\b/.test(t)) return { intent: "delete", paragraph: paraNumber(t) };
  if (hasDraft && /\b(make|rewrite|rephrase|shorten|simplify|formal|polish|tone|improve|fix)\b/.test(t) && !/\b(draft|prepare|generate)\b/.test(t))
    return { intent: "edit", paragraph: paraNumber(t) };
  return { intent: "draft", skill_id: matchSkill(t) };
}

export async function mockStream(skillId: string | undefined, onEvent: (e: DraftEvent) => void, signal?: AbortSignal) {
  const id = skillId ?? "legal_notice";
  onEvent({ type: "skill", skill_id: id });
  await sleep(650);
  onEvent({ type: "usage", raw: 18420, sent: 3110 });
  await sleep(350);
  const chunks = draftFor(id).match(/\s*\S+|\s+/g) ?? [];
  for (const c of chunks) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    onEvent({ type: "token", text: c });
    await sleep(12 + Math.random() * 20);
  }
  onEvent({ type: "done" });
}

type KB = Omit<Citation, "id" | "text" | "kind">;
const IK = (q: string) => `https://indiankanoon.org/search/?formInput=${encodeURIComponent(q)}`;
const KBASE: { re: RegExp; r: KB }[] = [
  { re: /section 138/i, r: { status: "verified", confidence: 0.98, source_name: "India Code", source_url: "https://www.indiacode.nic.in/", snippet: "Dishonour of a cheque for insufficiency of funds is an offence punishable with imprisonment up to two years or a fine up to twice the cheque amount." } },
  { re: /section 142/i, r: { status: "verified", confidence: 0.94, source_name: "India Code", source_url: "https://www.indiacode.nic.in/", snippet: "Provides that cognizance is taken only on a written complaint by the payee, made within one month of the cause of action." } },
  { re: /kanchan mehta/i, r: { status: "verified", confidence: 0.96, source_name: "Indian Kanoon", source_url: IK("Meters and Instruments v. Kanchan Mehta"), snippet: "Supreme Court treats the offence as largely a civil wrong with criminal remedy and issues guidelines for summary trial and compounding." } },
  { re: /rangappa/i, r: { status: "verified", confidence: 0.95, source_name: "Indian Kanoon", source_url: IK("Rangappa v. Sri Mohan"), snippet: "Larger-bench clarification that the statutory presumption includes the existence of a legally enforceable debt." } },
  { re: /section 17.*registration|registration act/i, r: { status: "verified", confidence: 0.93, source_name: "India Code", source_url: "https://www.indiacode.nic.in/", snippet: "Leases of immovable property for a term exceeding one year require compulsory registration." } },
  { re: /section 105.*transfer of property|transfer of property act/i, r: { status: "verified", confidence: 0.95, source_name: "India Code", source_url: "https://www.indiacode.nic.in/", snippet: "Defines a lease as a transfer of the right to enjoy immovable property for a term, in consideration of rent." } },
  { re: /dashrath/i, r: { status: "partial", confidence: 0.72, source_name: "Indian Kanoon", source_url: IK("Dashrath Rupsingh Rathod v. State of Maharashtra"), snippet: "Case exists and concerns territorial jurisdiction under Section 138.", note: "Jurisdiction rule was later changed by the 2015 amendment to Section 142(2). Proposition may be outdated.", suggestion: "Cite together with Section 142(2) as amended in 2015." } },
  { re: /143a/i, r: { status: "partial", confidence: 0.68, source_name: "India Code", source_url: "https://www.indiacode.nic.in/", snippet: "Provision for interim compensation exists in the Act.", note: "Interim compensation is discretionary and applies to offences after the 2018 amendment; confirm applicability.", suggestion: "Add the cut-off date and the discretionary standard." } },
];

export async function mockVerify(citations: Citation[], onResult: (c: Citation) => void) {
  for (const c of citations) {
    await sleep(650 + Math.random() * 600);
    const hit = KBASE.find((k) => k.re.test(c.text));
    if (hit) onResult({ ...c, ...hit.r });
    else
      onResult({
        ...c, status: "unverified", confidence: 0.1, source_name: "Searched: Indian Kanoon, India Code, eCourts",
        source_url: IK(c.text),
        note: "No matching authority found in accessible sources. This does not prove it is fake, but it must not be filed unverified.",
        suggestion: "Remove it or replace it with an authority confirmed from an official reporter.",
      });
  }
}

const FORMAL: [RegExp, string][] = [
  [/\bplease note\b/gi, "kindly take note"], [/\byou please note\b/gi, "you are kindly requested to note"],
  [/\bpay\b/g, "remit"], [/\bwithin\b/g, "not later than"], [/\bask\b/g, "request"], [/\bget\b/g, "obtain"],
  [/\bso\b/g, "accordingly"], [/\babout\b/g, "regarding"], [/\bmust\b/g, "shall"], [/\bhereby called upon\b/g, "hereby called upon and required"],
];
const SIMPLE: [RegExp, string][] = [
  [/\bhereinbefore\b/g, "above"], [/\bshall\b/g, "must"], [/\bremit\b/g, "pay"], [/\bconstrained to\b/g, "forced to"], [/\bin terms of\b/g, "under"],
];

export function mockEdit(html: string, instruction: string, paragraph?: number): { html: string; summary: string } {
  const simple = /simplif|plain|shorten/i.test(instruction);
  const r = rewriteText(html, simple ? SIMPLE : FORMAL, paragraph);
  const where = paragraph ? `paragraph ${paragraph}` : "the draft";
  if (r.changed === 0) return { html, summary: `No changes needed in ${where}.` };
  return { html: r.html, summary: `Rewrote ${where} in a ${simple ? "simpler" : "more formal"} register (${r.changed} edits). Citations untouched.` };
}

export function mockUpload(file: File) {
  const tokens = Math.max(1200, Math.round(file.size / 4));
  return { id: Math.random().toString(36).slice(2, 9), name: file.name, size: file.size, status: "ready" as const, tokens, style: MOCK_STYLE };
}

export const DEMO_INSTRUCTION = "Draft a legal notice for non-payment of ₹5 lakh under Section 138 NI Act";
export const _plain = plainText;
