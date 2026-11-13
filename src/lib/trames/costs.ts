// Cost configuration. The original custo_recomendacao is never modified.
import type { Edge } from "./graph";

export type PriorityId =
  | "acessibilidade" | "seguranca" | "orientacao" | "conforto" | "esforco" | "rapidez" | "equilibrado";

export interface PriorityProfile {
  id: PriorityId;
  name: string;
  description: string;
  /** How the edge weight is obtained. */
  cost: "custo_recomendacao" | "distancia" | "derivado_seguranca" | "derivado_iar";
  costLabel: string;
  /** Limitation shown to the user when the base lacks a specific indicator. */
  limitation?: string;
}

/** Proposed prototype weight for derived costs (not an official rule). */
export const ALPHA = 1;

export const profiles: PriorityProfile[] = [
  { id: "equilibrado", name: "Equilibrado", description: "Combinar os critérios.",
    cost: "custo_recomendacao", costLabel: "custo_recomendacao da base (padrão)" },
  { id: "acessibilidade", name: "Acessibilidade", description: "Reduzir barreiras físicas.",
    cost: "derivado_iar", costLabel: "custo derivado: distância × (1 + α·(100 − IAR)/100)",
    limitation: "A base não tem indicador específico de acessibilidade nem informa escadas ou rampas. Usamos o IAR do trecho como aproximação proposta." },
  { id: "seguranca", name: "Segurança relativa", description: "Priorizar melhores indicadores disponíveis.",
    cost: "derivado_seguranca", costLabel: "custo derivado: distância × (1 + α·(100 − score_seguranca)/100)" },
  { id: "orientacao", name: "Orientação", description: "Facilitar localização e travessias.",
    cost: "custo_recomendacao", costLabel: "custo_recomendacao da base",
    limitation: "A base não contém indicador de orientação. Usamos o custo padrão da base." },
  { id: "conforto", name: "Conforto", description: "Valorizar sombra, bancos e boas calçadas.",
    cost: "custo_recomendacao", costLabel: "custo_recomendacao da base",
    limitation: "A base não contém indicador de conforto. Usamos o custo padrão da base." },
  { id: "esforco", name: "Menor esforço", description: "Reduzir desgaste físico.",
    cost: "distancia", costLabel: "distância total",
    limitation: "A base não contém indicador de esforço nem de inclinação. Usamos a distância como aproximação." },
  { id: "rapidez", name: "Rapidez", description: "Priorizar menor distância.",
    cost: "distancia", costLabel: "distância total",
    limitation: "Distância não equivale ao tempo real de deslocamento." },
];

export const getProfile = (id: string): PriorityProfile =>
  profiles.find((p) => p.id === id) ?? profiles[0]!;

/** Edge weight for a profile. Always finite and non‑negative for audited edges. */
export function edgeCost(e: Edge, p: PriorityProfile): number {
  const r = e.raw;
  switch (p.cost) {
    case "custo_recomendacao": return r.custo_recomendacao;
    case "distancia": return r.distancia_m;
    case "derivado_seguranca": return r.distancia_m * (1 + (ALPHA * (100 - r.score_seguranca)) / 100);
    case "derivado_iar": return r.distancia_m * (1 + (ALPHA * (100 - r.IAR)) / 100);
  }
}
