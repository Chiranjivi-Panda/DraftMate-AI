"use client";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { runVerify } from "@/lib/actions";
import { useStore } from "@/lib/store";
import { CitationCard } from "./CitationCard";
import { SummaryRing } from "./SummaryRing";

const TABS = ["all", "verified", "partial", "unverified"] as const;

export function VerificationPanel() {
  const citations = useStore((s) => s.citations);
  const activeId = useStore((s) => s.activeCitationId);
  const phase = useStore((s) => s.phase);
  const patch = useStore((s) => s.patch);
  const [tab, setTab] = useState<(typeof TABS)[number]>("all");
  const n = (s: string) => citations.filter((c) => c.status === s).length;
  const list = citations.filter((c) => tab === "all" || c.status === tab);
  const verifying = phase === "verifying";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center gap-3">
        <SummaryRing citations={citations} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 font-display text-lg font-semibold"><ShieldCheck size={18} className="text-accent" /> Verification</div>
          <div className="mt-1 space-y-0.5 text-[12px]">
            <div className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-emerald-500" />{n("verified")} verified</div>
            <div className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-amber-500" />{n("partial")} partially verified</div>
            <div className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-rose-500" />{n("unverified")} unverified</div>
          </div>
        </div>
        <button className="btn-icon" disabled={!citations.length || verifying} onClick={() => runVerify()} aria-label="Re-verify citations" title="Re-verify">
          <RefreshCw size={15} className={verifying ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="mb-2 flex gap-1 rounded-xl border border-line/70 bg-panel/40 p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`relative flex-1 rounded-lg px-2 py-1 text-[11px] font-semibold capitalize transition ${tab === t ? "text-ink-950" : "text-muted hover:text-fg"}`}>
            {tab === t && <motion.span layoutId="vtab" className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold-300 to-gold-500" />}
            <span className="relative">{t}</span>
          </button>
        ))}
      </div>

      <div className="scroll-thin relative min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {verifying && <div className="shimmer sticky top-0 z-10 h-[3px] rounded-full" />}
        <AnimatePresence initial={false}>
          {list.map((c) => (
            <CitationCard key={c.id} c={c} active={activeId === c.id} onSelect={() => patch({ activeCitationId: activeId === c.id ? null : c.id })} />
          ))}
        </AnimatePresence>
        {citations.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 3 }} className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent"><ShieldCheck size={28} /></motion.div>
            <p className="text-sm font-semibold">No authorities to verify yet</p>
            <p className="mt-1 text-xs leading-snug text-muted">Every case, section and rule in your draft is checked against accessible legal sources. Unsupported references are flagged, never invented.</p>
          </div>
        )}
        {citations.length > 0 && list.length === 0 && <p className="py-6 text-center text-xs text-muted">Nothing in this filter.</p>}
      </div>
    </div>
  );
}
