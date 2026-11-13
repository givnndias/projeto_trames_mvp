// Bellman‑Ford by maximum number of edges (dynamic programming).
//   DP[k][v] = min cost to reach v from s using at most k edges.
//   DP[0][s] = 0; DP[0][v≠s] = ∞
//   DP[k][v] = min( DP[k-1][v], min_{(u→v,e)} DP[k-1][u] + w(e) )
// Only DP[k-1] is read when filling DP[k] (no in‑place relaxation).
// Ties: a candidate replaces the current value only if strictly smaller, so
// (1) keeping DP[k-1][v] (fewer edges) wins, then (2) the lowest id_trecho wins
// because edges are scanned in ascending id order.
import type { Edge, Graph } from "./graph";

export type Pred = { kind: "keep" } | { kind: "edge"; edge: Edge } | null;

export interface DpResult {
  source: number;
  nodes: number[];
  table: Map<number, number>[]; // table[k].get(v)
  pred: Map<number, Pred>[];
  maxK: number;
}

export function bellmanFordDP(g: Graph, source: number, weight: (e: Edge) => number): DpResult {
  const nodes = g.nodes;
  const maxK = Math.max(0, nodes.length - 1);
  const table: Map<number, number>[] = [];
  const pred: Map<number, Pred>[] = [];
  const t0 = new Map<number, number>(); const p0 = new Map<number, Pred>();
  for (const v of nodes) { t0.set(v, v === source ? 0 : Infinity); p0.set(v, null); }
  table.push(t0); pred.push(p0);

  for (let k = 1; k <= maxK; k++) {
    const prev = table[k - 1]!;
    const cur = new Map<number, number>(); const pk = new Map<number, Pred>();
    for (const v of nodes) { cur.set(v, prev.get(v)!); pk.set(v, prev.get(v)! < Infinity ? { kind: "keep" } : null); }
    for (const e of g.edges) {
      const du = prev.get(e.from)!;
      if (du === Infinity) continue;
      const cand = du + weight(e);
      if (cand < cur.get(e.to)!) { cur.set(e.to, cand); pk.set(e.to, { kind: "edge", edge: e }); }
    }
    table.push(cur); pred.push(pk);
  }
  return { source, nodes, table, pred, maxK };
}

export interface PathResult { nodes: number[]; edges: Edge[]; cost: number }

export function reconstruct(dp: DpResult, target: number): PathResult | null {
  let k = dp.maxK;
  const cost = dp.table[k]?.get(target);
  if (cost === undefined || cost === Infinity) return null;
  const edges: Edge[] = [];
  let v = target;
  while (k > 0) {
    const p = dp.pred[k]!.get(v);
    if (!p) break;
    if (p.kind === "keep") { k--; continue; }
    edges.push(p.edge); v = p.edge.from; k--;
  }
  if (v !== dp.source) return null;
  edges.reverse();
  return { nodes: [dp.source, ...edges.map((e) => e.to)], edges, cost };
}
