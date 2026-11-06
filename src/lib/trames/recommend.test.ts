import { describe, expect, it } from "vitest";
import { recommend } from "./recommend";
import { profiles } from "./profiles";

describe("Trames recommendation", () => {
  it("Rapidez recommends Rota A (600 m) when no restriction is selected", () => {
    const r = recommend("estacao", "biblioteca", "rapidez");
    expect(r.recommendedId).toBe("rota-a");
    expect(r.results.find((x) => x.route.id === "rota-a")!.distance).toBe(600);
  });

  it("Acessibilidade recommends Rota B (850 m)", () => {
    const r = recommend("estacao", "biblioteca", "acessibilidade");
    expect(r.recommendedId).toBe("rota-b");
    expect(r.results.find((x) => x.route.id === "rota-b")!.distance).toBe(850);
  });

  it("stairs restriction makes Rota A incompatible even under Rapidez", () => {
    const r = recommend("estacao", "biblioteca", "rapidez", ["semEscadas"]);
    expect(r.recommendedId).not.toBe("rota-a");
    expect(r.results.find((x) => x.route.id === "rota-a")!.compatibility).toBe("incompativel");
  });

  it("Rota B explanation mentions +250 m, avoided stairs and ramps", () => {
    const r = recommend("estacao", "biblioteca", "acessibilidade");
    const b = r.results.find((x) => x.route.id === "rota-b")!;
    expect(b.explanation).toContain("adiciona 250 metros");
    expect(b.explanation).toContain("evita escadas");
    expect(b.explanation).toContain("rampas");
  });

  it("missing data yields insufficient, not compatible", () => {
    const r = recommend("estacao", "biblioteca", "equilibrado");
    expect(r.results.find((x) => x.route.id === "rota-d")!.compatibility).toBe("insuficiente");
  });

  it("no compatible route between Praça and Mercado for Acessibilidade", () => {
    const r = recommend("praca", "mercado", "acessibilidade");
    expect(r.status).toBe("sem-compativel");
    expect(r.recommendedId).toBeNull();
  });

  it("unregistered pair returns sem-rotas", () => {
    expect(recommend("hospital", "estacao", "equilibrado").status).toBe("sem-rotas");
  });

  it("every profile's weights total 100", () => {
    for (const p of profiles) {
      expect(Object.values(p.weights).reduce((a, b) => a + (b ?? 0), 0)).toBe(100);
    }
  });
});
