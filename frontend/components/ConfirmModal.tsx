"use client";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Mic } from "lucide-react";
import { useEffect } from "react";
import { resolveConfirm } from "@/lib/actions";
import { useStore } from "@/lib/store";

export function ConfirmModal() {
  const c = useStore((s) => s.confirm);
  useEffect(() => {
    if (!c) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") resolveConfirm(false); if (e.key === "Enter") resolveConfirm(true); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [c]);
  return (
    <AnimatePresence>
      {c && (
        <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => resolveConfirm(false)}>
          <motion.div role="alertdialog" aria-modal="true" initial={{ opacity: 0, y: 20, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.96 }} transition={{ type: "spring", stiffness: 420, damping: 30 }} onClick={(e) => e.stopPropagation()} className="glass w-full max-w-md rounded-2xl p-6">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${c.danger ? "bg-rose-500/15 text-rose-400" : "bg-accent/15 text-accent"}`}><AlertTriangle size={24} /></div>
            <h3 className="font-display text-xl font-semibold">{c.title}</h3>
            <p className="mt-1.5 text-sm text-muted">{c.message}</p>
            <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-muted"><Mic size={12} /> Say “confirm” or “cancel” · or press Enter / Esc</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn" onClick={() => resolveConfirm(false)}>Cancel</button>
              <button onClick={() => resolveConfirm(true)} className={c.danger ? "inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[.98]" : "btn-gold"}>{c.confirmLabel}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
