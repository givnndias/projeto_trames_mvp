import { Ban, CheckCircle2, HelpCircle } from "lucide-react";
import type { RouteResult } from "@/lib/trames/types";

export function CompatTag({ r }: { r: RouteResult }) {
  if (r.recommended)
    return <span className="inline-flex items-center gap-1 rounded-full bg-success-strong px-3 py-1 text-sm font-semibold text-background"><CheckCircle2 className="h-4 w-4" aria-hidden />Mais adequada à sua prioridade</span>;
  if (r.compatibility === "incompativel")
    return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-semibold text-destructive"><Ban className="h-4 w-4" aria-hidden />Incompatível: {r.blockingReasons.join(", ").toLowerCase()}</span>;
  if (r.compatibility === "insuficiente")
    return <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm font-semibold"><HelpCircle className="h-4 w-4" aria-hidden />Dados insuficientes</span>;
  return null;
}

