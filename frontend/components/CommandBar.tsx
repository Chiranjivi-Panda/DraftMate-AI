"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Square, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { runInstruction, stopGeneration } from "@/lib/actions";
import { useStore } from "@/lib/store";
import { SkillIcon } from "./SkillIcon";
import { VoiceControl } from "./VoiceControl";

const SUGGEST = ["Verify all citations", "Make paragraph 3 more formal", "Delete paragraph 5", "Dictate: The parties shall resolve disputes by arbitration at Lucknow", "Export as Word"];

export function CommandBar() {
  const [val, setVal] = useState("");
  const [focus, setFocus] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const phase = useStore((s) => s.phase);
  const skills = useStore((s) => s.skills);
  const activeId = useStore((s) => s.activeSkillId);
  const draft = useStore((s) => s.commandDraft);
  const patch = useStore((s) => s.patch);
  const busy = phase === "routing" || phase === "drafting" || phase === "editing";
  const skill = skills.find((s) => s.id === activeId);

  useEffect(() => {
    if (draft) { setVal(draft); ref.current?.focus(); patch({ commandDraft: "" }); }
  }, [draft, patch]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); ref.current?.focus(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const submit = () => { const t = val.trim(); if (!t || busy) return; setVal(""); runInstruction(t); };

  return (
    <div className="relative mt-3">
      <div className={`rounded-2xl p-px transition ${focus ? "ring-anim" : "bg-line/70"}`}>
        <div className="flex items-center gap-2 rounded-2xl bg-bg/95 p-2 backdrop-blur">
          <AnimatePresence>
            {skill && (
              <motion.span initial={{ opacity: 0, scale: 0.8, width: 0 }} animate={{ opacity: 1, scale: 1, width: "auto" }} exit={{ opacity: 0, scale: 0.8, width: 0 }} className="chip !border-accent/50 !bg-accent/10 !text-accent whitespace-nowrap">
                <SkillIcon id={skill.id} size={12} /> {skill.name}
                <button aria-label="Clear skill" onClick={() => patch({ activeSkillId: null })}><X size={12} /></button>
              </motion.span>
            )}
          </AnimatePresence>
          <input ref={ref} value={val} onChange={(e) => setVal(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={skill ? `Instruct ${skill.name}…  e.g. ${skill.example ?? ""}` : "Tell DraftMate what to draft, edit or verify…   (⌘/Ctrl + K)"} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted/70" />
          <VoiceControl />
          {phase === "drafting" ? (
            <button onClick={stopGeneration} aria-label="Stop" className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white"><Square size={15} /></button>
          ) : (
            <button onClick={submit} disabled={!val.trim() || busy} aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-300 to-gold-500 text-ink-950 shadow-[0_8px_24px_-8px_rgba(212,166,74,.7)] transition hover:brightness-110 active:scale-95 disabled:opacity-40"><ArrowUp size={18} /></button>
          )}
        </div>
      </div>
      <div className="scroll-thin mt-2 flex gap-1.5 overflow-x-auto pb-1">
        {SUGGEST.map((s) => (
          <button key={s} onClick={() => { setVal(s); ref.current?.focus(); }} className="chip shrink-0 transition hover:border-accent/60 hover:text-accent">{s.length > 44 ? s.slice(0, 42) + "…" : s}</button>
        ))}
      </div>
    </div>
  );
}
