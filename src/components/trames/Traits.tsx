import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";
import { routeTraits } from "@/lib/trames/traits";
import type { RouteResult } from "@/lib/trames/types";
import { cn } from "@/lib/utils";

export function Traits({ r, compact }: { r: RouteResult; compact?: boolean }) {
  const list = routeTraits(r).filter((t) => !compact || t.tone !== "unknown");
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Características da rota">
      {list.map((t) => {
        const Icon = t.tone === "good" ? CheckCircle2 : t.tone === "warn" ? AlertTriangle : HelpCircle;
        return (
          <li key={t.key} className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium",
            t.tone === "good" ? "bg-muted text-success-strong" : t.tone === "warn" ? "bg-beige text-brand-strong" : "bg-muted text-muted-foreground")}>
            <Icon className="h-4 w-4" aria-hidden />{t.label}
          </li>
        );
      })}
    </ul>
  );
}
