// Derives user-facing route characteristics strictly from registered data.
import type { RouteResult } from "./types";

export type TraitTone = "good" | "warn" | "unknown";
export interface Trait { key: string; label: string; tone: TraitTone }

export function routeTraits(r: RouteResult): Trait[] {
  const f = new Set(r.features.map((x) => x.id));
  const b = new Set(r.barriers.map((x) => x.id));
  const missing = r.segments.some((s) => s.missingData);
  const t: Trait[] = [];
  t.push(b.has("escada") ? { key: "escadas", label: "Com escadas", tone: "warn" } : { key: "escadas", label: "Sem escadas", tone: "good" });
  t.push(f.has("rampa") ? { key: "rampas", label: "Rampas", tone: "good" } : { key: "rampas", label: "Sem rampas cadastradas", tone: "unknown" });
  t.push(b.has("calcada_irregular") || b.has("terra")
    ? { key: "calcada", label: "Calçada irregular", tone: "warn" }
    : f.has("calcada_boa") && !missing ? { key: "calcada", label: "Calçada boa", tone: "good" }
    : { key: "calcada", label: missing ? "Calçada: dados incompletos" : "Calçada: sem dados", tone: "unknown" });
  t.push(b.has("pouca_iluminacao") ? { key: "luz", label: "Pouca iluminação", tone: "warn" }
    : f.has("iluminacao") ? { key: "luz", label: "Boa iluminação", tone: "good" }
    : { key: "luz", label: "Iluminação: sem dados", tone: "unknown" });
  t.push(f.has("bancos") ? { key: "descanso", label: "Pontos de descanso", tone: "good" }
    : { key: "descanso", label: "Descanso: sem dados", tone: "unknown" });
  if (b.has("ladeira")) t.push({ key: "ladeira", label: "Ladeira íngreme", tone: "warn" });
  return t;
}
