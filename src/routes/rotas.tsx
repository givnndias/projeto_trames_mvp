import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpDown, ChevronDown, ChevronUp, Crosshair, Info, Loader2, Minus, Plus, HelpCircle, Ruler } from "lucide-react";
import { useEffect, useState } from "react";
import { SchematicMap } from "@/components/trames/SchematicMap";
import { CompatTag } from "@/components/trames/CompatTag";
import { AppShell, IarBadge, SimBadge, btn, priorityIcon } from "@/components/trames/ui";
import { nodeName } from "@/lib/trames/graph";
import { estMinutes, fmt, shortestOf } from "@/lib/trames/present";
import type { RouteCandidate } from "@/lib/trames/ranking";
import { useTrames } from "@/lib/trames/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rotas")({
  head: () => ({
    meta: [
      { title: "Comparação de rotas — Trames" },
      { name: "description", content: "Compare percursos calculados por programação dinâmica e veja o mais adequado à sua prioridade." },
      { property: "og:title", content: "Comparação de rotas — Trames" },
      { property: "og:description", content: "Distância, custo acumulado, IAR e alertas de cada alternativa." },
    ],
  }),
  component: Rotas,
});

const STATUS_MSG: Record<string, [string, string]> = {
  "origem-invalida": ["Local inválido", "Escolha origem e destino entre os locais da base."],
  "mesmo-local": ["Origem igual ao destino", "Escolha um destino diferente da origem."],
  inalcancavel: ["Destino inalcançável", "Não há sequência de trechos, no sentido cadastrado, que leve da origem ao destino."],
  bloqueado: ["Sem percurso após bloqueios", "Os trechos bloqueados impedem chegar ao destino. Desbloqueie algum trecho para recalcular."],
  "base-invalida": ["Base inválida", "Não foi possível usar a base de trechos. Carregue uma versão válida na área técnica."],
};

function Rotas() {
  const { search, setSearch, hydrated, result } = useTrames();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (hydrated && (!search.origin || !search.destination)) navigate({ to: "/" });
  }, [hydrated, search.origin, search.destination, navigate]);
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); },
    [search.origin, search.destination, search.priority, search.blocked]);

  const cs = result.candidates;
  const selectedKey = (search.selectedKey && cs.some((c) => c.key === search.selectedKey) && search.selectedKey) || cs[0]?.key || null;
  const shortest = shortestOf(cs);
  const best = cs[0];
  const PIcon = priorityIcon[result.profile.id];
  const o = Number(search.origin), d = Number(search.destination);
  const nodes = result.graph?.nodes ?? [];

  return (
    <AppShell>
      {/* Top search card */}
      <div className="pt-safe sticky top-0 z-20 bg-background px-3 pb-2 shadow-card">
        <div className="flex items-center gap-2">
          <Link to="/" aria-label="Voltar ao início" className="tap flex items-center justify-center rounded-full hover:bg-muted"><ChevronDown className="h-6 w-6 rotate-90" /></Link>
          <div className="flex-1 space-y-1">
            {(["origin", "destination"] as const).map((k) => (
              <label key={k} className="flex items-center gap-2 rounded-xl bg-muted px-3">
                <span className={cn("h-3 w-3 shrink-0 rounded-full", k === "origin" ? "bg-brand-strong" : "bg-success-strong")} aria-hidden />
                <span className="sr-only">{k === "origin" ? "Origem" : "Destino"}</span>
                <select value={search[k]} onChange={(e) => setSearch({ [k]: e.target.value, selectedKey: null })}
                  className="tap w-full bg-transparent text-base font-medium outline-none">
                  {nodes.map((n) => <option key={n} value={String(n)}>{nodeName(n)}</option>)}
                </select>
              </label>
            ))}
          </div>
          <button onClick={() => setSearch({ origin: search.destination, destination: search.origin, selectedKey: null })}
            className="tap flex items-center justify-center rounded-full border-2 border-brand text-brand-strong" aria-label="Inverter origem e destino">
            <ArrowUpDown className="h-5 w-5" />
          </button>
        </div>
        <Link to="/prioridade" className="tap mt-2 inline-flex items-center gap-2 rounded-full bg-beige px-4 text-sm font-semibold">
          <PIcon className="h-5 w-5" aria-hidden /> {result.profile.name} · alterar
        </Link>
      </div>

      {/* Map */}
      <div className="relative overflow-hidden bg-muted" style={{ height: expanded ? "24dvh" : "42dvh" }}>
        <div className="h-full w-full transition-transform" style={{ transform: `scale(${zoom})` }}>
          <SchematicMap className="h-full w-full" nodes={nodes} candidates={cs} selectedKey={selectedKey}
            origin={o} destination={d} onSelect={(k) => setSearch({ selectedKey: k })} />
        </div>
        <div className="absolute left-3 top-3"><SimBadge>Mapa esquemático · sem coordenadas</SimBadge></div>
        <div className="absolute bottom-6 right-3 flex flex-col gap-2">
          <button onClick={() => setZoom((z) => Math.min(1.8, z + 0.2))} aria-label="Aproximar mapa" className="tap flex items-center justify-center rounded-full bg-background shadow-card"><Plus className="h-5 w-5" /></button>
          <button onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))} aria-label="Afastar mapa" className="tap flex items-center justify-center rounded-full bg-background shadow-card"><Minus className="h-5 w-5" /></button>
          <button onClick={() => setZoom(1)} aria-label="Centralizar mapa" className="tap flex items-center justify-center rounded-full bg-background shadow-card"><Crosshair className="h-5 w-5 text-brand-strong" /></button>
        </div>
      </div>

      {/* Bottom panel */}
      <section className="-mt-4 relative z-10 flex flex-1 flex-col rounded-t-3xl bg-background shadow-float" aria-label="Lista de rotas">
        <button onClick={() => setExpanded(!expanded)} className="tap flex w-full items-center justify-center gap-1 pt-2 text-sm text-muted-foreground" aria-expanded={expanded}>
          {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}{expanded ? "Mostrar mais mapa" : "Expandir lista"}
        </button>
        <div className="flex flex-col gap-3 px-5 pb-8">
          {loading ? (
            <div role="status" className="flex items-center gap-3 py-10 text-base"><Loader2 className="h-6 w-6 animate-spin text-brand-strong" /> Calculando rotas…</div>
          ) : result.status !== "ok" ? (
            <Empty title={STATUS_MSG[result.status]![0]} text={STATUS_MSG[result.status]![1]} />
          ) : (
            <>
              {result.profile.limitation && <p className="flex gap-2 rounded-2xl bg-beige p-3 text-sm"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{result.profile.limitation}</p>}
              {best && shortest && best.key !== shortest.key && (
                <div className="rounded-2xl border-2 border-brand-light p-3 text-sm">
                  <p className="flex items-center gap-2 font-semibold"><Ruler className="h-4 w-4" aria-hidden />Recomendada × mais curta</p>
                  <p className="mt-1">{best.label}: {fmt(best.distance)} m · IAR {fmt(best.iar, 1)} — {shortest.label}: {fmt(shortest.distance)} m · IAR {fmt(shortest.iar, 1)}</p>
                </div>
              )}
              <ul className="flex flex-col gap-3">
                {cs.map((c) => <li key={c.key}><RouteCard c={c} selected={c.key === selectedKey} onSelect={() => setSearch({ selectedKey: c.key })} /></li>)}
              </ul>
              {cs.length < result.requested && <p className="text-sm text-muted-foreground">Foram encontradas {cs.length} alternativa(s) distintas de {result.requested} buscadas.</p>}
              <p className="flex gap-2 text-sm text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Ordenadas pelo custo acumulado usado na busca. IAR médio (0–100) é a média dos trechos ponderada pela distância; não é percentual de segurança. Menor custo nem sempre é o maior IAR.</p>
              {search.blocked.length > 0 && (
                <button onClick={() => setSearch({ blocked: [] })} className={btn({ variant: "ghost" })}>Desbloquear {search.blocked.length} trecho(s)</button>
              )}
            </>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div role="status" className="rounded-2xl border-2 border-dashed border-brand-light bg-beige p-4">
      <p className="flex items-center gap-2 text-base font-semibold"><HelpCircle className="h-5 w-5" aria-hidden />{title}</p>
      <p className="mt-1 text-base">{text}</p>
    </div>
  );
}

function RouteCard({ c, selected, onSelect }: { c: RouteCandidate; selected: boolean; onSelect: () => void }) {
  return (
    <article className={cn("rounded-2xl border-2 bg-background p-4 shadow-card", selected ? "border-brand" : "border-border")}>
      <button onClick={onSelect} className="flex w-full items-start gap-3 text-left" aria-pressed={selected}>
        <IarBadge value={c.iar} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">{c.label}</p>
          <p className="text-sm text-muted-foreground">{c.nodes.map(nodeName).join(" → ")}</p>
          <p className="text-base">{fmt(c.distance)} m · ~{estMinutes(c.distance)} min
            <span className="text-muted-foreground"> · {c.deltaFromShortest === 0 ? "mais curta" : `+${fmt(c.deltaFromShortest)} m`}</span></p>
          <p className="text-sm">Custo acumulado: <b>{fmt(c.cost, 1)}</b> · {c.faixa}</p>
          {selected && <p className="text-sm font-semibold text-brand-strong">● Em destaque no mapa</p>}
        </div>
      </button>
      <div className="mt-2"><CompatTag r={c} /></div>
      {c.confidenceAlerts.length > 0 && (
        <p className="mt-2 flex gap-2 text-sm"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-brand-strong" aria-hidden />{c.confidenceAlerts.join(" ")}</p>
      )}
      <Link to="/rota/$routeKey" params={{ routeKey: c.key }} onClick={onSelect} className={cn(btn({ variant: "secondary" }), "mt-3 w-full")}>Ver detalhes</Link>
    </article>
  );
}
