import { Component, type ReactNode } from "react";
import { getNode, junctions, places, segments } from "@/lib/trames/data";
import type { RouteResult } from "@/lib/trames/types";

const pts = (ids: string[]) =>
  ids.map((id) => { const n = getNode(id)!; return `${n.x},${n.y}`; }).join(" ");

const DASHES = ["8 6", "2 6", "14 6 2 6"];

interface Props {
  results?: RouteResult[];
  selectedId?: string | null;
  origin?: string;
  destination?: string;
  onSelect?: (id: string) => void;
  progressNode?: string;
  className?: string;
}

function MapInner({ results = [], selectedId, origin, destination, onSelect, progressNode, className }: Props) {
  const others = results.filter((r) => r.route.id !== selectedId);
  const sel = results.find((r) => r.route.id === selectedId);
  const path = (r: RouteResult) => {
    const p = r.route.path;
    return r.route.from === origin ? p : [...p].reverse();
  };
  const prog = progressNode ? getNode(progressNode) : null;
  return (
    <svg
      viewBox="0 0 360 450"
      className={className}
      role="img"
      aria-label="Mapa esquemático de demonstração. As mesmas informações estão disponíveis em lista."
    >
      <rect width="360" height="450" fill="var(--color-muted)" />
      {/* blocks */}
      {[[90,190,70,50],[200,290,70,30],[100,280,50,40],[210,110,60,40],[320,270,30,80],[110,60,60,70]].map(([x,y,w,h],i)=>(
        <rect key={i} x={x} y={y} width={w} height={h} rx="6" fill="var(--color-background)" />
      ))}
      <circle cx="70" cy="150" r="38" fill="var(--color-success)" opacity="0.18" />
      {segments.map((s) => (
        <line key={s.id} x1={getNode(s.a)!.x} y1={getNode(s.a)!.y} x2={getNode(s.b)!.x} y2={getNode(s.b)!.y}
          stroke="var(--color-border)" strokeWidth="10" strokeLinecap="round" />
      ))}
      {others.map((r, i) => (
        <g key={r.route.id} onClick={() => onSelect?.(r.route.id)} className={onSelect ? "cursor-pointer" : undefined}>
          <polyline points={pts(path(r))} fill="none" stroke="transparent" strokeWidth="24" />
          <polyline points={pts(path(r))} fill="none" stroke="var(--color-ink)" strokeOpacity="0.55"
            strokeWidth="4" strokeDasharray={DASHES[i % 3]} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      {sel && (
        <polyline points={pts(path(sel))} fill="none" stroke="var(--color-brand)" strokeWidth="7"
          strokeLinecap="round" strokeLinejoin="round" />
      )}
      {junctions.map((j) => <circle key={j.id} cx={j.x} cy={j.y} r="3" fill="var(--color-ink)" opacity="0.3" />)}
      {places.map((p) => {
        const isO = p.id === origin, isD = p.id === destination;
        return (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={isO || isD ? 11 : 7}
              fill={isD ? "var(--color-success-strong)" : isO ? "var(--color-brand-strong)" : "var(--color-background)"}
              stroke="var(--color-ink)" strokeWidth="2" />
            {(isO || isD) && <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-background)">{isO ? "O" : "D"}</text>}
            <text x={p.x} y={p.y - 15} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--color-ink)"
              stroke="var(--color-background)" strokeWidth="3" paintOrder="stroke">{p.short}</text>
          </g>
        );
      })}
      {prog && <circle cx={prog.x} cy={prog.y} r="9" fill="var(--color-brand)" stroke="var(--color-background)" strokeWidth="3" />}
    </svg>
  );
}

class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed)
      return (
        <div role="alert" className="flex h-full items-center justify-center p-6 text-center text-base">
          Não foi possível carregar o mapa. Use a lista de rotas abaixo — ela contém todas as informações.
        </div>
      );
    return this.props.children;
  }
}

export function SchematicMap(p: Props) {
  return <MapBoundary><MapInner {...p} /></MapBoundary>;
}
