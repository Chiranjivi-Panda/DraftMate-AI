"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { SkillIcon } from "./SkillIcon";

export function SkillLibrary() {
  const skills = useStore((s) => s.skills);
  const loading = useStore((s) => s.skillsLoading);
  const active = useStore((s) => s.activeSkillId);
  const patch = useStore((s) => s.patch);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");

  const cats = useMemo(() => ["All", ...Array.from(new Set(skills.map((s) => s.category)))], [skills]);
  const list = skills.filter((s) => (cat === "All" || s.category === cat) && (s.name + s.description).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className="label">Legal skills</span>
        <span className="chip">{skills.length} loaded</span>
      </div>
      <div className="relative mb-2">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search skills…" className="w-full rounded-xl border border-line/70 bg-panel/50 py-2 pl-8 pr-3 text-sm outline-none transition focus:border-accent/60" />
      </div>
      <div className="scroll-thin -mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`relative shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${cat === c ? "text-ink-950" : "text-muted hover:text-fg"}`}>
            {cat === c && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-300 to-gold-500" />}
            <span className="relative">{c}</span>
          </button>
        ))}
      </div>

      <div className="scroll-thin -mr-1 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {loading && Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-[76px] rounded-xl border border-line/60" />)}
        <AnimatePresence initial={false}>
          {list.map((s) => {
            const on = active === s.id;
            return (
              <motion.button
                key={s.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} whileHover={{ y: -2 }} whileTap={{ scale: 0.985 }}
                onClick={() => patch({ activeSkillId: on ? null : s.id, commandDraft: on ? "" : s.example ?? "" })}
                className={`relative block w-full overflow-hidden rounded-xl border p-3 text-left transition ${on ? "border-accent bg-accent/10 shadow-[0_0_0_1px_rgb(var(--accent)/.4),0_12px_30px_-12px_rgb(var(--accent)/.5)]" : "border-line/70 bg-panel/50 hover:border-accent/50"}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${on ? "bg-gradient-to-br from-gold-300 to-gold-500 text-ink-950" : "bg-accent/10 text-accent"}`}>
                    <SkillIcon id={s.id} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold">{s.name}</span>
                      {s.requires_verification && <ShieldCheck size={13} className="shrink-0 text-emerald-400" aria-label="Verifies citations" />}
                    </div>
                    <p className="line-clamp-2 text-[11.5px] leading-snug text-muted">{s.description}</p>
                  </div>
                  {on && <Check size={16} className="mt-0.5 shrink-0 text-accent" />}
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {!loading && list.length === 0 && <p className="py-6 text-center text-sm text-muted">No skills match “{q}”.</p>}
      </div>
    </div>
  );
}
