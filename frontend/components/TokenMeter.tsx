"use client";
import { animate, motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

function useCount(v: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const c = animate(0, v, { duration: 1.1, ease: "easeOut", onUpdate: (x) => setN(Math.round(x)) });
    return () => c.stop();
  }, [v]);
  return n;
}

export function TokenMeter() {
  const t = useStore((s) => s.tokens);
  const raw = t?.raw ?? 0;
  const sent = t?.sent ?? 0;
  const saved = raw ? Math.round((1 - sent / raw) * 100) : 0;
  const cRaw = useCount(raw), cSent = useCount(sent), cSaved = useCount(saved);
  return (
    <div className="rounded-xl border border-line/70 bg-panel/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="label flex items-center gap-1.5"><Zap size={12} className="text-accent" /> Context efficiency</span>
        {t && <span className="font-display text-lg font-semibold text-accent">{cSaved}% saved</span>}
      </div>
      {!t ? (
        <p className="text-[11.5px] text-muted">Token savings from Markdown conversion, selective retrieval and prompt compression appear after the first draft.</p>
      ) : (
        <div className="space-y-2 text-[11px]">
          <div>
            <div className="mb-1 flex justify-between text-muted"><span>Raw context</span><span className="tabular-nums">{cRaw.toLocaleString()} tokens</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-line/60"><motion.div className="h-full rounded-full bg-muted/60" initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 0.8 }} /></div>
          </div>
          <div>
            <div className="mb-1 flex justify-between"><span className="text-accent">Sent to model</span><span className="tabular-nums text-accent">{cSent.toLocaleString()} tokens</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-line/60"><motion.div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600" initial={{ width: 0 }} animate={{ width: `${(sent / raw) * 100}%` }} transition={{ duration: 1.1, delay: 0.2 }} /></div>
          </div>
          <p className="text-muted">Markdown conversion → section retrieval → compression · citations protected</p>
        </div>
      )}
    </div>
  );
}
