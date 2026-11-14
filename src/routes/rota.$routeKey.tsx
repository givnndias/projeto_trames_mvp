import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Ban, Database, Info } from "lucide-react";
import { SchematicMap } from "@/components/trames/SchematicMap";
import { CompatTag } from "@/components/trames/CompatTag";
import { AppShell, Button, IarBadge, TopBar, btn } from "@/components/trames/ui";
import { BASE_LABEL } from "@/lib/trames/base";
import { nodeName } from "@/lib/trames/graph";
import { estMinutes, fmt } from "@/lib/trames/present";
import { useTrames } from "@/lib/trames/store";

export const Route = createFileRoute("/rota/$routeKey")({
  head: () => ({
    meta: [
      { title: "Detalhes da rota — Trames" },
      { name: "description", content: "Trechos, custo acumulado, IAR, scores e alertas da rota." },
      { property: "og:title", content: "Detalhes da rota — Trames" },
      { property: "og:description", content: "Entenda por que esta alternativa foi recomendada." },
    ],
  }),
  component: Detalhes,
});

function Detalhes() {
  const { routeKey } = Route.useParams();
  const { search, setSearch, result } = useTrames();
  const navigate = useNavigate();
  const c = result.candidates.find((x) => x.key === routeKey);

  if (!c) return (
    <AppShell><TopBar title="Rota" back="/rotas" />
      <div className="p-6 text-base">Esta rota não faz parte do resultado atual (a busca foi recalculada). <Link to="/rotas" className="font-semibold text-brand-strong underline">Ver rotas atuais</Link></div>
    </AppShell>
  );

  return (
    <AppShell>
      <TopBar title={`${c.label} · detalhes`} back="/rotas" />
      <div className="h-48 bg-muted">
        <SchematicMap className="h-full w-full" nodes={result.graph?.nodes ?? []} candidates={[c]} selectedKey={c.key} origin={Number(search.origin)} destination={Number(search.destination)} />
      </div>
      <div className="flex flex-col gap-5 px-5 py-5 pb-40">
        <div>
          <h2 className="text-2xl font-bold">{c.nodes.map(nodeName).join(" → ")}</h2>
          <div className="mt-2"><CompatTag r={c} /></div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Distância" value={`${fmt(c.distance)} m`} />
          <Stat label="Tempo estimado" value={`~${estMinutes(c.distance)} min`} />
          <Stat label="Custo acumulado" value={fmt(c.cost, 1)} />
        </div>
        <section className="flex items-center gap-4 rounded-2xl bg-muted p-4">
          <IarBadge value={c.iar} size="lg" />
          <p className="text-base"><b>IAR médio: {c.faixa}.</b> Média dos IARs dos trechos ponderada pela distância (regra do protótipo). Mede adequação, não é percentual de segurança.</p>
        </section>
        <section>
          <h3 className="mb-1 text-lg font-semibold">Por que esta avaliação</h3>
          <p className="text-base">{c.explanation}</p>
          <p className="mt-1 text-sm text-muted-foreground">Prioridade: {result.profile.name} · peso: {result.profile.costLabel}.</p>
          {result.profile.limitation && <p className="mt-2 flex gap-2 text-sm"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{result.profile.limitation}</p>}
        </section>
        <section>
          <h3 className="mb-2 text-lg font-semibold">Scores médios</h3>
          {([["Recursos (score_recursos)", c.scores.recursos], ["Segurança (score_seguranca)", c.scores.seguranca], ["Avaliação de usuários", c.scores.avaliacao]] as const).map(([l, v]) => (
            <div key={l} className="mb-2">
              <div className="flex justify-between text-sm"><span>{l}</span><b>{fmt(v, 1)}</b></div>
              <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${v}%` }} /></div>
            </div>
          ))}
        </section>
        <section>
          <h3 className="mb-2 text-lg font-semibold">Trechos utilizados</h3>
          <ol className="flex flex-col gap-2">
            {c.path.edges.map((e) => {
              const blocked = search.blocked.includes(e.id);
              return (
                <li key={e.id} className="rounded-2xl bg-muted p-3 text-sm">
                  <p className="text-base font-semibold">Trecho {e.id}: {nodeName(e.from)} → {nodeName(e.to)}</p>
                  <p>{fmt(e.raw.distancia_m)} m · IAR {fmt(e.raw.IAR, 1)} ({e.raw.faixa_IAR}) · confiança {e.raw.confianca_dados.toLowerCase()}</p>
                  <p>Ocorrências ativas: {e.raw.qtd_ocorrencias_ativas} · avaliações: {e.raw.qtd_avaliacoes}</p>
                  {(e.raw.penalidade_obstaculos > 0 || e.raw.penalidade_ocorrencias > 0) && (
                    <p className="mt-1 flex gap-1"><AlertTriangle className="h-4 w-4 shrink-0 text-brand-strong" aria-hidden />Penalidades registradas (obstáculos {fmt(e.raw.penalidade_obstaculos, 1)}, ocorrências {fmt(e.raw.penalidade_ocorrencias, 1)}). A base não informa qual barreira física é.</p>
                  )}
                  <button onClick={() => { setSearch({ blocked: blocked ? search.blocked.filter((x) => x !== e.id) : [...search.blocked, e.id], selectedKey: null }); if (!blocked) navigate({ to: "/rotas" }); }}
                    className={btn({ variant: "ghost" }) + " mt-1 px-2"}>
                    <Ban className="h-4 w-4" />{blocked ? "Desbloquear trecho" : "Bloquear este trecho e recalcular"}
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-sm text-muted-foreground">Rampas, escadas, calçadas, iluminação e pontos de descanso não constam na base atual. Não afirmamos que o percurso é plenamente acessível ou seguro.</p>
        </section>
        <section className="rounded-2xl bg-beige p-4 text-sm">
          <p className="flex gap-2"><Database className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />Fonte: {BASE_LABEL}. Locais sem nome ou coordenadas reais; mapa esquemático.</p>
        </section>
      </div>
      <div className="pb-safe fixed inset-x-0 bottom-0 mx-auto flex max-w-md flex-col gap-2 border-t bg-background px-5 pt-3 shadow-float">
        <Button block onClick={() => { setSearch({ selectedKey: c.key }); navigate({ to: "/percurso/$routeKey", params: { routeKey: c.key } }); }}>Iniciar percurso</Button>
        <Link to="/rotas" className={btn({ variant: "ghost", block: true })}>Escolher outra rota</Link>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-muted p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="break-words text-base font-semibold">{value}</p></div>;
}
