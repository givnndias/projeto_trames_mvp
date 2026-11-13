// Recalculation with cache keyed by every input; any change invalidates it.
import type { RawTrecho } from "./audit";
import { searchRoutes, type SearchOutput } from "./ranking";

export interface SearchParams {
  version: string; origin: number | null; dest: number | null; priority: string; blocked: number[];
}

export function cacheKey(p: SearchParams) {
  return [p.version, p.origin, p.dest, p.priority, [...p.blocked].sort((a, b) => a - b).join(",")].join("|");
}

export class RouteCache {
  private key: string | null = null;
  private value: SearchOutput | null = null;
  runs = 0;
  get(records: RawTrecho[] | null, p: SearchParams): SearchOutput {
    const k = cacheKey(p);
    if (k === this.key && this.value) return this.value;
    this.runs++;
    this.value = searchRoutes(records, p.origin, p.dest, p.priority, new Set(p.blocked));
    this.key = k;
    return this.value;
  }
  invalidate() { this.key = null; this.value = null; }
}
