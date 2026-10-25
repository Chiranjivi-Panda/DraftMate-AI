"use client";
import { motion } from "framer-motion";
import { FileText, Library, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";

const TABS = [
  { id: "skills", label: "Skills", icon: Library },
  { id: "draft", label: "Draft", icon: FileText },
  { id: "review", label: "Review", icon: ShieldCheck },
] as const;

export function MobileTabs() {
  const tab = useStore((s) => s.mobileTab);
  const patch = useStore((s) => s.patch);
  return (
    <nav className="glass relative z-20 mx-3 mb-3 flex rounded-2xl p-1 lg:hidden">
      {TABS.map((t) => (
        <button key={t.id} onClick={() => patch({ mobileTab: t.id })} className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold ${tab === t.id ? "text-ink-950" : "text-muted"}`}>
          {tab === t.id && <motion.span layoutId="mtab" className="absolute inset-0 rounded-xl bg-gradient-to-br from-gold-300 to-gold-500" />}
          <t.icon size={15} className="relative" /> <span className="relative">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
