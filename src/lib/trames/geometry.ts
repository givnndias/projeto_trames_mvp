// Schematic geometry: turns a calculated route into the polyline drawn on the map.
import { findSegment, getNode } from "./data";
import type { RouteDef } from "./types";

export type Pt = [number, number];

/** Ordered points of a route, oriented from `origin`, following segment street geometry. */
export function routePolyline(route: RouteDef, origin?: string): Pt[] {
  const path = route.from === origin || !origin ? route.path : [...route.path].reverse();
  const out: Pt[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]!, b = path[i + 1]!;
    const seg = findSegment(a, b);
    const na = getNode(a)!, nb = getNode(b)!;
    let via = seg?.via ?? [];
    if (seg && seg.a !== a) via = [...via].reverse();
    if (!out.length) out.push([na.x, na.y]);
    out.push(...via, [nb.x, nb.y]);
  }
  return out;
}

export function bounds(pts: Pt[], pad = 30) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x = Math.min(...xs) - pad, y = Math.min(...ys) - pad;
  return { x, y, w: Math.max(...xs) + pad - x, h: Math.max(...ys) + pad - y };
}
