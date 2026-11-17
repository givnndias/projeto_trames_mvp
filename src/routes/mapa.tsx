import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { SchematicMap } from "@/components/trames/SchematicMap";
import { AppShell, SimBadge, TopBar } from "@/components/trames/ui";
import { places, routes } from "@/lib/trames/data";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa da região demonstrativa — Trames" },
      { name: "description", content: "Locais e conexões cadastradas na região demonstrativa do Trames." },
      { property: "og:title", content: "Mapa — Trames" },
      { property: "og:description", content: "Mapa esquemático da região demonstrativa." },
    ],
  }),
  component: Mapa,
});

function Mapa() {
  const pairs = Array.from(new Set(routes.map((r) => `${r.from}|${r.to}`)));
  const name = (id: string) => places.find((p) => p.id === id)!.name;
  return (
    <AppShell nav>
      <TopBar title="Mapa" />
      <div className="relative h-[50dvh] bg-muted">
        <SchematicMap className="h-full w-full" />
        <div className="absolute left-3 top-3"><SimBadge>Mapa esquemático · demonstração</SimBadge></div>
      </div>
      <section className="flex flex-col gap-3 px-5 py-5">
        <h2 className="text-lg font-semibold">Locais da região</h2>
        <ul className="grid grid-cols-1 gap-2">
          {places.map((p) => <li key={p.id} className="flex items-center gap-2 rounded-2xl bg-muted p-3 text-base"><MapPin className="h-5 w-5 text-brand-strong" aria-hidden />{p.name}</li>)}
        </ul>
        <h2 className="mt-2 text-lg font-semibold">Conexões cadastradas</h2>
        <ul className="flex flex-col gap-2">
          {pairs.map((k) => { const [a = "", b = ""] = k.split("|"); const n = routes.filter((r) => `${r.from}|${r.to}` === k).length;
            return <li key={k} className="rounded-2xl bg-beige p-3 text-base">{name(a)} ↔ {name(b)} · {n} rotas</li>; })}
        </ul>
        <p className="text-sm text-muted-foreground">Outras combinações não possuem rotas cadastradas nesta demonstração.</p>
      </section>
    </AppShell>
  );
}
