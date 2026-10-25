"use client";
import { create } from "zustand";
import type { ActivityItem, Citation, ConfirmRequest, ModelId, Skill, TokenStats, UploadedDoc, VoiceState } from "./types";

export type Phase = "idle" | "routing" | "drafting" | "verifying" | "editing" | "done";
export type DocSource = "stream" | "user" | "external";

const uid = () => Math.random().toString(36).slice(2, 9);

interface State {
  skills: Skill[];
  skillsLoading: boolean;
  activeSkillId: string | null;
  model: ModelId;
  docs: UploadedDoc[];
  doc: { html: string; rev: number; source: DocSource };
  title: string;
  rawDraft: string;
  streaming: boolean;
  phase: Phase;
  citations: Citation[];
  activeCitationId: string | null;
  tokens: TokenStats | null;
  activity: ActivityItem[];
  voice: { state: VoiceState; transcript: string };
  confirm: ConfirmRequest | null;
  commandDraft: string;
  mobileTab: "skills" | "draft" | "review";
  mode: "live" | "demo";
  flashKey: number;
  checklist: { id: string; label: string; done: boolean }[];

  patch: (p: Partial<State>) => void;
  setDoc: (html: string, source: DocSource) => void;
  setUserHtml: (html: string) => void;
  addActivity: (label: string, state?: ActivityItem["state"]) => string;
  updateActivity: (id: string, p: Partial<ActivityItem>) => void;
  updateCitation: (c: Citation) => void;
  toggleCheck: (id: string) => void;
}

export const useStore = create<State>()((set) => ({
  skills: [],
  skillsLoading: true,
  activeSkillId: null,
  model: "claude",
  docs: [],
  doc: { html: "", rev: 0, source: "external" },
  title: "Untitled draft",
  rawDraft: "",
  streaming: false,
  phase: "idle",
  citations: [],
  activeCitationId: null,
  tokens: null,
  activity: [],
  voice: { state: "idle", transcript: "" },
  confirm: null,
  commandDraft: "",
  mobileTab: "draft",
  mode: "demo",
  flashKey: 0,
  checklist: [
    { id: "parties", label: "Party names, dates & amounts confirmed", done: false },
    { id: "cites", label: "Every flagged citation checked at source", done: false },
    { id: "facts", label: "Facts match client instructions", done: false },
    { id: "signoff", label: "Reviewed by a qualified advocate", done: false },
  ],

  patch: (p) => set(p),
  setDoc: (html, source) => set((s) => ({ doc: { html, source, rev: s.doc.rev + 1 } })),
  setUserHtml: (html) => set((s) => ({ doc: { html, source: "user", rev: s.doc.rev } })),
  addActivity: (label, state = "running") => {
    const id = uid();
    set((s) => ({ activity: [...s.activity, { id, label, state, ts: Date.now() }].slice(-6) }));
    return id;
  },
  updateActivity: (id, p) => set((s) => ({ activity: s.activity.map((a) => (a.id === id ? { ...a, ...p, ts: Date.now() } : a)) })),
  updateCitation: (c) => set((s) => ({ citations: s.citations.map((x) => (x.id === c.id ? { ...x, ...c } : x)) })),
  toggleCheck: (id) => set((s) => ({ checklist: s.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c)) })),
}));
