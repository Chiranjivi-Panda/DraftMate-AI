import { AlignLeft, FileSignature, Gavel, GitCompare, Handshake, Library, Scale, ScrollText, SearchCheck, ShieldCheck, Sparkles } from "lucide-react";

const MAP = {
  legal_notice: ScrollText, contract_drafting: FileSignature, agreement: Handshake, petition: Gavel,
  contract_review: ShieldCheck, redlining: GitCompare, due_diligence: SearchCheck,
  legal_research: Library, case_analysis: Scale, summarisation: AlignLeft,
} as const;

export function SkillIcon({ id, size = 18 }: { id: string; size?: number }) {
  const Icon = (MAP as Record<string, typeof Sparkles>)[id] ?? Sparkles;
  return <Icon size={size} />;
}
