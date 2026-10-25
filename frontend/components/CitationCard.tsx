"use client";
import { motion } from "framer-motion";
import { ExternalLink, Lightbulb, Loader2, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import type { Citation } from "@/lib/types";

const META = {
  verified: { label: "Verified", icon: ShieldCheck, cls: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10", bar: "bg-emerald-500" },
  partial: { label: "Partially verified", icon: ShieldQuestion, cls: "text-amber-400 border-amber-500/40 bg-amber-500/10", bar: "bg-amber-500" },
  unverified: { label: "Unverified", icon: ShieldAlert, cls: "text-rose-400 border-rose-500/40 bg-rose-500/10", bar: "bg-rose-500" },
  pending: { label: "Checking sources…", icon: Loader2, cls: "text-accent border-accent/40 bg-accent/10", bar: "bg-accent" },
} as const;

export function CitationCard({ c, active, onSelect }: { c: Citation; active: boolean; onSelect: () => void }) {
  const m = META[c.status];
  const Icon = m.icon;
  const pending = c.status === "pending";
  return (
    <motion.div layout initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ type: "spring", stiffness: 380, damping: 32 }}
      onClick={onSelect} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={`relative cursor-pointer overflow-hidden rounded-xl border p-3 transition ${active ? "border-sky-400 shadow-[0_0_0_3px_rgba(56,189,248,.25)]" : "border-line/70 hover:border-accent/50"} bg-panel/55`}>
      {pending && <div className="shimmer absolute inset-0 opacity-60" />}
      <div className="relative">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${m.cls}`}>
            <motion.span key={c.status} initial={{ scale: 0.4, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} className="inline-flex"><Icon size={12} className={pending ? "animate-spin" : ""} /></motion.span>
            {m.label}
          </span>
          <span className="chip !py-0.5 capitalize">{c.kind}</span>
        </div>
        <p className="text-[13px] font-medium leading-snug">{c.text}</p>
        {!pending && (
          <>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/60">
                <motion.div className={`h-full rounded-full ${m.bar}`} initial={{ width: 0 }} animate={{ width: `${Math.round(c.confidence * 100)}%` }} transition={{ duration: 0.7 }} />
              </div>
              <span className="text-[10.5px] tabular-nums text-muted">{Math.round(c.confidence * 100)}% match</span>
            </div>
            {c.snippet && <p className="mt-2 border-l-2 border-accent/40 pl-2 text-[11.5px] leading-snug text-muted">{c.snippet}</p>}
            {c.note && <p className="mt-2 text-[11.5px] leading-snug text-amber-300/90">⚠ {c.note}</p>}
            {c.suggestion && <p className="mt-1.5 flex gap-1.5 text-[11.5px] leading-snug text-sky-300"><Lightbulb size={12} className="mt-0.5 shrink-0" />{c.suggestion}</p>}
            {c.source_url && (
              <a href={c.source_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium text-accent hover:underline">
                <ExternalLink size={12} /> {c.source_name ?? "Source"}
              </a>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
