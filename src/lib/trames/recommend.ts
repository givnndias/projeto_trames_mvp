// Recommendation engine: pure functions, no UI.
import { findSegment, getBarrier, getFeature, getNode, routes as allRoutes } from "./data";
import { getProfile } from "./profiles";
import type {
  Dimension, PriorityId, Recommendation, RestrictionId, RouteDef, RouteResult, Segment,
} from "./types";

/** Walking speed premise: 75 m/min (4.5 km/h). */
export const WALK_M_PER_MIN = 75;
export const CROSSING_MIN = 0.5;
export const STAIRS_MIN = 1;

export function routeSegments(route: RouteDef, reversed = false): Segment[] {
  const path = reversed ? [...route.path].reverse() : route.path;
  const segs: Segment[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const s = findSegment(path[i], path[i + 1]);
    if (s) segs.push(s);
  }
  return segs;
}

export function estimateMinutes(segs: Segment[]): number {
  let m = 0;
  for (const s of segs) {
    m += s.length / WALK_M_PER_MIN + s.crossings * CROSSING_MIN;
    if (s.barriers.includes("escada")) m += STAIRS_MIN;
  }
  return Math.ceil(m);
}

export function routesBetween(from: string, to: string) {
  return allRoutes
    .filter((r) => (r.from === from && r.to === to) || (r.from === to && r.to === from))
    .map((r) => ({ route: r, reversed: r.from !== from }));
}

const uniq = <T,>(a: T[]) => Array.from(new Set(a));

function listPt(items: string[]) {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join(", ") + " e " + items[items.length - 1];
}

export function computeIar(
  ind: Record<Dimension, number | null>,
  weights: Partial<Record<Dimension, number>>,
): { iar: number | null; missing: Dimension[] } {
  const missing: Dimension[] = [];
  let sum = 0;
  for (const [dim, w] of Object.entries(weights) as [Dimension, number][]) {
    if (!w) continue;
    const v = ind[dim];
    if (v === null || v === undefined) missing.push(dim);
    else sum += v * w;
  }
  if (missing.length) return { iar: null, missing };
  return { iar: Math.round(sum / 100), missing };
}

export function recommend(
  from: string,
  to: string,
  priority: PriorityId,
  userRestrictions: RestrictionId[] = [],
): Recommendation {
  const profile = getProfile(priority);
  const applied = uniq([...userRestrictions, ...profile.impliedRestrictions]);
  const found = routesBetween(from, to);
  if (!found.length) return { status: "sem-rotas", results: [], recommendedId: null, appliedRestrictions: applied };

  const base = found.map(({ route, reversed }) => {
    const segs = routeSegments(route, reversed);
    return {
      route, segs,
      distance: segs.reduce((a, s) => a + s.length, 0),
      minutes: estimateMinutes(segs),
    };
  });
  const minMinutes = Math.min(...base.map((b) => b.minutes));
  const shortest = base.reduce((a, b) => (b.distance < a.distance ? b : a));
  const shortestBarriers = uniq(shortest.segs.flatMap((s) => s.barriers));
  const shortestFeatures = uniq(shortest.segs.flatMap((s) => s.features));

  const results: RouteResult[] = base.map((b) => {
    const indicators: Record<Dimension, number | null> = {
      ...b.route.indicators,
      rapidez: Math.round((100 * minMinutes) / b.minutes),
    };
    const barrierIds = uniq(b.segs.flatMap((s) => s.barriers));
    const featureIds = uniq(b.segs.flatMap((s) => s.features));
    const blockingReasons = barrierIds
      .map(getBarrier)
      .filter((br) => br.blocks && applied.includes(br.blocks))
      .map((br) => br.label);
    const { iar, missing } = computeIar(indicators, profile.weights);
    const compatibility = blockingReasons.length ? "incompativel" : iar === null ? "insuficiente" : "compativel";

    // Explanation built only from registered data.
    const delta = b.distance - shortest.distance;
    const avoided = shortestBarriers.filter((x) => !barrierIds.includes(x)).map((x) => getBarrier(x).phrase);
    const gained = featureIds.filter((x) => !shortestFeatures.includes(x)).map((x) => getFeature(x).phrase);
    const own = barrierIds.map((x) => getBarrier(x).phrase);
    let explanation: string;
    if (delta === 0) {
      explanation = `É a alternativa mais curta (${b.distance} m).`;
      if (own.length) explanation += ` Possui ${listPt(own)}.`;
    } else {
      const pos: string[] = [];
      if (avoided.length) pos.push(`evita ${listPt(avoided)}`);
      if (gained.length) pos.push(`possui ${listPt(gained)}`);
      explanation = `Esta alternativa adiciona ${delta} metros em relação à rota mais curta`;
      explanation += pos.length ? `, mas ${pos.join(" e ")}.` : ".";
      if (own.length) explanation += ` Atenção: possui ${listPt(own)}.`;
    }
    const missingSegs = b.segs.filter((s) => s.missingData).map((s) => s.missingData!);
    if (missingSegs.length) explanation += ` ${missingSegs.join(" ")} Falta de dados não significa ausência de barreiras.`;

    return {
      route: b.route, segments: b.segs, distance: b.distance, minutes: b.minutes,
      indicators, iar, compatibility, blockingReasons, missingDimensions: missing,
      features: featureIds.map(getFeature), barriers: barrierIds.map(getBarrier),
      deltaFromShortest: delta, explanation, recommended: false,
    };
  });

  const compatible = results.filter((r) => r.compatibility === "compativel");
  let recommendedId: string | null = null;
  if (compatible.length) {
    const best = compatible.reduce((a, b) =>
      (b.iar! > a.iar! || (b.iar === a.iar && b.distance < a.distance)) ? b : a);
    best.recommended = true;
    recommendedId = best.route.id;
  }

  const order = { compativel: 0, insuficiente: 1, incompativel: 2 };
  results.sort((a, b) =>
    Number(b.recommended) - Number(a.recommended) ||
    order[a.compatibility] - order[b.compatibility] ||
    (b.iar ?? -1) - (a.iar ?? -1));

  let status: Recommendation["status"] = "ok";
  if (!compatible.length) {
    status = results.some((r) => r.compatibility === "insuficiente") && !results.every((r) => r.compatibility === "incompativel")
      ? "dados-insuficientes" : "sem-compativel";
  }
  return { status, results, recommendedId, appliedRestrictions: applied };
}

export function nodeLabel(id: string) {
  const n = getNode(id);
  return n && "name" in n ? n.name : null;
}
