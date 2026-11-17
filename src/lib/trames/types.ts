// Domain model for Trames. Kept free of UI code so it can later be served by an API.

export type Dimension =
  | "acessibilidade"
  | "seguranca"
  | "orientacao"
  | "conforto"
  | "esforco"
  | "rapidez";

export type PriorityId =
  | "acessibilidade"
  | "seguranca"
  | "orientacao"
  | "conforto"
  | "esforco"
  | "rapidez"
  | "equilibrado";

export type RestrictionId = "semEscadas" | "semLadeiras";

export interface Place {
  id: string;
  name: string;
  short: string;
  x: number;
  y: number;
}

export interface Junction {
  id: string;
  x: number;
  y: number;
}

export interface Feature {
  id: string;
  label: string;
  /** Short phrase used inside generated explanations ("possui rampas"). */
  phrase: string;
}

export interface Barrier {
  id: string;
  label: string;
  phrase: string;
  /** Restriction that turns this barrier into an impeditive one. */
  blocks?: RestrictionId;
}

export interface Segment {
  id: string;
  a: string;
  b: string;
  name: string;
  length: number; // meters
  features: string[];
  barriers: string[];
  /** Crossings with traffic lights on this segment. */
  crossings: number;
  /** Intermediate schematic points from a to b, so lines follow streets. */
  via?: [number, number][];
  /** Optional segment where data is known to be missing. */
  missingData?: string;
}

/** Indicator 0–100 (higher = better). null = dados insuficientes. */
export type Indicators = Record<Exclude<Dimension, "rapidez">, number | null>;

export interface RouteDef {
  id: string;
  label: string;
  name: string;
  from: string;
  to: string;
  /** Ordered node ids (places and junctions). */
  path: string[];
  indicators: Indicators;
}

export interface PriorityProfile {
  id: PriorityId;
  name: string;
  description: string;
  weights: Partial<Record<Dimension, number>>;
  /** Restrictions applied automatically for this profile. */
  impliedRestrictions: RestrictionId[];
  hypothesis?: boolean;
}

export type Compatibility = "compativel" | "incompativel" | "insuficiente";

export interface RouteResult {
  route: RouteDef;
  segments: Segment[];
  distance: number;
  minutes: number;
  indicators: Record<Dimension, number | null>;
  iar: number | null;
  compatibility: Compatibility;
  blockingReasons: string[];
  missingDimensions: Dimension[];
  features: Feature[];
  barriers: Barrier[];
  deltaFromShortest: number;
  explanation: string;
  recommended: boolean;
}

export interface Recommendation {
  status: "ok" | "sem-rotas" | "sem-compativel" | "dados-insuficientes";
  results: RouteResult[];
  recommendedId: string | null;
  appliedRestrictions: RestrictionId[];
}
