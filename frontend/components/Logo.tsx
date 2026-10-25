"use client";
import { motion } from "framer-motion";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <motion.svg viewBox="0 0 64 64" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <motion.path d="M32 8v44" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9 }} />
      <motion.path d="M20 54h24" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.3 }} />
      <motion.g style={{ transformOrigin: "32px 16px" }} animate={{ rotate: [-3, 3, -3] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
        <motion.path d="M10 16h44" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, delay: 0.2 }} />
        <motion.path d="M10 16 4 34h12z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }} />
        <motion.path d="M54 16l-6 18h12z" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }} />
      </motion.g>
      <circle cx="32" cy="8" r="2.5" fill="currentColor" />
    </motion.svg>
  );
}
