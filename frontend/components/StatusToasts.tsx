"use client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

export function StatusToasts() {
  const activity = useStore((s) => s.activity);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const visible = activity.filter((a) => a.state === "running" || now - a.ts < 6000).slice(-3);
  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0 lg:items-end">
      <AnimatePresence initial={false}>
        {visible.map((a) => (
          <motion.div key={a.id} layout initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }} className="glass flex max-w-[88vw] items-center gap-2.5 rounded-full py-2 pl-3 pr-4 text-[12.5px] font-medium">
            {a.state === "running" ? <Loader2 size={14} className="animate-spin text-accent" /> : a.state === "done" ? <Check size={14} className="text-emerald-400" /> : <AlertTriangle size={14} className="text-rose-400" />}
            <span className="truncate">{a.label}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
