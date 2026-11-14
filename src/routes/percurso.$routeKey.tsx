import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronLeft, ChevronRight, FlaskConical, Volume2, VolumeX, Flag, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SchematicMap } from "@/components/trames/SchematicMap";
import { AppShell, Button, TopBar, btn } from "@/components/trames/ui";
import { nodeName } from "@/lib/trames/graph";
import { estMinutes, fmt } from "@/lib/trames/present";
import { useTrames } from "@/lib/trames/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/percurso/$routeKey")({
  head: () => ({
    meta: [
      { title: "Percurso simulado — Trames" },
      { name: "description", content: "Acompanhe as etapas do percurso, trecho a trecho." },
      { property: "og:title", content: "Percurso simulado — Trames" },
      { property: "og:description", content: "Orientações passo a passo do seu percurso." },
    ],
  }),
  component: Percurso,
});

function Percurso() {
  const { routeKey } = Route.useParams();
  const { search, setSearch, prefs, setPrefs, result } = useTrames();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [speechOk, setSpeechOk] = useState(false);
  useEffect(() => { setSpeechOk("speechSynthesis" in window); }, []);
  // Freeze the route at start so a recalculation does not swap it mid‑walk.
  const [c] = useState(() => result.candidates.find((x) => x.key === routeKey));

  const steps = useMemo(() => {
    if (!c) return [];
    const list = c.path.edges.map((e) => {
      let text = `Siga pelo trecho ${e.id}, de ${nodeName(e.from)} até ${nodeName(e.to)}, por ${fmt(e.raw.distancia_m)} metros.`;
      if (e.raw.qtd_ocorrencias_ativas > 0) text += ` Atenção: ${e.raw.qtd_ocorrencias_ativas} ocorrência(s) ativa(s) registrada(s).`;
      if (e.raw.penalidade_obstaculos > 0) text += " Há registro de obstáculos neste trecho.";
      return { text, length: e.raw.distancia_m, node: e.from };
    });
    list.push({ text: `Você chegou a ${nodeName(c.nodes[c.nodes.length - 1]!)}.`, length: 0, node: c.nodes[c.nodes.length - 1]! });
    return list;
  }, [c]);
  const remaining = steps.slice(step).reduce((a, s) => a + s.length, 0);
  const current = steps[step];
  const done = step === steps.length - 1;

  useEffect(() => {
    if (!speechOk || !prefs.audio || !current) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(current.text); u.lang = "pt-BR";
    window.speechSynthesis.speak(u);
    return () => window.speechSynthesis.cancel();
  }, [step, prefs.audio, speechOk, current]);

  if (!c) return (
    <AppShell><TopBar title="Percurso" back="/rotas" />
      <div className="p-6 text-base">Percurso indisponível para a busca atual. <Link to="/rotas" className="font-semibold text-brand-strong underline">Voltar às rotas</Link></div>
    </AppShell>
  );

  const recalcFromHere = () => {
    window.speechSynthesis?.cancel();
    setSearch({ origin: String(current!.node), selectedKey: null });
    navigate({ to: "/rotas" });
  };

  return (
    <AppShell>
      <TopBar title={`${c.label} · percurso`} back={`/rota/${c.key}`}
        right={speechOk ? (
          <button onClick={() => setPrefs({ audio: !prefs.audio })} className="tap flex items-center justify-center rounded-full hover:bg-muted"
            aria-label={prefs.audio ? "Desativar orientação por áudio" : "Ativar orientação por áudio"} aria-pressed={prefs.audio}>
            {prefs.audio ? <Volume2 className="h-6 w-6 text-brand-strong" /> : <VolumeX className="h-6 w-6" />}
          </button>) : undefined} />
      <p className="flex items-center justify-center gap-2 bg-beige py-2 text-sm font-semibold"><FlaskConical className="h-4 w-4" aria-hidden /> Percurso simulado — avanço manual, sem GPS</p>
      <div className="h-[30dvh] bg-muted">
        <SchematicMap className="h-full w-full" nodes={result.graph?.nodes ?? []} candidates={[c]} selectedKey={c.key}
          origin={c.nodes[0]} destination={c.nodes[c.nodes.length - 1]} progressNode={current?.node} />
      </div>
      <section aria-live="polite" className="mx-5 -mt-6 relative rounded-3xl bg-primary p-5 text-primary-foreground shadow-card">
        <p className="text-sm font-semibold">{done ? "Chegada" : `Etapa ${step + 1} de ${steps.length - 1}`}</p>
        <p className="mt-1 text-lg font-semibold">{current?.text}</p>
        <p className="mt-2 text-base">{fmt(remaining)} m restantes · ~{remaining ? estMinutes(remaining) : 0} min (estimativa)</p>
      </section>
      <div className="flex gap-3 px-5 pt-4">
        <Button variant="secondary" className="flex-1" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft className="h-5 w-5" />Anterior</Button>
        {done ? <Button className="flex-1" onClick={() => navigate({ to: "/" })}><Flag className="h-5 w-5" />Concluir</Button>
          : <Button className="flex-1" onClick={() => setStep(step + 1)}>Próxima<ChevronRight className="h-5 w-5" /></Button>}
      </div>
      {!done && step > 0 && <button onClick={recalcFromHere} className={cn(btn({ variant: "ghost" }), "mx-5 mt-2")}><RefreshCw className="h-5 w-5" />Recalcular a partir de {nodeName(current!.node)}</button>}
      {!speechOk && <p className="px-5 pt-2 text-sm text-muted-foreground">Áudio indisponível neste navegador.</p>}
      <ol className="flex flex-col gap-2 px-5 py-4 pb-28" aria-label="Etapas do percurso">
        {steps.map((s, i) => (
          <li key={i} className={cn("flex gap-3 rounded-2xl p-3 text-base", i === step ? "bg-beige font-medium" : "bg-muted", i < step && "text-muted-foreground")}>
            {i < step ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success-strong" aria-label="Concluída" /> : <span className="w-5 shrink-0 text-center font-semibold">{i + 1}</span>}
            <span>{s.text}</span>
          </li>
        ))}
      </ol>
      <div className="pb-safe fixed inset-x-0 bottom-0 mx-auto max-w-md border-t bg-background px-5 pt-3">
        <Button variant="danger" block onClick={() => { window.speechSynthesis?.cancel(); navigate({ to: "/rotas" }); }}>Encerrar percurso</Button>
      </div>
    </AppShell>
  );
}
