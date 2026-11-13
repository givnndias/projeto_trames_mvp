import { CheckCircle2 } from "lucide-react";
import type { RouteCandidate } from "@/lib/trames/ranking";

export function CompatTag({ r }: { r: RouteCandidate }) {
  if (!r.recommended) return null;
  return <span className="inline-flex items-center gap-1 rounded-full bg-success-strong px-3 py-1 text-sm font-semibold text-background">
    <CheckCircle2 className="h-4 w-4" aria-hidden />Mais adequada à sua prioridade</span>;
}
