// ── SHARED DATA CONTRACT ── (backend teammates: return exactly these shapes)
export type CitationStatus = "pending" | "verified" | "partial" | "unverified";
export type CitationKind = "case" | "statute" | "rule" | "other";
export type ModelId = "claude" | "gpt" | "gemini";
export type VoiceState = "idle" | "listening" | "processing" | "error";
export type Intent = "draft" | "edit" | "verify" | "export" | "delete" | "overwrite" | "dictate";

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  triggers: string[];
  example?: string;
  requires_verification?: boolean;
  icon?: string;
}

export interface Citation {
  id: string;
  text: string;
  kind: CitationKind;
  status: CitationStatus;
  confidence: number; // 0..1
  source_name?: string;
  source_url?: string;
  snippet?: string;
  note?: string;
  suggestion?: string;
}

export interface StyleProfile {
  tone: string;
  structure: string;
  terminology: string[];
  clausePatterns: string[];
  formatting: string;
}

export interface UploadedDoc {
  id: string;
  name: string;
  size: number;
  status: "processing" | "ready" | "error";
  tokens?: number;
  style?: StyleProfile;
}

export interface TokenStats { raw: number; sent: number }

export interface ActivityItem { id: string; label: string; state: "running" | "done" | "error"; ts: number }

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

export interface RouteResult { intent: Intent; skill_id?: string; paragraph?: number; text?: string }

export interface DraftRequest { instruction: string; skillId?: string; model: ModelId; docIds: string[] }

// Server-Sent Events emitted by POST /api/draft  (each as `data: {json}\n\n`)
export type DraftEvent =
  | { type: "skill"; skill_id: string }
  | { type: "token"; text: string }
  | { type: "usage"; raw: number; sent: number }
  | { type: "done" }
  | { type: "error"; message: string };
