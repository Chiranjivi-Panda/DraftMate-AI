"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export function Splash() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("dm-splash")) return;
      sessionStorage.setItem("dm-splash", "1");
    } catch { /* ignore */ }
    setShow(true);
    const t = setTimeout(() => setShow(false), 2300);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div key="splash" className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg" exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.6 }}>
          <Logo size={92} />
          <div className="mt-6 flex overflow-hidden font-display text-4xl font-semibold tracking-wide">
            {"DraftMate Studio".split("").map((ch, i) => (
              <motion.span key={i} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.035, duration: 0.45 }}>
                {ch === " " ? "\u00A0" : ch}
              </motion.span>
            ))}
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="mt-3 text-sm text-muted">
            Draft in your style · Verify every authority · Command by voice
          </motion.p>
          <div className="mt-8 h-[3px] w-56 overflow-hidden rounded-full bg-line/60">
            <motion.div className="h-full rounded-full bg-accent" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2, ease: "easeInOut" }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
