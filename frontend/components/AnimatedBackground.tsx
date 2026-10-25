export function AnimatedBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="blob -left-24 -top-24 h-[420px] w-[420px] bg-gold-500/60" />
      <div className="blob right-[-120px] top-1/4 h-[480px] w-[480px] bg-sky-500/40" style={{ animationDelay: "-8s" }} />
      <div className="blob bottom-[-160px] left-1/3 h-[460px] w-[460px] bg-violet-500/40" style={{ animationDelay: "-15s" }} />
      <div className="bg-grid absolute inset-0" />
    </div>
  );
}
