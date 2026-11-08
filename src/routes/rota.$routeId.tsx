import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Database, FlaskConical } from "lucide-react";
import { useMemo } from "react";
import { SchematicMap } from "@/components/trames/SchematicMap";
import { AppShell, Button, IarBadge, TopBar, btn } from "@/components/trames/ui";
import { DATA_SOURCE, getPlace } from "@/lib/trames/data";
import { dimensionLabels, getProfile } from "@/lib/trames/profiles";
import { recommend } from "@/lib/trames/recommend";
import { useTrames } from "@/lib/trames/store";
import type { Dimension } from "@/lib/trames/types";
import { CompatTag } from "@/components/trames/CompatTag";

export const Route = createFileRoute("/rota/$routeId")({
  head: () => ({
    meta: [
      { title: "Detalhes da rota — Trames" },
      { name: "description", content: "Resumo, IAR, recursos, barreiras e explicação da rota." },
      { property: "og:title", content: "Detalhes da rota — Trames" },
      { property: "og:description", content: "Entenda por que esta alternativa combina com sua prioridade." },
    ],
  }),
  component: Detalhes,
});

function Detalhes() {
  const { routeId } = Route.useParams();
  const { search, setSearch } = useTrames();
  const navigate = useNavigate();
  const rec = useMemo(() => recommend(search.origin, search.destination, search.priority, search.restrictions), [search]);
  const r = rec.results.find((x) => x.route.id === routeId);
  const profile = getProfile(search.priority);

  if (!r) return (
    <AppShell><TopBar title="Rota" back="/rotas" />
      <div className="p-6 text-base">Esta rota não pertence à busca atual. <Link to="/rotas" className="font-semibold text-brand-strong underline">Voltar às rotas</Link></div>
    </AppShell>
  );

  return (
    <AppShell>
      <TopBar title={`${r.route.label} · detalhes`} back="/rotas" />
      <div className="h-48 bg-muted">
        <SchematicMap className="h-full w-full" results={[r]} selectedId={r.route.id} origin={search.origin} destination={search.destination} />
      </div>
      <div className="flex flex-col gap-5 px-5 py-5 pb-36">
        <div>
          <h2 className="text-2xl font-bold">{r.route.name}</h2>
          <p className="text-base text-muted-foreground">{getPlace(search.origin)?.name} → {getPlace(search.destination)?.name}</p>
          <div className="mt-2"><CompatTag r={r} /></div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Distância" value={`${r.distance} m`} />
          <Stat label="Tempo estimado" value={`${r.minutes} min`} />
          <Stat label="Prioridade" value={profile.name} />
        </div>
        <section className="flex items-center gap-4 rounded-2xl bg-muted p-4">
          <IarBadge value={r.iar} size="lg" />
          <p className="text-base">
            <b>Índice de Adequação da Rota.</b> Pontuação de 0 a 100 de quanto esta rota combina com a prioridade “{profile.name}”. Não é um percentual de segurança.
            {r.iar === null && ` Não calculado: faltam dados de ${r.missingDimensions.map((d) => dimensionLabels[d].toLowerCase()).join(", ")}.`}
          </p>
        </section>
        <section>
          <h3 className="mb-1 text-lg font-semibold">Por que esta avaliação</h3>
          <p className="text-base">{r.explanation}</p>
          {r.blockingReasons.length > 0 && <p className="mt-2 text-base font-medium text-destructive">Não recomendada: {r.blockingReasons.join(", ").toLowerCase()} conflita com as restrições deste percurso.</p>}
        </section>
        <section>
          <h3 className="mb-2 text-lg font-semibold">Indicadores</h3>
          <ul className="flex flex-col gap-2">
            {(Object.keys(dimensionLabels) as Dimension[]).map((d) => {
              const v = r.indicators[d]; const w = profile.weights[d] ?? 0;
              return (
                <li key={d}>
                  <div className="flex justify-between text-sm"><span>{dimensionLabels[d]} {w > 0 && <span className="text-muted-foreground">(peso {w}%)</span>}</span><b>{v ?? "sem dados"}</b></div>
                  <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${v ?? 0}%` }} /></div>
                </li>
              );
            })}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 text-lg font-semibold">Recursos disponíveis</h3>
          {r.features.length ? <ul className="flex flex-col gap-1">{r.features.map((f) => <li key={f.id} className="flex gap-2 text-base"><CheckCircle2 className="h-5 w-5 text-success-strong" aria-hidden />{f.label}</li>)}</ul>
            : <p className="text-base text-muted-foreground">Nenhum recurso cadastrado.</p>}
        </section>
        <section>
          <h3 className="mb-2 text-lg font-semibold">Barreiras conhecidas</h3>
          {r.barriers.length ? <ul className="flex flex-col gap-1">{r.barriers.map((b) => <li key={b.id} className="flex gap-2 text-base"><AlertTriangle className="h-5 w-5 text-brand-strong" aria-hidden />{b.label}</li>)}</ul>
            : <p className="text-base">Nenhuma barreira cadastrada.</p>}
          {r.segments.filter((s) => s.missingData).map((s) => <p key={s.id} className="mt-2 text-sm text-muted-foreground">⚠ {s.missingData} Falta de dados não significa ausência de barreiras.</p>)}
        </section>
        <section className="rounded-2xl bg-beige p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold"><FlaskConical className="h-4 w-4" aria-hidden />Informações simuladas</p>
          <p className="mt-1 flex gap-2"><Database className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />Fonte: {DATA_SOURCE.label}. Atualização: {new Date(DATA_SOURCE.updatedAt + "T12:00").toLocaleDateString("pt-BR")}.</p>
        </section>
      </div>
      <div className="pb-safe fixed inset-x-0 bottom-0 mx-auto flex max-w-md flex-col gap-2 border-t bg-background px-5 pt-3 shadow-float">
        <Button block onClick={() => { setSearch({ selectedRouteId: r.route.id }); navigate({ to: "/percurso/$routeId", params: { routeId: r.route.id } }); }}>
          Iniciar percurso
        </Button>
        <Link to="/rotas" className={btn({ variant: "ghost", block: true })}>Escolher outra rota</Link>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold break-words">{value}</p>
    </div>
  );
}
