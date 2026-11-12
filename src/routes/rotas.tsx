import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpDown, ChevronDown, ChevronUp, Flag, HelpCircle, Info, Loader2, Ban, Navigation } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MapControls, SchematicMap } from "@/components/trames/SchematicMap";
import { CompatTag } from "@/components/trames/CompatTag";
import { Traits } from "@/components/trames/Traits";
import { Button, IarBadge, btn, priorityIcon } from "@/components/trames/ui";
import { places } from "@/lib/trames/data";
import { getProfile } from "@/lib/trames/profiles";
import { recommend } from "@/lib/trames/recommend";
import { useTrames } from "@/lib/trames/store";
import type { RouteResult } from "@/lib/trames/types";
import { routeTraits } from "@/lib/trames/traits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rotas")({
  head: () => ({
    meta: [
      { title: "Comparação de rotas — Trames" },
      { name: "description", content: "Compare alternativas de percurso a pé e veja a mais adequada à sua prioridade." },
      { property: "og:title", content: "Comparação de rotas — Trames" },
      { property: "og:description", content: "Distância, tempo, IAR, recursos e barreiras de cada alternativa." },
    ],
  }),
  component: Rotas,
});

function Rotas() {
  const { search, setSearch, hydrated } = useTrames();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [fitRoute, setFitRoute] = useState(true);

  useEffect(() => {
    if (hydrated && (!search.origin || !search.destination)) navigate({ to: "/" });
  }, [hydrated, search.origin, search.destination, navigate]);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [search.origin, search.destination, search.priority]);

  const same = search.origin && search.origin === search.destination;
  const rec = useMemo(
    () => recommend(search.origin, search.destination, search.priority, search.restrictions),
    [search.origin, search.destination, search.priority, search.restrictions],
  );
  const selectedId =
    (search.selectedRouteId && rec.results.some((r) => r.route.id === search.selectedRouteId) && search.selectedRouteId) ||
    rec.recommendedId || rec.results[0]?.route.id || null;
  const selected = rec.results.find((r) => r.route.id === selectedId);
  const shortest = rec.results.find((r) => r.deltaFromShortest === 0);
  const recommended = rec.results.find((r) => r.recommended);
  const profile = getProfile(search.priority);
  const PIcon = priorityIcon[profile.id];
  const select = (id: string) => { setSearch({ selectedRouteId: id }); setFitRoute(true); };
  const fit = fitRoute && selected
    ? selected.route.path
    : search.origin && search.destination ? [search.origin, search.destination] : undefined;

  return (
    <div className="relative mx-auto h-dvh w-full max-w-md overflow-hidden bg-muted">
      {/* Map: main element */}
      <div className={cn("absolute inset-x-0 top-[8.5rem] transition-all", expanded ? "bottom-[82dvh]" : "bottom-[46dvh]")}>
        <SchematicMap className="h-full w-full" results={loading ? [] : rec.results} selectedId={selectedId}
          origin={search.origin} destination={search.destination} onSelect={select} fit={fit} zoom={zoom} />
      </div>

      {/* Search card */}
      <header className="pt-safe absolute inset-x-0 top-0 z-20 px-3">
        <div className="flex items-stretch gap-2 rounded-3xl bg-background p-2 shadow-card ring-1 ring-border">
          <button onClick={() => navigate({ to: "/prioridade" })} className="tap flex items-center justify-center rounded-full hover:bg-muted" aria-label="Voltar para a prioridade">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <CompactSelect id="r-origem" label="Origem" value={search.origin}
              marker={<span className="h-3.5 w-3.5 shrink-0 rounded-full border-[3px] border-ink" aria-hidden />}
              onChange={(v) => setSearch({ origin: v, selectedRouteId: null })} />
            <CompactSelect id="r-destino" label="Destino" value={search.destination}
              marker={<Flag className="h-4 w-4 shrink-0 text-success-strong" aria-hidden />}
              onChange={(v) => setSearch({ destination: v, selectedRouteId: null })} />
          </div>
          <button onClick={() => setSearch({ origin: search.destination, destination: search.origin, selectedRouteId: null })}
            className="tap flex items-center justify-center self-center rounded-full hover:bg-beige" aria-label="Inverter origem e destino">
            <ArrowUpDown className="h-6 w-6 text-brand-strong" />
          </button>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          <Link to="/prioridade" className="tap inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-card">
            <PIcon className="h-5 w-5" aria-hidden /> {profile.name} · alterar
          </Link>
          <span className="inline-flex shrink-0 items-center rounded-full bg-background px-3 text-sm font-medium shadow-card">Dados simulados · mapa esquemático</span>
        </div>
      </header>

      {/* Floating controls */}
      <MapControls className={cn("absolute right-3 z-10 transition-all", expanded ? "hidden" : "bottom-[calc(46dvh+0.75rem)]")}
        onZoomIn={() => setZoom((z) => Math.min(z * 1.4, 4))}
        onZoomOut={() => setZoom((z) => Math.max(z / 1.4, 0.6))}
        onCenter={() => { setZoom(1); setFitRoute(true); }} />

      {/* Bottom sheet */}
      <section aria-label="Rotas encontradas"
        className={cn("pb-safe absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-3xl bg-background shadow-float transition-[height] duration-300",
          expanded ? "h-[82dvh]" : "h-[46dvh]")}>
        <button onClick={() => setExpanded(!expanded)} aria-expanded={expanded}
          className="tap flex w-full flex-col items-center pt-2 text-sm text-muted-foreground">
          <span className="h-1.5 w-10 rounded-full bg-input" aria-hidden />
          <span className="mt-1 flex items-center gap-1">{expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            {expanded ? "Recolher para ver o mapa" : "Expandir comparação"}</span>
        </button>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {same ? (
            <Notice title="Origem e destino iguais" text="Escolha um destino diferente da origem no topo da tela." />
          ) : loading ? (
            <div role="status" className="flex items-center gap-3 py-8 text-base"><Loader2 className="h-6 w-6 animate-spin text-brand-strong" /> Buscando rotas…</div>
          ) : rec.status === "sem-rotas" ? (
            <Notice title="Nenhuma rota cadastrada" text="Ainda não há percursos cadastrados entre esses locais. Experimente Estação Central ↔ Biblioteca Municipal ou Praça da Matriz ↔ Mercado Municipal." />
          ) : (
            <div className="flex flex-col gap-4">
              {rec.status === "sem-compativel" && (
                <Notice title="Nenhuma rota compatível" text="Todas as alternativas cadastradas têm uma barreira que conflita com uma necessidade essencial deste percurso. Nenhuma é recomendada. Você pode consultá-las abaixo ou mudar a prioridade." />
              )}
              {rec.status === "dados-insuficientes" && (
                <Notice title="Dados insuficientes" text="Faltam dados para calcular a adequação das alternativas compatíveis. Nenhuma é apresentada como adequada." />
              )}
              {selected && <SelectedSummary r={selected} />}
              {recommended && shortest && recommended.route.id !== shortest.route.id && (
                <Compare rec={recommended} short={shortest} />
              )}
              <div>
                <h2 className="mb-2 text-base font-semibold">Todas as alternativas ({rec.results.length})</h2>
                <ul className="flex flex-col gap-2">
                  {rec.results.map((r) => (
                    <li key={r.route.id}><AltRow r={r} selected={r.route.id === selectedId} onSelect={() => select(r.route.id)} /></li>
                  ))}
                </ul>
              </div>
              <p className="flex gap-2 text-sm text-muted-foreground"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                IAR (Índice de Adequação da Rota) mede de 0 a 100 o quanto a rota combina com a prioridade escolhida. Não é percentual de segurança.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function CompactSelect({ id, label, value, onChange, marker }: {
  id: string; label: string; value: string; onChange: (v: string) => void; marker: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-muted px-3">
      {marker}
      <label htmlFor={id} className="sr-only">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="tap w-full min-w-0 truncate bg-transparent text-base font-medium outline-none">
        <option value="">{label}: selecione</option>
        {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </div>
  );
}

function Notice({ title, text }: { title: string; text: string }) {
  return (
    <div role="status" className="rounded-2xl border-2 border-dashed border-brand-light bg-beige p-4">
      <p className="flex items-center gap-2 text-base font-semibold"><HelpCircle className="h-5 w-5" aria-hidden />{title}</p>
      <p className="mt-1 text-base">{text}</p>
    </div>
  );
}

function SelectedSummary({ r }: { r: RouteResult }) {
  return (
    <article className="rounded-2xl border-2 border-brand p-4" aria-live="polite" aria-label={`${r.route.label} selecionada`}>
      <div className="flex items-start gap-3">
        <IarBadge value={r.iar} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-strong">Selecionada no mapa</p>
          <h2 className="text-lg font-semibold leading-tight">{r.route.label} · {r.route.name}</h2>
          <p className="text-base"><b>{r.minutes} min</b> · {r.distance} m
            <span className="text-muted-foreground"> · {r.deltaFromShortest === 0 ? "a mais curta" : `+${r.deltaFromShortest} m`}</span></p>
        </div>
      </div>
      <div className="mt-2"><CompatTag r={r} /></div>
      {r.compatibility === "incompativel" && (
        <p className="mt-2 flex items-start gap-2 rounded-xl bg-muted p-2 text-sm font-medium text-destructive">
          <Ban className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Barreira impeditiva: {r.blockingReasons.join(", ").toLowerCase()}.
        </p>
      )}
      <div className="mt-3"><Traits r={r} /></div>
      <p className="mt-3 text-base">{r.explanation}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link to="/rota/$routeId" params={{ routeId: r.route.id }} className={btn({ variant: "secondary" })}>Ver detalhes</Link>
        <Link to="/percurso/$routeId" params={{ routeId: r.route.id }} className={btn({ variant: "primary" })}>
          <Navigation className="h-5 w-5" aria-hidden />Iniciar
        </Link>
      </div>
    </article>
  );
}

function Compare({ rec, short }: { rec: RouteResult; short: RouteResult }) {
  const tr = (r: RouteResult, k: string) => routeTraits(r).find((t) => t.key === k)?.label ?? "—";
  const rows: [string, string, string][] = [
    ["Distância", `${rec.distance} m`, `${short.distance} m`],
    ["Tempo", `${rec.minutes} min`, `${short.minutes} min`],
    ["IAR", rec.iar === null ? "—" : String(rec.iar), short.iar === null ? "—" : String(short.iar)],
    ["Escadas", tr(rec, "escadas"), tr(short, "escadas")],
    ["Rampas", tr(rec, "rampas"), tr(short, "rampas")],
    ["Calçada", tr(rec, "calcada"), tr(short, "calcada")],
    ["Iluminação", tr(rec, "luz"), tr(short, "luz")],
    ["Descanso", tr(rec, "descanso"), tr(short, "descanso")],
  ];
  return (
    <section className="rounded-2xl bg-muted p-3">
      <h2 className="mb-2 text-base font-semibold">Mais adequada × mais curta</h2>
      <table className="w-full text-left text-sm">
        <thead><tr><th className="py-1 font-medium text-muted-foreground" scope="col"><span className="sr-only">Critério</span></th>
          <th scope="col" className="py-1 font-semibold text-success-strong">{rec.route.label}</th>
          <th scope="col" className="py-1 font-semibold">{short.route.label}</th></tr></thead>
        <tbody>
          {rows.map(([k, a, b]) => (
            <tr key={k} className="border-t border-border"><th scope="row" className="py-1.5 pr-2 font-medium">{k}</th><td className="py-1.5 pr-2">{a}</td><td className="py-1.5">{b}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function AltRow({ r, selected, onSelect }: { r: RouteResult; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} aria-pressed={selected}
      className={cn("tap w-full rounded-2xl border-2 p-3 text-left", selected ? "border-brand bg-beige" : "border-border bg-background")}>
      <div className="flex items-center gap-3">
        <IarBadge value={r.iar} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{r.route.label} <span className="font-normal text-muted-foreground">· {r.route.name}</span></p>
          <p className="text-sm">{r.minutes} min · {r.distance} m{r.deltaFromShortest === 0 ? " · mais curta" : ` · +${r.deltaFromShortest} m`}</p>
        </div>
      </div>
      <div className="mt-2"><CompatTag r={r} /></div>
      <div className="mt-2"><Traits r={r} compact /></div>
    </button>
  );
}
