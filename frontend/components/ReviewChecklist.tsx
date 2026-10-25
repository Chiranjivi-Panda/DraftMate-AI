"use client";
import { AnimatePresence, motion } from "framer-motion";
import { BadgeCheck, Check } from "lucide-react";
import { useStore } from "@/lib/store";

export function ReviewChecklist() {
  const list = useStore((s) => s.checklist);
  const toggle = useStore((s) => s.toggleCheck);
  const done = list.filter((c) => c.done).length;
  return (
    <div className="rounded-xl border border-line/70 bg-panel/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="label">Human review</span>
        <span className="text-[11px] tabular-nums text-muted">{done}/{list.length}</span>
      </div>
      <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-line/60"><motion.div className="h-full rounded-full bg-accent" animate={{ width: `${(done / list.length) * 100}%` }} /></div>
      <ul className="space-y-1">
        {list.map((c) => (
          <li key={c.id}>
            <button onClick={() => toggle(c.id)} className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[12px] hover:bg-accent/10">
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${c.done ? "border-accent bg-accent text-ink-950" : "border-line"}`}>
                <AnimatePresence>{c.done && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={11} strokeWidth={3} /></motion.span>}</AnimatePresence>
              </span>
              <span className={c.done ? "text-muted line-through" : ""}>{c.label}</span>
            </button>
          </li>
        ))}
      </ul>
      <AnimatePresence>
        {done === list.length && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 flex items-center gap-1.5 overflow-hidden rounded-lg bg-emerald-500/10 px-2 py-1.5 text-[11.5px] font-medium text-emerald-400">
            <BadgeCheck size={14} /> Ready for advocate sign-off
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
