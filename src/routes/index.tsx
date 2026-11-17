import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowUpDown, MapPin, Flag, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, Button, Logo, SimBadge } from "@/components/trames/ui";
import { places } from "@/lib/trames/data";
import { useTrames } from "@/lib/trames/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trames — Para onde vamos?" },
      { name: "description", content: "Informe origem e destino e compare percursos a pé conforme suas prioridades." },
      { property: "og:title", content: "Trames — Para onde vamos?" },
      { property: "og:description", content: "Seu caminho, suas prioridades." },
    ],
  }),
  component: Home,
});

function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 1400); return () => clearTimeout(t); }, [onDone]);
  return (
    <button
      onClick={onDone}
      aria-label="Abertura do Trames. Toque para continuar."
      className="bg-warm fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 px-8"
    >
      <div className="rounded-3xl bg-background px-8 py-6 shadow-card">
        <Logo className="h-20" />
      </div>
      <p className="text-xl font-semibold text-ink">Seu caminho, suas prioridades.</p>
    </button>
  );
}

function Home() {
  const { search, setSearch, hydrated } = useTrames();
  const navigate = useNavigate();
  const [splash, setSplash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionStorage.getItem("trames:splash")) setSplash(true);
  }, []);
  const endSplash = () => { sessionStorage.setItem("trames:splash", "1"); setSplash(false); };

  const submit = () => {
    if (!search.origin || !search.destination) {
      setError(!search.origin && !search.destination
        ? "Escolha a origem e o destino para continuar."
        : !search.origin ? "Escolha de onde você vai sair." : "Escolha para onde você quer ir.");
      return;
    }
    if (search.origin === search.destination) {
      setError("Origem e destino são o mesmo local. Escolha um destino diferente.");
      return;
    }
    setError(null);
    navigate({ to: "/prioridade" });
  };

  return (
    <AppShell nav>
      {splash && <Splash onDone={endSplash} />}
      <div className="pt-safe flex items-center justify-between px-5 pb-2">
        <Logo compact className="h-11" />
        <SimBadge>Região demonstrativa</SimBadge>
      </div>
      <section className="flex flex-col gap-5 px-5 pt-4">
        <h1 className="text-3xl font-bold">Para onde vamos?</h1>
        <div className="relative rounded-3xl bg-background p-4 shadow-card ring-1 ring-border">
          <PlaceSelect id="origem" label="Origem" icon={<MapPin className="h-5 w-5 text-brand-strong" aria-hidden />}
            value={search.origin} disabled={!hydrated}
            onChange={(v) => { setSearch({ origin: v, selectedRouteId: null }); setError(null); }} />
          <div className="my-2 flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <button
              onClick={() => setSearch({ origin: search.destination, destination: search.origin, selectedRouteId: null })}
              className="tap flex items-center justify-center rounded-full border-2 border-brand bg-background text-brand-strong hover:bg-beige"
              aria-label="Inverter origem e destino"
            >
              <ArrowUpDown className="h-5 w-5" />
            </button>
          </div>
          <PlaceSelect id="destino" label="Destino" icon={<Flag className="h-5 w-5 text-success-strong" aria-hidden />}
            value={search.destination} disabled={!hydrated}
            onChange={(v) => { setSearch({ destination: v, selectedRouteId: null }); setError(null); }} />
        </div>
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-2xl bg-beige p-3 text-base">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden /> {error}
          </p>
        )}
        <Button block onClick={submit}>Escolher prioridade</Button>
        <p className="text-sm text-muted-foreground">
          Sem cadastro. A localização é escolhida manualmente nesta demonstração. Rotas cadastradas: Estação Central ↔ Biblioteca Municipal e Praça da Matriz ↔ Mercado Municipal.
        </p>
      </section>
    </AppShell>
  );
}

function PlaceSelect({ id, label, icon, value, onChange, disabled }: {
  id: string; label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-3 rounded-2xl bg-muted px-3">
        {icon}
        <select id={id} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
          className="tap w-full bg-transparent py-3 text-base font-medium outline-none">
          <option value="">Selecione um local</option>
          {places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
    </div>
  );
}
