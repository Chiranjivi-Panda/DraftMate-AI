import { ReviewChecklist } from "../ReviewChecklist";
import { TokenMeter } from "../TokenMeter";
import { VerificationPanel } from "../VerificationPanel";

export function RightPane() {
  return (
    <aside className="glass flex h-full min-h-0 w-full flex-col gap-3 overflow-hidden rounded-2xl p-3.5">
      <VerificationPanel />
      <div className="scroll-thin max-h-[40%] shrink-0 space-y-2 overflow-y-auto">
        <TokenMeter />
        <ReviewChecklist />
        <p className="px-1 text-center text-[10.5px] leading-snug text-muted">AI-assisted draft. Not legal advice — must be reviewed by a qualified advocate.</p>
      </div>
    </aside>
  );
}
