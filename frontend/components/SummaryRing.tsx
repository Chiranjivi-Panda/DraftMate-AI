"use client";
import { motion } from "framer-motion";
import type { Citation } from "@/lib/types";

const R = 36;
const C = 2 * Math.PI * R;

export function SummaryRing({ citations }: { citations: Citation[] }) {
  const total = citations.length || 1;
  const n = (s: string) => citations.filter((c) => c.status === s).length;
  const segs = [
    { k: "verified", v: n("verified"), c: "#10b981" },
    { k: "partial", v: n("partial"), c: "#f59e0b" },
    { k: "unverified", v: n("unverified"), c: "#f43f5e" },
    { k: "pending", v: n("pending"), c: "#d4a64a" },
  ];
  let offset = 0;
  const pct = citations.length ? Math.round((n("verified") / citations.length) * 100) : 0;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(var(--line))" strokeWidth="9" opacity="0.5" />
        {citations.length > 0 && segs.map((s) => {
          const len = (s.v / total) * C;
          const el = (
            <motion.circle key={s.k} cx="50" cy="50" r={R} fill="none" stroke={s.c} strokeWidth="9" strokeLinecap="butt"
              initial={{ strokeDasharray: `0 ${C}` }} animate={{ strokeDasharray: `${Math.max(len - 1, 0)} ${C}`, strokeDashoffset: -offset }} transition={{ duration: 0.8, ease: "easeOut" }} />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-semibold">{citations.length ? `${pct}%` : "—"}</span>
        <span className="text-[9px] uppercase tracking-widest text-muted">verified</span>
      </div>
    </div>
  );
}
