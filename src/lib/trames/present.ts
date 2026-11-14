// Presentation helpers (no algorithm logic here).
import type { RouteCandidate } from "./ranking";

/** Display-only estimate: 75 m/min (4,5 km/h). Not real travel time. */
export const WALK_M_PER_MIN = 75;
export const estMinutes = (m: number) => Math.max(1, Math.ceil(m / WALK_M_PER_MIN));
export const fmt = (n: number, d = 0) =>
  Number.isFinite(n) ? n.toLocaleString("pt-BR", { maximumFractionDigits: d, minimumFractionDigits: d }) : "—";
export const shortestOf = (cs: RouteCandidate[]) =>
  cs.reduce<RouteCandidate | null>((a, c) => (!a || c.distance < a.distance ? c : a), null);
