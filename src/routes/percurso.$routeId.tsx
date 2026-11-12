import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronLeft, ChevronRight, FlaskConical, Volume2, VolumeX, Flag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MapControls, SchematicMap } from "@/components/trames/SchematicMap";
import { AppShell, Button, TopBar } from "@/components/trames/ui";
import { getBarrier, getFeature, getPlace } from "@/lib/trames/data";
import { WALK_M_PER_MIN, recommend } from "@/lib/trames/recommend";
import { useTrames } from "@/lib/trames/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/percurso/$routeId")({
  head: () => ({
    meta: [
      { title: "Percurso simulado — Trames" },
      { name: "description", content: "Acompanhe as etapas do percurso com orientações sobre travessias, rampas e obstáculos." },
      { property: "og:title", content: "Percurso simulado — Trames" },
      { property: "og:description", content: "Orientações passo a passo do seu percurso." },
    ],
  }),
  component: Percurso,
});

function Percurso() {
  const { routeId } = Route.useParams();
  const { search, prefs, setPrefs } = useTrames();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [speechOk, setSpeechOk] = useState(false);
  useEffect(() => { setSpeechOk(typeof window !== "undefined" && "speechSynthesis" in window); }, []);

  const r = useMemo(
    () => recommend(search.origin, search.destination, search.priority, search.restrictions).results.find((x) => x.route.id === routeId),
    [search, routeId],
  );
  const path = r ? (r.route.from === search.origin ? r.route.path : [...r.route.path].reverse()) : [];

  const steps = useMemo(() => {
    if (!r) return [];
    const list = r.segments.map((s, i) => {
      const feats = s.features.map((f) => getFeature(f).label.toLowerCase());
      const bars = s.barriers.map((b) => getBarrier(b).label.toLowerCase());
      let text = `Siga pela ${s.name} por ${s.length} metros.`;
      if (s.crossings) text += ` ${s.crossings === 1 ? "Há 1 travessia com semáforo" : `Há ${s.crossings} travessias com semáforo`}.`;
      if (feats.length) text += ` Recursos: ${feats.join(", ")}.`;
      if (bars.length) text += ` Atenção: ${bars.join(", ")}.`;
      if (s.missingData) text += " Trecho sem dados completos de calçada.";
      return { text, length: s.length, node: path[i] };
    });
    list.push({ text: `Você chegou a ${getPlace(search.destination)?.name}.`, length: 0, node: path[path.length - 1] });
    return list;
  }, [r, path, search.destination]);

  const remaining = steps.slice(step).reduce((a, s) => a + s.length, 0);
  const current = steps[step];
  const done = step === steps.length - 1;

  useEffect(() => {
    if (!speechOk || !prefs.audio || !current) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(current.text);
    u.lang = "pt-BR";
    window.speechSynthesis.speak(u);
    return () => window.speechSynthesis.cancel();
  }, [step, prefs.audio, speechOk, current]);

  if (!r) return (
    <AppShell><TopBar title="Percurso" back="/rotas" />
      <div className="p-6 text-base">Percurso indisponível para a busca atual. <Link to="/rotas" className="font-semibold text-brand-strong underline">Voltar às rotas</Link></div>
    </AppShell>
  );

  return (
    <AppShell>
      <TopBar title={`${r.route.label} · percurso`} back={`/rota/${r.route.id}`}
        right={speechOk ? (
          <button onClick={() => setPrefs({ audio: !prefs.audio })} className="tap flex items-center justify-center rounded-full hover:bg-muted"
            aria-label={prefs.audio ? "Desativar orientação por áudio" : "Ativar orientação por áudio"} aria-pressed={prefs.audio}>
            {prefs.audio ? <Volume2 className="h-6 w-6 text-brand-strong" /> : <VolumeX className="h-6 w-6" />}
          </button>
        ) : undefined} />
      <p className="flex items-center justify-center gap-2 bg-beige py-2 text-sm font-semibold">
        <FlaskConical className="h-4 w-4" aria-hidden /> Percurso simulado — avanço manual, sem GPS
      </p>
      <div className="relative h-[36dvh] bg-muted">
        <SchematicMap className="h-full w-full" results={[r]} selectedId={r.route.id} origin={search.origin} destination={search.destination}
          progressNode={current?.node} fit={path} zoom={zoom} />
        <span className="absolute left-3 top-3 rounded-full bg-background px-3 py-1 text-sm font-medium shadow-card">● Posição simulada da etapa</span>
        <MapControls className="absolute bottom-8 right-3" onZoomIn={() => setZoom((z) => Math.min(z * 1.4, 4))}
          onZoomOut={() => setZoom((z) => Math.max(z / 1.4, 0.6))} onCenter={() => setZoom(1)} />
      </div>
      <section aria-live="polite" className="mx-5 -mt-6 rounded-3xl bg-primary p-5 text-primary-foreground shadow-card">
        <p className="text-sm font-semibold">{done ? "Chegada" : `Etapa ${step + 1} de ${steps.length - 1}`}</p>
        <p className="mt-1 text-lg font-semibold">{current?.text}</p>
        <p className="mt-2 text-base">{remaining} m restantes · ~{Math.ceil(remaining / WALK_M_PER_MIN)} min</p>
      </section>
      <div className="flex gap-3 px-5 pt-4">
        <Button variant="secondary" className="flex-1" disabled={step === 0} onClick={() => setStep(step - 1)}><ChevronLeft className="h-5 w-5" />Anterior</Button>
        {done
          ? <Button className="flex-1" onClick={() => navigate({ to: "/" })}><Flag className="h-5 w-5" />Concluir</Button>
          : <Button className="flex-1" onClick={() => setStep(step + 1)}>Próxima<ChevronRight className="h-5 w-5" /></Button>}
      </div>
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
