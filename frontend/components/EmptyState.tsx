"use client";
import { motion } from "framer-motion";
import { FileUp, Mic, Play, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { runDemo } from "@/lib/actions";
import { useStore } from "@/lib/store";
import { Logo } from "./Logo";
import { SkillIcon } from "./SkillIcon";

const LINES = [
  "Draft a legal notice for non-payment of ₹5 lakh…",
  "Review this vendor contract and flag risky clauses…",
  "Research the presumption under Section 139 NI Act…",
  "Verify all citations in my petition…",
  "Make paragraph 3 more formal…",
];

function useTypewriter(lines: string[]) {
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const [del, setDel] = useState(false);
  useEffect(() => {
    const full = lines[i];
    let delay = del ? 14 : 34;
    if (!del && n === full.length) delay = 1500;
    const t = setTimeout(() => {
      if (!del && n === full.length) setDel(true);
      else if (del && n === 0) { setDel(false); setI((i + 1) % lines.length); }
      else setN(n + (del ? -1 : 1));
    }, delay);
    return () => clearTimeout(t);
  }, [n, del, i, lines]);
  return lines[i].slice(0, n);
}

export function EmptyState({ onBlank }: { onBlank: () => void }) {
  const text = useTypewriter(LINES);
  const skills = useStore((s) => s.skills).slice(0, 4);
  const patch = useStore((s) => s.patch);

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex h-full flex-col items-center justify-center px-6 py-8 text-center">
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}><Logo size={64} /></motion.div>
      <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
        What shall we <span className="bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300 bg-clip-text text-transparent">draft</span> today?
      </h1>
      <p className="mt-3 h-6 max-w-xl font-mono text-sm text-muted">{text}<span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-[blink_1s_steps(1)_infinite] bg-accent" /></p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button className="btn-gold !px-5 !py-2.5" onClick={() => runDemo()}><Play size={16} /> Run guided demo</button>
        <button className="btn" onClick={onBlank}>Start blank</button>
      </div>

      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { i: <FileUp size={18} />, t: "Learn your style", d: "Upload a past draft — tone, structure and clauses are mirrored." },
          { i: <ShieldCheck size={18} />, t: "Verified citations", d: "Every authority is checked. Unsupported ones are flagged, never invented." },
          { i: <Mic size={18} />, t: "Voice-driven", d: "Dictate, edit and confirm risky actions with your voice." },
        ].map((c, k) => (
          <motion.div key={c.t} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + k * 0.1 }} whileHover={{ y: -4 }} className="rounded-2xl border border-line/70 bg-panel/50 p-4 text-left">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">{c.i}</div>
            <div className="text-sm font-semibold">{c.t}</div>
            <p className="mt-1 text-xs leading-snug text-muted">{c.d}</p>
          </motion.div>
        ))}
      </div>

      {skills.length > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {skills.map((s) => (
            <button key={s.id} className="chip transition hover:border-accent/60 hover:text-accent" onClick={() => patch({ activeSkillId: s.id, commandDraft: s.example ?? "" })}>
              <SkillIcon id={s.id} size={13} /> {s.name}
            </button>
          ))}
          <span className="chip"><Sparkles size={12} /> +{Math.max(0, useStore.getState().skills.length - 4)} more</span>
        </div>
      )}
    </motion.div>
  );
}
