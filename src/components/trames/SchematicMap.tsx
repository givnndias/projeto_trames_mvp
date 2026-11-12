import { Component, type ReactNode } from "react";
import { getNode, junctions, places, segments } from "@/lib/trames/data";
import type { RouteResult } from "@/lib/trames/types";

const FULL = { x: 0, y: 0, w: 360, h: 450 };
const pts = (ids: string[]) =>
  ids.map((id) => { const n = getNode(id)!; return `${n.x},${n.y}`; }).join(" ");

const DASHES = ["9 7", "3 7", "14 6 3 6"];

interface Props {
  results?: RouteResult[];
  selectedId?: string | null | undefined;
  origin?: string | undefined;
  destination?: string | undefined;
  onSelect?: ((id: string) => void) | undefined;
  progressNode?: string | undefined;
  /** Node ids to fit in view; omitted = whole region. */
  fit?: string[] | undefined;
  zoom?: number | undefined;
  className?: string | undefined;
}

function viewBoxFor(fit: string[] | undefined, zoom = 1) {
  let { x, y, w, h } = FULL;
  if (fit && fit.length) {
    const ns = fit.map((id) => getNode(id)!).filter(Boolean);
    const minX = Math.min(...ns.map((n) => n.x)) - 40, maxX = Math.max(...ns.map((n) => n.x)) + 40;
    const minY = Math.min(...ns.map((n) => n.y)) - 40, maxY = Math.max(...ns.map((n) => n.y)) + 40;
    x = minX; y = minY; w = maxX - minX; h = maxY - minY;
  }
  const cx = x + w / 2, cy = y + h / 2;
  const nw = w / zoom, nh = h / zoom;
  return `${cx - nw / 2} ${cy - nh / 2} ${nw} ${nh}`;
}

function MapInner({ results = [], selectedId, origin, destination, onSelect, progressNode, fit, zoom, className }: Props) {
  const others = results.filter((r) => r.route.id !== selectedId);
  const sel = results.find((r) => r.route.id === selectedId);
  const path = (r: RouteResult) => (r.route.from === origin ? r.route.path : [...r.route.path].reverse());
  const prog = progressNode ? getNode(progressNode) : null;
  return (
    <svg viewBox={viewBoxFor(fit, zoom)} preserveAspectRatio="xMidYMid meet" className={className} role="img"
      aria-label="Mapa esquemático de demonstração. As mesmas informações estão disponíveis em lista.">
      <rect x="-400" y="-400" width="1200" height="1300" fill="var(--color-muted)" />
      {[[90,190,70,50],[200,290,70,30],[95,280,55,40],[210,110,60,40],[320,270,40,100],[110,60,60,70],[200,360,70,30],[0,300,40,80]].map(([x,y,w,h],i)=>(
        <rect key={i} x={x} y={y} width={w} height={h} rx="6" fill="var(--color-background)" />
      ))}
      <circle cx="70" cy="150" r="42" fill="var(--color-success)" opacity="0.2" />
      {/* street network (pedestrian paths) */}
      {segments.map((s) => (
        <g key={s.id}>
          <line x1={getNode(s.a)!.x} y1={getNode(s.a)!.y} x2={getNode(s.b)!.x} y2={getNode(s.b)!.y}
            stroke="var(--color-border)" strokeWidth="14" strokeLinecap="round" />
          <line x1={getNode(s.a)!.x} y1={getNode(s.a)!.y} x2={getNode(s.b)!.x} y2={getNode(s.b)!.y}
            stroke="var(--color-background)" strokeWidth="9" strokeLinecap="round" />
        </g>
      ))}
      {others.map((r, i) => (
        <g key={r.route.id} onClick={() => onSelect?.(r.route.id)} className={onSelect ? "cursor-pointer" : undefined}
          role={onSelect ? "button" : undefined} aria-label={onSelect ? `Selecionar ${r.route.label}` : undefined}>
          <polyline points={pts(path(r))} fill="none" stroke="transparent" strokeWidth="26" />
          <polyline points={pts(path(r))} fill="none" stroke="var(--color-ink)" strokeOpacity="0.45"
            strokeWidth="4" strokeDasharray={DASHES[i % 3]} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      {sel && (
        <>
          <polyline points={pts(path(sel))} fill="none" stroke="var(--color-brand-strong)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={pts(path(sel))} fill="none" stroke="var(--color-brand)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {junctions.map((j) => <circle key={j.id} cx={j.x} cy={j.y} r="2.5" fill="var(--color-ink)" opacity="0.3" />)}
      {places.map((p) => {
        const isO = p.id === origin, isD = p.id === destination;
        return (
          <g key={p.id}>
            {isD ? (
              <g transform={`translate(${p.x},${p.y})`}>
                <path d="M0 0 C -12 -16 -12 -32 0 -32 C 12 -32 12 -16 0 0 Z" fill="var(--color-success-strong)" stroke="var(--color-background)" strokeWidth="2" />
                <circle cy="-21" r="4.5" fill="var(--color-background)" />
              </g>
            ) : isO ? (
              <circle cx={p.x} cy={p.y} r="9" fill="var(--color-background)" stroke="var(--color-ink)" strokeWidth="4" />
            ) : (
              <circle cx={p.x} cy={p.y} r="6" fill="var(--color-background)" stroke="var(--color-ink)" strokeOpacity="0.6" strokeWidth="2" />
            )}
            <text x={p.x} y={isD ? p.y - 38 : p.y - 14} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--color-ink)"
              stroke="var(--color-background)" strokeWidth="3" paintOrder="stroke">{p.short}{isO ? " (origem)" : isD ? " (destino)" : ""}</text>
          </g>
        );
      })}
      {prog && (
        <g>
          <circle cx={prog.x} cy={prog.y} r="16" fill="var(--color-brand)" opacity="0.25" />
          <circle cx={prog.x} cy={prog.y} r="8" fill="var(--color-brand-strong)" stroke="var(--color-background)" strokeWidth="3" />
        </g>
      )}
    </svg>
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

export function MapControls({ onZoomIn, onZoomOut, onCenter, className }: {
  onZoomIn: () => void; onZoomOut: () => void; onCenter: () => void; className?: string;
}) {
  const b = "tap flex h-12 w-12 items-center justify-center rounded-full bg-background text-ink shadow-card ring-1 ring-border hover:bg-beige";
  return (
    <div className={className}>
      <div className="flex flex-col gap-2">
        <button className={b} onClick={onZoomIn} aria-label="Aproximar mapa"><span className="text-2xl font-semibold leading-none">+</span></button>
        <button className={b} onClick={onZoomOut} aria-label="Afastar mapa"><span className="text-2xl font-semibold leading-none">−</span></button>
        <button className={b} onClick={onCenter} aria-label="Centralizar no percurso">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
        </button>
      </div>
    </div>
  );
}
