"use client";
import { useEffect } from "react";
import { bootstrap } from "@/lib/actions";
import { useStore } from "@/lib/store";
import { AnimatedBackground } from "./AnimatedBackground";
import { ConfirmModal } from "./ConfirmModal";
import { MobileTabs } from "./MobileTabs";
import { Splash } from "./Splash";
import { StatusToasts } from "./StatusToasts";
import { CenterPane } from "./layout/CenterPane";
import { LeftPane } from "./layout/LeftPane";
import { RightPane } from "./layout/RightPane";
import { TopBar } from "./layout/TopBar";

export function Workspace() {
  const tab = useStore((s) => s.mobileTab);
  useEffect(() => { bootstrap(); }, []);
  const show = (id: string) => (tab === id ? "flex" : "hidden") + " lg:flex";
  return (
    <div className="relative flex h-dvh w-full flex-col">
      <AnimatedBackground />
      <Splash />
      <TopBar />
      {/* 3-pane grid:  LEFT = skills + uploads · CENTER = drafting · RIGHT = verification/review */}
      <main className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[300px_minmax(0,1fr)_370px]">
        <div className={`min-h-0 ${show("skills")}`}><LeftPane /></div>
        <div className={`min-h-0 ${show("draft")}`}><CenterPane /></div>
        <div className={`min-h-0 ${show("review")}`}><RightPane /></div>
      </main>
      <MobileTabs />
      <StatusToasts />
      <ConfirmModal />
    </div>
  );
}
