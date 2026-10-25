"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted ? resolvedTheme === "dark" : true;
  return (
    <button aria-label="Toggle theme" className="btn-icon overflow-hidden" onClick={() => setTheme(dark ? "light" : "dark")}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={dark ? "d" : "l"} initial={{ y: -14, opacity: 0, rotate: -70 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ y: 14, opacity: 0, rotate: 70 }} transition={{ duration: 0.2 }}>
          {dark ? <Moon size={16} /> : <Sun size={16} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
