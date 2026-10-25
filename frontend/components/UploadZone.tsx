"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, FileText, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { uploadFiles } from "@/lib/actions";
import { useStore } from "@/lib/store";

export function UploadZone() {
  const docs = useStore((s) => s.docs);
  const [drag, setDrag] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const take = (files: FileList | null) => { if (files?.length) uploadFiles(Array.from(files)); };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label">Reference materials</span>
        <span className="chip">{docs.length} files</span>
      </div>
      <motion.div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files); }}
        onClick={() => input.current?.click()} animate={{ scale: drag ? 1.02 : 1 }}
        className={`group relative cursor-pointer overflow-hidden rounded-xl border border-dashed p-4 text-center transition ${drag ? "border-accent bg-accent/10" : "border-line hover:border-accent/60"}`}
      >
        <input ref={input} type="file" multiple hidden accept=".pdf,.docx,.doc,.txt,.md,.pptx" onChange={(e) => take(e.target.files)} />
        <motion.div animate={{ y: drag ? -3 : 0 }}><UploadCloud className="mx-auto mb-1 text-accent" size={22} /></motion.div>
        <p className="text-sm font-medium">Drop templates or past drafts</p>
        <p className="text-[11px] text-muted">PDF · DOCX · TXT · PPTX → Markdown</p>
      </motion.div>

      <ul className="mt-2 space-y-1.5">
        <AnimatePresence initial={false}>
          {docs.map((d) => (
            <motion.li key={d.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="rounded-xl border border-line/70 bg-panel/50 px-3 py-2">
              <button className="flex w-full items-center gap-2 text-left" onClick={() => d.style && setOpen(open === d.id ? null : d.id)}>
                <FileText size={15} className="shrink-0 text-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{d.name}</span>
                  <span className="block text-[11px] text-muted">
                    {d.status === "processing" ? "Converting → Markdown · learning style…" : d.status === "error" ? "Failed" : `${(d.tokens ?? 0).toLocaleString()} tokens · style learned`}
                  </span>
                </span>
                {d.status === "processing" && <Loader2 size={15} className="animate-spin text-accent" />}
                {d.status === "ready" && <><Check size={15} className="text-emerald-400" /><ChevronDown size={14} className={`text-muted transition ${open === d.id ? "rotate-180" : ""}`} /></>}
              </button>
              <AnimatePresence>
                {open === d.id && d.style && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="mt-2 space-y-2 border-t border-line/60 pt-2 text-[11.5px]">
                      <div className="flex items-center gap-1.5 font-semibold text-accent"><Sparkles size={12} /> Learned style profile</div>
                      <p><span className="text-muted">Tone · </span>{d.style.tone}</p>
                      <p><span className="text-muted">Structure · </span>{d.style.structure}</p>
                      <div className="flex flex-wrap gap-1">{d.style.terminology.map((t) => <span key={t} className="chip">{t}</span>)}</div>
                      <div className="flex flex-wrap gap-1">{d.style.clausePatterns.map((t) => <span key={t} className="chip !border-accent/40 !text-accent">{t}</span>)}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
