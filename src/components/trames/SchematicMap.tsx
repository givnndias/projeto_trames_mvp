import { Component, type ReactNode } from "react";
import type { RouteCandidate } from "@/lib/trames/ranking";

// Schematic only: the base has no coordinates, so nodes are placed on a circle.
export function nodePos(id: number, all: number[]) {
  const i = all.indexOf(id); const n = Math.max(all.length, 1);
  const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
  return { x: 180 + 130 * Math.cos(a), y: 190 + 140 * Math.sin(a) };
}

interface Props {
  nodes: number[];
  candidates?: RouteCandidate[];
  selectedKey?: string | null | undefined;
  origin?: number | null | undefined;
  destination?: number | null | undefined;
  onSelect?: (key: string) => void;
  progressNode?: number | undefined;
  className?: string;
}

const DASHES = ["8 6", "2 6", "14 6 2 6"];

function curve(a: { x: number; y: number }, b: { x: number; y: number }, bend: number) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const dx = b.y - a.y, dy = a.x - b.x; const len = Math.hypot(dx, dy) || 1;
  return `M${a.x},${a.y} Q${mx + (dx / len) * bend},${my + (dy / len) * bend} ${b.x},${b.y}`;
}

function MapInner({ nodes, candidates = [], selectedKey, origin, destination, onSelect, progressNode, className }: Props) {
  const pathD = (c: RouteCandidate, bend: number) =>
    c.nodes.slice(1).map((v, i) => curve(nodePos(c.nodes[i]!, nodes), nodePos(v, nodes), bend)).join(" ");
  const others = candidates.filter((c) => c.key !== selectedKey);
  const sel = candidates.find((c) => c.key === selectedKey);
  return (
    <svg viewBox="0 0 360 380" className={className} role="img"
      aria-label="Mapa esquemático: locais sem posição geográfica real. As mesmas informações estão na lista.">
      <rect width="360" height="380" fill="var(--color-muted)" />
      {nodes.flatMap((a) => nodes.filter((b) => b > a).map((b) => {
        const p = nodePos(a, nodes), q = nodePos(b, nodes);
        return <line key={`${a}-${b}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="var(--color-border)" strokeWidth="6" strokeLinecap="round" />;
      }))}
      {others.map((c, i) => (
        <g key={c.key} onClick={() => onSelect?.(c.key)} className={onSelect ? "cursor-pointer" : undefined}>
          <path d={pathD(c, 14 + i * 10)} fill="none" stroke="transparent" strokeWidth="22" />
          <path d={pathD(c, 14 + i * 10)} fill="none" stroke="var(--color-ink)" strokeOpacity="0.55" strokeWidth="3.5" strokeDasharray={DASHES[i % 3]} strokeLinecap="round" />
        </g>
      ))}
      {sel && <path d={pathD(sel, 0)} fill="none" stroke="var(--color-brand)" strokeWidth="7" strokeLinecap="round" />}
      {nodes.map((id) => {
        const p = nodePos(id, nodes); const isO = id === origin, isD = id === destination;
        return (
          <g key={id}>
            <circle cx={p.x} cy={p.y} r={isO || isD ? 15 : 11}
              fill={isD ? "var(--color-success-strong)" : isO ? "var(--color-brand-strong)" : "var(--color-background)"}
              stroke="var(--color-ink)" strokeWidth="2" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="12" fontWeight="700"
              fill={isO || isD ? "var(--color-background)" : "var(--color-ink)"}>{id}</text>
            <text x={p.x} y={p.y + (p.y > 190 ? 32 : -22)} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--color-ink)"
              stroke="var(--color-background)" strokeWidth="3" paintOrder="stroke">
              {`Local ${id}`}{isO ? " · origem" : isD ? " · destino" : ""}
            </text>
          </g>
        );
      })}
      {progressNode !== undefined && (() => { const p = nodePos(progressNode, nodes);
        return <circle cx={p.x} cy={p.y} r="21" fill="none" stroke="var(--color-brand)" strokeWidth="4" />; })()}
    </svg>
  );
}

class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() {
    if (this.state.failed)
      return <div role="alert" className="flex h-full items-center justify-center p-6 text-center text-base">
        Não foi possível carregar o mapa. Use a lista abaixo — ela contém todas as informações.</div>;
    return this.props.children;
  }
}

export function SchematicMap(p: Props) {
  return <MapBoundary><MapInner {...p} /></MapBoundary>;
}
