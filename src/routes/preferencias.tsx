import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, TopBar, priorityIcon } from "@/components/trames/ui";
import { Link } from "@tanstack/react-router";
import { BASE_LABEL } from "@/lib/trames/base";
import { profiles } from "@/lib/trames/costs";
import { useTrames } from "@/lib/trames/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/preferencias")({
  head: () => ({
    meta: [
      { title: "Preferências — Trames" },
      { name: "description", content: "Prioridade padrão, tamanho do texto e orientações por áudio." },
      { property: "og:title", content: "Preferências — Trames" },
      { property: "og:description", content: "Ajuste o Trames ao seu jeito, sem dados pessoais." },
    ],
  }),
  component: Prefs,
});

const scales = [{ v: 1, l: "Padrão" }, { v: 1.15, l: "Grande" }, { v: 1.3, l: "Muito grande" }];

function Prefs() {
  const { prefs, setPrefs, setSearch } = useTrames();
  const [speechOk, setSpeechOk] = useState(false);
  useEffect(() => setSpeechOk("speechSynthesis" in window), []);
  return (
    <AppShell nav>
      <TopBar title="Preferências" />
      <div className="flex flex-col gap-6 px-5 py-5">
        <section>
          <label htmlFor="prio" className="mb-2 block text-lg font-semibold">Prioridade padrão</label>
          <select id="prio" value={prefs.defaultPriority}
            onChange={(e) => { const v = e.target.value as typeof prefs.defaultPriority; setPrefs({ defaultPriority: v }); setSearch({ priority: v }); }}
            className="tap w-full rounded-2xl border-2 border-border bg-background px-3 text-base">
            {profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {(() => { const I = priorityIcon[prefs.defaultPriority]; return <I className="h-4 w-4" aria-hidden />; })()}
            Usada como seleção inicial em novas buscas.
          </p>
        </section>
        <fieldset>
          <legend className="mb-2 text-lg font-semibold">Tamanho do texto</legend>
          <div className="flex gap-2">
            {scales.map((s) => (
              <button key={s.v} onClick={() => setPrefs({ textScale: s.v })} aria-pressed={prefs.textScale === s.v}
                className={cn("tap flex-1 rounded-2xl border-2 px-2 py-2 font-medium",
                  prefs.textScale === s.v ? "border-brand bg-beige" : "border-border bg-background")}>
                {s.l}
              </button>
            ))}
          </div>
        </fieldset>
        <section className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">Orientações por áudio</p>
            <p className="text-sm text-muted-foreground">{speechOk ? "Lê cada etapa durante o percurso." : "Indisponível neste navegador."}</p>
          </div>
          <button role="switch" aria-checked={prefs.audio && speechOk} disabled={!speechOk} aria-label="Orientações por áudio"
            onClick={() => setPrefs({ audio: !prefs.audio })}
            className={cn("tap relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50", prefs.audio && speechOk ? "bg-primary" : "bg-input")}>
            <span className={cn("absolute top-1 h-6 w-6 rounded-full bg-background shadow-card transition-all", prefs.audio && speechOk ? "left-7" : "left-1")} />
          </button>
        </section>
        <section className="rounded-2xl bg-beige p-4 text-base">
          <h2 className="text-lg font-semibold">Sobre os dados</h2>
          <p className="mt-1">Fonte: {BASE_LABEL}. Os locais são identificados por número; não há nomes, coordenadas nem dados em tempo real.</p>
          <Link to="/tecnico" className="tap mt-2 inline-flex items-center font-semibold text-brand-strong underline">Abrir área técnica (auditoria e programação dinâmica)</Link>
          <p className="mt-2">O Trames não pede cadastro, diagnóstico, deficiência ou gênero. Preferências ficam apenas neste aparelho.</p>
        </section>
      </div>
    </AppShell>
  );
}
