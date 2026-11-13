// Candidate generation, aggregation and ranking.
import type { Graph } from "./graph";
import { buildGraph, nodeName } from "./graph";
import type { RawTrecho } from "./audit";
import { bellmanFordDP, reconstruct, type PathResult } from "./dp";
import { edgeCost, getProfile, type PriorityProfile } from "./costs";

export interface RouteCandidate {
  key: string; // edge ID sequence
  label: string;
  nodes: number[];
  edgeIds: number[];
  path: PathResult;
  distance: number;
  cost: number;
  iar: number; // distance‑weighted mean
  faixa: string;
  scores: { recursos: number; seguranca: number; avaliacao: number };
  occurrencesActive: number;
  lowConfidence: number; // edges with non‑"Alta" confidence
  confidenceAlerts: string[];
  explanation: string;
  recommended: boolean;
  deltaFromShortest: number;
}

export type SearchStatus =
  | "ok" | "origem-invalida" | "mesmo-local" | "inalcancavel" | "bloqueado" | "base-invalida";

export interface SearchOutput {
  status: SearchStatus;
  profile: PriorityProfile;
  candidates: RouteCandidate[];
  requested: number;
  graph: Graph | null;
}

export const MAX_ALTERNATIVES = 4;

const wmean = (p: PathResult, f: (r: RawTrecho) => number) => {
  const d = p.edges.reduce((a, e) => a + e.raw.distancia_m, 0);
  return p.edges.reduce((a, e) => a + f(e.raw) * e.raw.distancia_m, 0) / d;
};

export function faixaFor(iar: number) {
  if (iar >= 70) return "Alta adequação";
  if (iar >= 50) return "Adequação moderada";
  if (iar >= 25) return "Baixa adequação";
  return "Adequação crítica";
}

/**
 * Alternatives strategy (explicit): run the DP for the best path; then, for each
 * edge of each accepted path, re‑run the DP with that edge removed in addition to
 * the edges already removed to obtain that path (bounded to 60 extra runs). Collect
 * unique paths (by edge‑ID sequence), rank by accumulated cost, keep the top N.
 */
export function searchRoutes(
  records: RawTrecho[] | null,
  origin: number | null,
  dest: number | null,
  priority: string,
  blocked: ReadonlySet<number>,
): SearchOutput {
  const profile = getProfile(priority);
  const base = { profile, candidates: [], requested: MAX_ALTERNATIVES };
  if (!records || records.length === 0) return { ...base, status: "base-invalida", graph: null };
  const full = buildGraph(records);
  if (origin === null || dest === null || !full.nodes.includes(origin) || !full.nodes.includes(dest))
    return { ...base, status: "origem-invalida", graph: full };
  if (origin === dest) return { ...base, status: "mesmo-local", graph: full };

  const w = (e: Parameters<typeof edgeCost>[0]) => edgeCost(e, profile);
  const g = buildGraph(records, blocked);
  const best = reconstruct(bellmanFordDP(g, origin, w), dest);
  if (!best) {
    const reachableUnblocked = blocked.size > 0 && reconstruct(bellmanFordDP(full, origin, w), dest);
    return { ...base, status: reachableUnblocked ? "bloqueado" : "inalcancavel", graph: g };
  }

  const found = new Map<string, PathResult>();
  const keyOf = (p: PathResult) => p.edges.map((e) => e.id).join("-");
  found.set(keyOf(best), best);
  // Each child inherits its parent's removed edges plus one more (cumulative).
  const queue: { p: PathResult; removed: Set<number> }[] = [{ p: best, removed: new Set(blocked) }];
  let runs = 0;
  while (queue.length && found.size < MAX_ALTERNATIVES * 3 && runs < 60) {
    const { p, removed } = queue.shift()!;
    for (const e of p.edges) {
      const extra = new Set(removed); extra.add(e.id);
      runs++;
      const alt = reconstruct(bellmanFordDP(buildGraph(records, extra), origin, w), dest);
      if (alt && !found.has(keyOf(alt))) { found.set(keyOf(alt), alt); queue.push({ p: alt, removed: extra }); }
    }
  }
  const ranked = [...found.values()].sort((a, b) => a.cost - b.cost || keyOf(a).localeCompare(keyOf(b))).slice(0, MAX_ALTERNATIVES);
  const minDist = Math.min(...ranked.map((p) => p.edges.reduce((a, e) => a + e.raw.distancia_m, 0)));
  const maxIar = Math.max(...ranked.map((p) => wmean(p, (r) => r.IAR)));

  const candidates: RouteCandidate[] = ranked.map((p, i) => {
    const distance = p.edges.reduce((a, e) => a + e.raw.distancia_m, 0);
    const iar = wmean(p, (r) => r.IAR);
    const low = p.edges.filter((e) => e.raw.confianca_dados !== "Alta");
    const alerts: string[] = [];
    if (low.length) alerts.push(`${low.length} de ${p.edges.length} trecho(s) com confiança dos dados ${[...new Set(low.map((e) => e.raw.confianca_dados.toLowerCase()))].join("/")}.`);
    const noReviews = p.edges.filter((e) => e.raw.qtd_avaliacoes === 0).length;
    if (noReviews) alerts.push(`${noReviews} trecho(s) sem avaliações de usuários.`);
    const active = p.edges.reduce((a, e) => a + e.raw.qtd_ocorrencias_ativas, 0);
    const label = `Rota ${String.fromCharCode(65 + i)}`;
    const delta = distance - minDist;
    let explanation = i === 0
      ? `Menor custo acumulado para a prioridade “${profile.name}” (${profile.costLabel}).`
      : `Alternativa com custo acumulado ${Math.round(((p.cost - ranked[0]!.cost) / ranked[0]!.cost) * 100)}% maior que a recomendada.`;
    explanation += delta === 0 ? " É a mais curta entre as alternativas." : ` Adiciona ${delta} m em relação à mais curta.`;
    explanation += iar === maxIar ? " Tem o maior IAR médio entre as alternativas." : ` IAR médio ${iar.toFixed(1)} (o maior é ${maxIar.toFixed(1)}).`;
    if (active) explanation += ` Há ${active} ocorrência(s) ativa(s) registrada(s) nos trechos.`;
    return {
      key: keyOf(p), label, nodes: p.nodes, edgeIds: p.edges.map((e) => e.id), path: p,
      distance, cost: p.cost, iar, faixa: faixaFor(iar),
      scores: {
        recursos: wmean(p, (r) => r.score_recursos),
        seguranca: wmean(p, (r) => r.score_seguranca),
        avaliacao: wmean(p, (r) => r.score_avaliacao),
      },
      occurrencesActive: active, lowConfidence: low.length, confidenceAlerts: alerts,
      explanation, recommended: i === 0, deltaFromShortest: delta,
    };
  });
  return { status: "ok", profile, candidates, requested: MAX_ALTERNATIVES, graph: g };
}

export const routeTitle = (c: RouteCandidate) => c.nodes.map(nodeName).join(" → ");
