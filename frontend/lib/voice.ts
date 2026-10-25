"use client";
// ── VOICE HOOK ──  Web Speech API (Chrome). Member 4 can extend / swap for Whisper.
import { useCallback, useEffect, useRef, useState } from "react";
import { resolveConfirm, runInstruction } from "./actions";
import { useStore } from "./store";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function useVoice() {
  const recRef = useRef<any>(null);
  const [supported, setSupported] = useState(true);
  const state = useStore((s) => s.voice.state);
  const transcript = useStore((s) => s.voice.transcript);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    const patch = useStore.getState().patch;

    rec.onstart = () => patch({ voice: { state: "listening", transcript: "" } });
    rec.onresult = (e: any) => {
      let t = "";
      let final = false;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        t += e.results[i][0].transcript;
        if (e.results[i].isFinal) final = true;
      }
      patch({ voice: { state: final ? "processing" : "listening", transcript: t } });
      if (final) handleFinal(t.trim());
    };
    rec.onerror = () => {
      patch({ voice: { state: "error", transcript: "Mic unavailable or permission denied" } });
      setTimeout(() => patch({ voice: { state: "idle", transcript: "" } }), 2200);
    };
    rec.onend = () => {
      if (useStore.getState().voice.state === "listening") patch({ voice: { state: "idle", transcript: "" } });
    };
    recRef.current = rec;
    return () => { try { rec.abort(); } catch { /* noop */ } };
  }, []);

  const toggle = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    if (useStore.getState().voice.state === "listening") rec.stop();
    else { try { rec.start(); } catch { /* already started */ } }
  }, []);

  return { supported, state, transcript, toggle };
}

async function handleFinal(text: string) {
  const patch = useStore.getState().patch;
  const done = () => setTimeout(() => patch({ voice: { state: "idle", transcript: "" } }), 1400);
  if (useStore.getState().confirm) {
    if (/\b(confirm|yes|proceed|go ahead|do it)\b/i.test(text)) resolveConfirm(true);
    else if (/\b(cancel|no|stop|don'?t)\b/i.test(text)) resolveConfirm(false);
    done();
    return;
  }
  await runInstruction(text);
  done();
}
