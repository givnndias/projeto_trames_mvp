import { describe, expect, it } from "vitest";
import { auditBase, type RawTrecho } from "./audit";
import { buildGraph } from "./graph";
import { bellmanFordDP, reconstruct } from "./dp";
import { edgeCost, getProfile } from "./costs";
import { searchRoutes } from "./ranking";
import { RouteCache } from "./recalc";
import { DEFAULT_AUDIT } from "./base";

const rec = (id: number, o: number, d: number, dist: number, cost = dist, extra: Partial<RawTrecho> = {}): RawTrecho => ({
  id_trecho: id, origem_id: o, destino_id: d, distancia_m: dist, IAR: 50, faixa_IAR: "x",
  score_recursos: 10, score_seguranca: 50, score_avaliacao: 50, qtd_avaliacoes: 1,
  qtd_ocorrencias: 0, qtd_ocorrencias_ativas: 0, penalidade_ocorrencias: 0, penalidade_obstaculos: 0,
  custo_recomendacao: cost, confianca_dados: "Alta", ...extra,
});
const w = (e: { raw: RawTrecho }) => e.raw.custo_recomendacao;

describe("audit", () => {
  it("rejects zero and negative distances with ID and reason, keeps valid ones", () => {
    const a = auditBase([rec(1, 1, 2, 0), rec(2, 1, 2, -5), rec(3, 1, 2, 10)]);
    expect(a.valid.map((r) => r.id_trecho)).toEqual([3]);
    expect(a.invalid.map((i) => i.id)).toEqual(["1", "2"]);
    expect(a.invalid[0]!.reasons[0]).toContain("distancia_m");
  });
  it("flags missing fields, NaN and active > total; accepts 1.0 counts", () => {
    const { custo_recomendacao: _c, ...missing } = rec(1, 1, 2, 10);
    const a = auditBase([missing, rec(2, 1, 2, NaN), rec(3, 1, 2, 10, 10, { qtd_ocorrencias: 1, qtd_ocorrencias_ativas: 2 }), rec(4, 1, 2, 10, 10, { qtd_ocorrencias: 1.0 })]);
    expect(a.invalid.map((i) => i.id)).toEqual(["1", "2", "3"]);
    expect(a.valid.map((r) => r.id_trecho)).toEqual([4]);
  });
  it("whole invalid base gives friendly fatal error", () => {
    expect(auditBase({ foo: 1 }).fatal).toBeTruthy();
    expect(auditBase([rec(1, 1, 2, -1)]).ok).toBe(false);
  });
  it("real base: 200 records audited", () => {
    expect(DEFAULT_AUDIT.total).toBe(200);
    expect(DEFAULT_AUDIT.valid.length + DEFAULT_AUDIT.invalid.length).toBe(200);
  });
});

describe("DP search", () => {
  it("keeps parallel edges and picks the cheaper one", () => {
    const g = buildGraph([rec(1, 1, 2, 10, 50), rec(2, 1, 2, 10, 20)]);
    expect(g.edges.length).toBe(2);
    expect(reconstruct(bellmanFordDP(g, 1, w), 2)!.edges.map((e) => e.id)).toEqual([2]);
  });
  it("respects direction", () => {
    const g = buildGraph([rec(1, 1, 2, 10)]);
    expect(reconstruct(bellmanFordDP(g, 2, w), 1)).toBeNull();
  });
  it("unreachable destination", () => {
    expect(searchRoutes([rec(1, 1, 2, 10), rec(2, 3, 1, 10)], 1, 3, "equilibrado", new Set()).status).toBe("inalcancavel");
  });
  it("tie: lower id_trecho wins deterministically", () => {
    const g = buildGraph([rec(7, 1, 2, 10, 30), rec(3, 1, 2, 10, 30)]);
    expect(reconstruct(bellmanFordDP(g, 1, w), 2)!.edges[0]!.id).toBe(3);
  });
  it("blocking an edge reroutes, and blocking all yields 'bloqueado'", () => {
    const rs = [rec(1, 1, 2, 10, 10), rec(2, 1, 3, 10, 10), rec(3, 3, 2, 10, 10)];
    expect(searchRoutes(rs, 1, 2, "equilibrado", new Set([1])).candidates[0]!.edgeIds).toEqual([2, 3]);
    expect(searchRoutes(rs, 1, 2, "equilibrado", new Set([1, 2])).status).toBe("bloqueado");
  });
  it("priority change changes the result (custo vs distância)", () => {
    const rs = [rec(1, 1, 2, 100, 10), rec(2, 1, 2, 50, 90)];
    expect(searchRoutes(rs, 1, 2, "equilibrado", new Set()).candidates[0]!.edgeIds).toEqual([1]);
    expect(searchRoutes(rs, 1, 2, "rapidez", new Set()).candidates[0]!.edgeIds).toEqual([2]);
  });
  it("returned cost equals the sum of reconstructed edges (real base)", () => {
    const p = getProfile("equilibrado");
    const out = searchRoutes(DEFAULT_AUDIT.valid, 1, 5, "equilibrado", new Set());
    for (const c of out.candidates) {
      const sum = c.path.edges.reduce((a, e) => a + edgeCost(e, p), 0);
      expect(c.cost).toBeCloseTo(sum, 6);
    }
    expect(new Set(out.candidates.map((c) => c.key)).size).toBe(out.candidates.length);
  });
  it("matches brute-force enumeration of simple paths on a small graph", () => {
    const rs = [rec(1, 1, 2, 4), rec(2, 1, 3, 1), rec(3, 3, 2, 1), rec(4, 2, 4, 5), rec(5, 3, 4, 8), rec(6, 2, 3, 1), rec(7, 1, 4, 20), rec(8, 2, 4, 3)];
    const g = buildGraph(rs);
    for (const t of [2, 3, 4]) {
      let best = Infinity;
      const dfs = (v: number, seen: Set<number>, c: number) => {
        if (v === t) { best = Math.min(best, c); return; }
        for (const e of g.out.get(v) ?? []) if (!seen.has(e.to)) dfs(e.to, new Set([...seen, e.to]), c + w(e));
      };
      dfs(1, new Set([1]), 0);
      expect(reconstruct(bellmanFordDP(g, 1, w), t)!.cost).toBe(best);
    }
  });
});

describe("recalc cache", () => {
  it("reuses on same params, recomputes on base/block change", () => {
    const c = new RouteCache(); const rs = [rec(1, 1, 2, 10)];
    const p = { version: "a", origin: 1, dest: 2, priority: "equilibrado", blocked: [] as number[] };
    c.get(rs, p); c.get(rs, p); expect(c.runs).toBe(1);
    c.get(rs, { ...p, version: "b" }); expect(c.runs).toBe(2);
    c.get(rs, { ...p, version: "b", blocked: [1] }); expect(c.runs).toBe(3);
  });
});
