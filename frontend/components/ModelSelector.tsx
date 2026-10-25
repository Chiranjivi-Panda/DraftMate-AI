"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Cpu } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { ModelId } from "@/lib/types";

const MODELS: { id: ModelId; name: string; hint: string; dot: string }[] = [
  { id: "claude", name: "Claude", hint: "Careful legal reasoning", dot: "bg-orange-400" },
  { id: "gpt", name: "GPT", hint: "Fast general drafting", dot: "bg-emerald-400" },
  { id: "gemini", name: "Gemini", hint: "Long-context documents", dot: "bg-sky-400" },
];

export function ModelSelector() {
  const model = useStore((s) => s.model);
  const patch = useStore((s) => s.patch);
  const [open, setOpen] = useState(false);
  const cur = MODELS.find((m) => m.id === model)!;
  return (
    <div className="relative">
      <button className="btn" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}>
        <Cpu size={15} className="text-accent" />
        <span className={`h-2 w-2 rounded-full ${cur.dot}`} />
        <span className="hidden sm:inline">{cur.name}</span>
        <ChevronDown size={14} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.ul initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.14 }} className="glass absolute right-0 z-40 mt-2 w-60 rounded-xl p-1.5" role="listbox">
              {MODELS.map((m) => (
                <li key={m.id}>
                  <button onClick={() => { patch({ model: m.id }); setOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-accent/10">
                    <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />
                    <span className="flex-1">
                      <span className="block text-sm font-medium">{m.name}</span>
                      <span className="block text-xs text-muted">{m.hint}</span>
                    </span>
                    {m.id === model && <Check size={15} className="text-accent" />}
                  </button>
                </li>
              ))}
            </motion.ul>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
