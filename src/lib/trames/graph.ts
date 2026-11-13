// Directed multigraph built from audited records. Parallel edges are preserved.
import type { RawTrecho } from "./audit";

export interface Edge {
  id: number; from: number; to: number;
  raw: RawTrecho; // original values kept for traceability
}
export interface Graph { nodes: number[]; edges: Edge[]; out: Map<number, Edge[]> }

export function buildGraph(records: RawTrecho[], blocked: ReadonlySet<number> = new Set()): Graph {
  const nodeSet = new Set<number>();
  const edges: Edge[] = [];
  for (const r of records) {
    nodeSet.add(r.origem_id); nodeSet.add(r.destino_id);
    if (blocked.has(r.id_trecho)) continue; // explicit blocks excluded before search
    edges.push({ id: r.id_trecho, from: r.origem_id, to: r.destino_id, raw: r });
  }
  edges.sort((a, b) => a.id - b.id); // deterministic order
  const out = new Map<number, Edge[]>();
  for (const e of edges) {
    if (!out.has(e.from)) out.set(e.from, []);
    out.get(e.from)!.push(e);
  }
  return { nodes: [...nodeSet].sort((a, b) => a - b), edges, out };
}

export const nodeName = (id: number) => `Local ${id}`;
