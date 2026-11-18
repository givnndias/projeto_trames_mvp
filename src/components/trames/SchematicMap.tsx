import { Component, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Minus, Plus, Scan } from "lucide-react";
import { getNode, getPlace, places, segments } from "@/lib/trames/data";
import { bounds, routePolyline, type Pt } from "@/lib/trames/geometry";
import type { RouteResult } from "@/lib/trames/types";
import { cn } from "@/lib/utils";

const FULL = { x: 0, y: 20, w: 400, h: 420 };
type VB = typeof FULL;

interface Props {
  results?: RouteResult[] | undefined;
  selectedId?: string | null | undefined;
  origin?: string | undefined;
  destination?: string | undefined;
  onSelect?: ((id: string) => void) | undefined;
  progressNode?: string | undefined;
  className?: string | undefined;
  controls?: boolean | undefined;
}

const toStr = (pts: Pt[]) => pts.map((p) => p.join(",")).join(" ");

function segPts(s: (typeof segments)[number]): Pt[] {
  const a = getNode(s.a)!, b = getNode(s.b)!;
  return [[a.x, a.y], ...(s.via ?? []), [b.x, b.y]];
}

/** Label position on the longest straight leg of a polyline. */
function legLabel(pts: Pt[]) {
  let best = 0, bi = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1]![0] - pts[i]![0], pts[i + 1]![1] - pts[i]![1]);
    if (d > best) { best = d; bi = i; }
  }
  const p = pts[bi]!, q = pts[bi + 1]!;
  return { x: (p[0] + q[0]) / 2, y: (p[1] + q[1]) / 2, vertical: Math.abs(q[0] - p[0]) < 1, len: best };
}

// Context-only streets (unnamed) so the grid reads like a city.
const CONTEXT: Pt[][] = [
  [[0, 80], [400, 80]], [[0, 180], [400, 180]], [[0, 260], [400, 260]], [[0, 340], [400, 340]], [[0, 410], [400, 410]],
  [[60, 20], [60, 440]], [[120, 20], [120, 440]], [[180, 20], [180, 440]], [[240, 20], [240, 440]], [[300, 20], [300, 440]], [[340, 20], [340, 440]],
];

function MapInner({ results = [], selectedId, origin, destination, onSelect, progressNode, className, controls = true }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [vb, setVb] = useState<VB>(FULL);
  const vbRef = useRef(vb); vbRef.current = vb;
  const drag = useRef<{ x: number; y: number; vb: VB } | null>(null);

  const sel = results.find((r) => r.route.id === selectedId);
  const lines = useMemo(() => results.map((r) => ({ r, pts: routePolyline(r.route, origin) })), [results, origin]);
  const selPts = sel ? routePolyline(sel.route, origin) : null;

  const fit = useCallback(() => {
    const pts = selPts ?? lines.flatMap((l) => l.pts);
    if (!pts.length) return setVb(FULL);
    const b = bounds(pts, 45);
    setVb(b);
  }, [selPts?.join("|"), lines]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fit(); }, [selectedId, origin, destination]); // eslint-disable-line react-hooks/exhaustive-deps

  const zoom = useCallback((f: number, cx?: number, cy?: number) => {
    setVb((v) => {
      const w = Math.min(Math.max(v.w * f, 90), 600), k = w / v.w, h = v.h * k;
      const px = cx ?? v.x + v.w / 2, py = cy ?? v.y + v.h / 2;
      return { x: px - (px - v.x) * k, y: py - (py - v.y) * k, w, h };
    });
  }, []);

  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect(), v = vbRef.current;
      const s = Math.max(v.w / r.width, v.h / r.height);
      const cx = v.x + v.w / 2 + (e.clientX - r.left - r.width / 2) * s;
      const cy = v.y + v.h / 2 + (e.clientY - r.top - r.height / 2) * s;
      zoom(Math.exp(e.deltaY * (e.deltaMode === 1 ? 16 : 1) * 0.0015), cx, cy);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoom]);

  const onDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY, vb }; };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; const el = svgRef.current; if (!d || !el) return;
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) el.setPointerCapture(e.pointerId);
    const r = el.getBoundingClientRect(); const s = Math.max(d.vb.w / r.width, d.vb.h / r.height);
    setVb({ ...d.vb, x: d.vb.x - (e.clientX - d.x) * s, y: d.vb.y - (e.clientY - d.y) * s });
  };
  const onUp = () => { drag.current = null; };

  const scale = vb.w / FULL.w; // < 1 = zoomed in
  const fs = (n: number) => n * Math.max(scale, 0.45);
  const prog = progressNode ? getNode(progressNode) : null;
  const o = origin ? getNode(origin) : null, d = destination ? getNode(destination) : null;
  const selSegIds = new Set(sel?.segments.map((s) => s.id));
  const showAllLabels = scale < 0.7;

  return (
    <div className={cn("relative overflow-hidden bg-map-land", className)}>
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full touch-none select-none"
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        role="img"
        aria-label="Mapa esquemático de demonstração com as rotas calculadas. As mesmas informações estão no cartão e na lista de rotas."
      >
        <rect x="-400" y="-400" width="1200" height="1300" fill="var(--color-map-land)" />
        {/* park */}
        <rect x="8" y="100" width="44" height="72" rx="8" fill="var(--color-map-park)" />
        <rect x="68" y="100" width="44" height="72" rx="8" fill="var(--color-map-park)" />
        {/* context streets */}
        {CONTEXT.map((p, i) => <polyline key={i} points={toStr(p)} fill="none" stroke="var(--color-map-street)" strokeWidth="7" strokeLinecap="round" />)}
        {/* registered pedestrian segments */}
        {segments.map((s) => (
          <polyline key={s.id} points={toStr(segPts(s))} fill="none" stroke="var(--color-map-street-edge)" strokeWidth="12"
            strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {segments.map((s) => (
          <polyline key={s.id + "f"} points={toStr(segPts(s))} fill="none" stroke="var(--color-map-street)" strokeWidth="10"
            strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {/* alternatives */}
        {lines.filter((l) => l.r.route.id !== selectedId).map(({ r, pts }) => (
          <g key={r.route.id} onClick={() => onSelect?.(r.route.id)} className={onSelect ? "cursor-pointer" : undefined}>
            <polyline points={toStr(pts)} fill="none" stroke="transparent" strokeWidth="22" />
            <polyline points={toStr(pts)} fill="none" stroke="var(--color-map-alt-edge)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={toStr(pts)} fill="none" stroke="var(--color-map-alt)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ))}
        {sel && selPts && (
          <g>
            <polyline points={toStr(selPts)} fill="none" stroke="var(--color-brand-strong)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={toStr(selPts)} fill="none" stroke="var(--color-brand)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
        {/* street names */}
        {segments.filter((s) => showAllLabels || selSegIds.has(s.id)).map((s) => {
          const l = legLabel(segPts(s));
          if (l.len < 50) return null;
          return (
            <text key={s.id + "l"} x={l.x} y={l.y} dy={fs(-9)} fontSize={fs(9)} textAnchor="middle" fill="var(--color-muted-foreground)"
              fontWeight="500" stroke="var(--color-map-land)" strokeWidth={fs(3)} paintOrder="stroke"
              transform={l.vertical ? `rotate(-90 ${l.x} ${l.y})` : undefined} pointerEvents="none">
              {s.name}
            </text>
          );
        })}
        {/* POIs */}
        {places.filter((p) => p.id !== origin && p.id !== destination).map((p) => (
          <g key={p.id} pointerEvents="none">
            <circle cx={p.x} cy={p.y} r={fs(5)} fill="var(--color-background)" stroke="var(--color-muted-foreground)" strokeWidth={fs(2)} />
            <text x={p.x} y={p.y} dy={fs(16)} fontSize={fs(10)} textAnchor="middle" fill="var(--color-muted-foreground)" fontWeight="500"
              stroke="var(--color-map-land)" strokeWidth={fs(3)} paintOrder="stroke">{p.short}</text>
          </g>
        ))}
        {/* duration bubbles */}
        {lines.map(({ r, pts }) => {
          const l = legLabel(pts); const isSel = r.route.id === selectedId;
          const w = fs(52), h = fs(20);
          return (
            <g key={r.route.id + "b"} onClick={() => onSelect?.(r.route.id)} className={onSelect ? "cursor-pointer" : undefined}>
              <rect x={l.x - w / 2} y={l.y - h / 2} width={w} height={h} rx={fs(6)}
                fill={isSel ? "var(--color-brand)" : "var(--color-background)"} stroke={isSel ? "var(--color-brand-strong)" : "var(--color-map-alt)"} strokeWidth={fs(1.2)} />
              <text x={l.x} y={l.y} dy={fs(3.5)} fontSize={fs(10)} fontWeight="700" textAnchor="middle" fill="var(--color-ink)">
                {r.route.label.replace("Rota ", "")} · {r.minutes} min
              </text>
            </g>
          );
        })}
        {/* origin / destination */}
        {o && (
          <g pointerEvents="none">
            <circle cx={o.x} cy={o.y} r={fs(9)} fill="var(--color-background)" stroke="var(--color-ink)" strokeWidth={fs(3.5)} />
            <text x={o.x} y={o.y} dy={fs(24)} fontSize={fs(11)} fontWeight="700" textAnchor="middle" fill="var(--color-ink)"
              stroke="var(--color-background)" strokeWidth={fs(3)} paintOrder="stroke">{getPlace(origin!)?.short}</text>
          </g>
        )}
        {d && (
          <g pointerEvents="none" transform={`translate(${d.x} ${d.y}) scale(${Math.max(scale, 0.45)})`}>
            <path d="M0 0 C-4 -9 -13 -14 -13 -24 A13 13 0 1 1 13 -24 C13 -14 4 -9 0 0Z" fill="var(--color-ink)" stroke="var(--color-background)" strokeWidth="2" />
            <circle cx="0" cy="-24" r="5" fill="var(--color-background)" />
            <text x="0" y="-42" fontSize="11" fontWeight="700" textAnchor="middle" fill="var(--color-ink)"
              stroke="var(--color-background)" strokeWidth="3" paintOrder="stroke">{getPlace(destination!)?.short}</text>
          </g>
        )}
        {prog && <circle cx={prog.x} cy={prog.y} r={fs(9)} fill="var(--color-brand)" stroke="var(--color-background)" strokeWidth={fs(3)} />}
      </svg>
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-background px-3 py-1 text-xs font-semibold text-ink shadow-card">
        Mapa esquemático · demonstração
      </span>
      {controls && (
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <div className="flex flex-col overflow-hidden rounded-2xl bg-background shadow-card">
            <button onClick={() => zoom(0.7)} aria-label="Aproximar" className="tap flex h-12 w-12 items-center justify-center hover:bg-muted"><Plus className="h-6 w-6" /></button>
            <span className="mx-2 h-px bg-border" />
            <button onClick={() => zoom(1 / 0.7)} aria-label="Afastar" className="tap flex h-12 w-12 items-center justify-center hover:bg-muted"><Minus className="h-6 w-6" /></button>
          </div>
          <button onClick={fit} aria-label="Enquadrar percurso completo" className="tap flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-brand-strong shadow-card hover:bg-muted">
            <Scan className="h-6 w-6" />
          </button>
        </div>
      )}
    </div>
  );
}

class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() {
    if (this.state.failed)
      return (
        <div role="alert" className="flex h-full items-center justify-center p-6 text-center text-base">
          Não foi possível carregar o mapa. Use a lista de rotas — ela contém todas as informações.
        </div>
      );
    return this.props.children;
  }
}

export function SchematicMap(p: Props) {
  return <MapBoundary><MapInner {...p} /></MapBoundary>;
}
