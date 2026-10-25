"use client";
import { motion } from "framer-motion";
import { ChevronDown, Download, FileText } from "lucide-react";
import { useState } from "react";
import { exportDoc } from "@/lib/actions";
import { plainText } from "@/lib/html";
import { useStore, type Phase } from "@/lib/store";
import { Logo } from "../Logo";
import { ModelSelector } from "../ModelSelector";
import { ThemeToggle } from "../ThemeToggle";

const PHASE: Record<Phase, string> = {
  idle: "Ready", routing: "Understanding", drafting: "Drafting", verifying: "Verifying citations", editing: "Editing", done: "Review ready",
};

export function TopBar() {
  const title = useStore((s) => s.title);
  const patch = useStore((s) => s.patch);
  const phase = useStore((s) => s.phase);
  const mode = useStore((s) => s.mode);
  const hasDoc = useStore((s) => plainText(s.doc.html).length > 0);
  const [menu, setMenu] = useState(false);
  const busy = phase !== "idle" && phase !== "done";

  return (
    <header className="glass relative z-20 mx-3 mt-3 flex items-center gap-3 rounded-2xl px-4 py-2.5">
      <div className="flex items-center gap-2.5">
        <Logo size={30} />
        <div className="leading-tight">
          <div className="font-display text-lg font-semibold tracking-wide">DraftMate <span className="text-accent">Studio</span></div>
          <div className="hidden text-[10px] uppercase tracking-[0.2em] text-muted sm:block">Legal drafting · verification · voice</div>
        </div>
      </div>

      <div className="mx-auto hidden min-w-0 max-w-md flex-1 items-center gap-2 md:flex">
        <FileText size={15} className="shrink-0 text-muted" />
        <input value={title} onChange={(e) => patch({ title: e.target.value })} aria-label="Document title" className="w-full truncate rounded-md bg-transparent px-1.5 py-1 text-sm font-medium outline-none ring-accent/40 focus:ring-2" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="chip hidden sm:inline-flex">
          <motion.span className={`h-2 w-2 rounded-full ${busy ? "bg-accent" : "bg-emerald-400"}`} animate={busy ? { opacity: [1, 0.3, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }} />
          {PHASE[phase]}
        </span>
        <span className={`chip hidden lg:inline-flex ${mode === "live" ? "!border-emerald-500/40 !text-emerald-400" : ""}`} title={mode === "live" ? "Connected to backend" : "Backend not detected — using built-in demo data"}>
          {mode === "live" ? "Live backend" : "Demo mode"}
        </span>
        <ModelSelector />
        <div className="relative">
          <button className="btn-gold" disabled={!hasDoc} onClick={() => setMenu((m) => !m)}>
            <Download size={15} /> <span className="hidden sm:inline">Export</span> <ChevronDown size={13} />
          </button>
          {menu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="glass absolute right-0 z-40 mt-2 w-44 rounded-xl p-1.5">
                {(["docx", "pdf"] as const).map((f) => (
                  <button key={f} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent/10" onClick={() => { setMenu(false); exportDoc(f); }}>
                    {f === "docx" ? "Word (.docx)" : "PDF (print)"}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
