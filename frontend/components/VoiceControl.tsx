"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { useVoice } from "@/lib/voice";

export function VoiceControl() {
  const { supported, state, transcript, toggle } = useVoice();
  const live = state === "listening";
  return (
    <>
      <button onClick={toggle} disabled={!supported} aria-label={live ? "Stop listening" : "Start voice command"} title={supported ? "Voice command" : "Voice needs Chrome / Edge"}
        className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition ${live ? "mic-live border-rose-500 bg-rose-500/15 text-rose-400" : "border-line/70 bg-panel/60 text-fg/80 hover:border-accent/60 hover:text-accent"} disabled:opacity-40`}>
        {supported ? <Mic size={17} /> : <MicOff size={17} />}
      </button>
      <AnimatePresence>
        {state !== "idle" && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} className="glass pointer-events-none absolute -top-14 left-1/2 z-20 flex max-w-[92%] -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2 text-sm">
            <span className={`flex h-5 items-center gap-[3px] ${state === "error" ? "text-amber-400" : "text-rose-400"}`}>
              {[0, 1, 2, 3, 4].map((i) => <i key={i} className="wave-bar" style={{ animationDelay: `${i * 0.12}s`, animationPlayState: live ? "running" : "paused" }} />)}
            </span>
            <span className="truncate">
              <span className="mr-2 text-[10px] font-semibold uppercase tracking-widest text-muted">{state === "listening" ? "Listening" : state === "processing" ? "Understood" : "Error"}</span>
              {transcript || "Speak your instruction…"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
