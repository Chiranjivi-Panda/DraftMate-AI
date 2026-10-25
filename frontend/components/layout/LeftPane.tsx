import { SkillLibrary } from "../SkillLibrary";
import { UploadZone } from "../UploadZone";

export function LeftPane() {
  return (
    <aside className="glass flex h-full min-h-0 w-full flex-col gap-4 overflow-hidden rounded-2xl p-3.5">
      <div className="max-h-[42%] shrink-0 overflow-y-auto scroll-thin pr-1"><UploadZone /></div>
      <SkillLibrary />
    </aside>
  );
}
