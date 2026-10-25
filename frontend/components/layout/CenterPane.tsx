"use client";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { plainText } from "@/lib/html";
import { useStore } from "@/lib/store";
import { CommandBar } from "../CommandBar";
import { DraftEditor } from "../DraftEditor";
import { EmptyState } from "../EmptyState";

export function CenterPane() {
  const has = useStore((s) => plainText(s.doc.html).length > 0);
  const streaming = useStore((s) => s.streaming);
  const [blank, setBlank] = useState(false);
  const showPaper = has || streaming || blank;
  return (
    <section className="glass flex h-full min-h-0 w-full flex-col rounded-2xl p-3.5">
      <div className="min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {showPaper ? <div key="paper" className="h-full"><DraftEditor /></div> : <EmptyState key="empty" onBlank={() => setBlank(true)} />}
        </AnimatePresence>
      </div>
      <CommandBar />
    </section>
  );
}
