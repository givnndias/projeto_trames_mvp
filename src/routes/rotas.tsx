import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, ChevronUp, ChevronDown, Info, Loader2, Ban, HelpCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SchematicMap } from "@/components/trames/SchematicMap";
import { AppShell, Button, IarBadge, SimBadge, TopBar, btn, priorityIcon } from "@/components/trames/ui";
import { getPlace } from "@/lib/trames/data";
import { getProfile } from "@/lib/trames/profiles";
import { recommend } from "@/lib/trames/recommend";
import { useTrames } from "@/lib/trames/store";
import type { RouteResult } from "@/lib/trames/types";
import { cn } from "@/lib/utils";
import { CompatTag } from "@/components/trames/CompatTag";

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

  useEffect(() => {
    if (hydrated && (!search.origin || !search.destination)) navigate({ to: "/" });
  }, [hydrated, search.origin, search.destination, navigate]);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, []);

  const rec = useMemo(
    () => recommend(search.origin, search.destination, search.priority, search.restrictions),
    [search.origin, search.destination, search.priority, search.restrictions],
  );
  const selectedId =
    (search.selectedRouteId && rec.results.some((r) => r.route.id === search.selectedRouteId) && search.selectedRouteId) ||
    rec.recommendedId || rec.results[0]?.route.id || null;
  const profile = getProfile(search.priority);
  const PIcon = priorityIcon[profile.id];

  return (
    <AppShell>
      <TopBar title="Rotas" back="/prioridade" />
      <div className="relative bg-muted" style={{ height: expanded ? "22dvh" : "42dvh" }}>
        <SchematicMap className="h-full w-full" results={rec.results} selectedId={selectedId}
          origin={search.origin} destination={search.destination}
          onSelect={(id) => setSearch({ selectedRouteId: id })} />
        <div className="absolute left-3 top-3"><SimBadge>Mapa esquemático · demonstração</SimBadge></div>
      </div>
      <section className="-mt-4 flex flex-1 flex-col rounded-t-3xl bg-background shadow-float" aria-label="Lista de rotas">
        <button onClick={() => setExpanded(!expanded)} className="tap flex w-full items-center justify-center gap-1 pt-2 text-sm text-muted-foreground"
          aria-expanded={expanded}>
          {expanded ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
          {expanded ? "Mostrar mais mapa" : "Expandir lista"}
        </button>
        <div className="flex flex-col gap-3 px-5 pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base"><span className="text-muted-foreground">De </span><b>{getPlace(search.origin)?.short}</b>
              <span className="text-muted-foreground"> para </span><b>{getPlace(search.destination)?.short}</b></p>
          </div>
          <Link to="/prioridade" className="flex items-center gap-2 self-start rounded-full bg-beige px-4 py-2 text-sm font-semibold tap">
            <PIcon className="h-5 w-5" aria-hidden /> Prioridade: {profile.name} · alterar
          </Link>

          {loading ? (
            <div role="status" className="flex items-center gap-3 py-10 text-base"><Loader2 className="h-6 w-6 animate-spin text-brand-strong" /> Buscando rotas…</div>
          ) : rec.status === "sem-rotas" ? (
            <Empty title="Nenhuma rota cadastrada" text="Ainda não há percursos cadastrados entre esses locais na região demonstrativa. Experimente Estação Central ↔ Biblioteca Municipal ou Praça da Matriz ↔ Mercado Municipal." />
          ) : (
            <>
              {rec.status === "sem-compativel" && (
                <Empty title="Nenhuma rota compatível" text={`Nenhuma alternativa cadastrada atende às restrições deste percurso (${rec.appliedRestrictions.length ? "evitar escadas/ladeiras" : "restrições selecionadas"}). Por isso, nenhuma é recomendada. Você pode consultar as rotas abaixo ou mudar a prioridade.`} />
              )}
              {rec.status === "dados-insuficientes" && (
                <Empty title="Dados insuficientes" text="Faltam dados para calcular a adequação das alternativas compatíveis com esta prioridade. Nenhuma é recomendada como adequada." />
              )}
              <ul className="flex flex-col gap-3">
                {rec.results.map((r) => (
                  <li key={r.route.id}>
                    <RouteCard r={r} selected={r.route.id === selectedId} onSelect={() => setSearch({ selectedRouteId: r.route.id })} />
                  </li>
                ))}
              </ul>
              <p className="flex gap-2 text-sm text-muted-foreground"><Info className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                IAR (Índice de Adequação da Rota) mede de 0 a 100 o quanto a rota combina com a prioridade escolhida. Não é um percentual de segurança.</p>
            </>
          )}
          {!loading && rec.status === "sem-rotas" && <Button variant="secondary" onClick={() => navigate({ to: "/" })}>Alterar origem e destino</Button>}
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

function RouteCard({ r, selected, onSelect }: { r: RouteResult; selected: boolean; onSelect: () => void }) {
  return (
    <article className={cn("rounded-2xl border-2 bg-background p-4 shadow-card", selected ? "border-brand" : "border-border")}
      aria-label={`${r.route.label}${selected ? ", selecionada no mapa" : ""}`}>
      <button onClick={onSelect} className="flex w-full items-start gap-3 text-left" aria-pressed={selected}>
        <IarBadge value={r.iar} />
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold">{r.route.label} <span className="font-normal text-muted-foreground">· {r.route.name}</span></p>
          <p className="text-base">{r.distance} m · {r.minutes} min
            <span className="text-muted-foreground"> · {r.deltaFromShortest === 0 ? "mais curta" : `+${r.deltaFromShortest} m que a mais curta`}</span></p>
          {selected && <p className="text-sm font-semibold text-brand-strong">● Em destaque no mapa</p>}
        </div>
      </button>
      <div className="mt-2"><CompatTag r={r} /></div>
      {r.features.length > 0 && (
        <p className="mt-2 flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-success-strong" aria-hidden />
          <span><b>Recursos:</b> {r.features.slice(0, 3).map((f) => f.label).join(", ")}</span></p>
      )}
      <p className="mt-1 flex gap-2 text-sm"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-brand-strong" aria-hidden />
        <span><b>Barreiras:</b> {r.barriers.length ? r.barriers.map((b) => b.label).join(", ") : "nenhuma barreira cadastrada"}
          {r.segments.some((s) => s.missingData) && " · há trechos sem dados"}</span></p>
      <Link to="/rota/$routeId" params={{ routeId: r.route.id }} onClick={onSelect}
        className={cn(btn({ variant: "secondary" }), "mt-3 w-full")}>Ver detalhes</Link>
    </article>
  );
}
