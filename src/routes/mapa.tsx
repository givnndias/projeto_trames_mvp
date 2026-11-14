import { createFileRoute } from "@tanstack/react-router";
import { SchematicMap } from "@/components/trames/SchematicMap";
import { AppShell, SimBadge, TopBar } from "@/components/trames/ui";
import { nodeName } from "@/lib/trames/graph";
import { useTrames } from "@/lib/trames/store";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa da base de trechos — Trames" },
      { name: "description", content: "Locais e conexões direcionadas da base de trechos do Trames." },
      { property: "og:title", content: "Mapa — Trames" },
      { property: "og:description", content: "Visualização esquemática dos locais e trechos." },
    ],
  }),
  component: Mapa,
});

function Mapa() {
  const { result } = useTrames();
  const g = result.graph;
  const nodes = g?.nodes ?? [];
  const pairs = new Map<string, number>();
  for (const e of g?.edges ?? []) pairs.set(`${e.from}→${e.to}`, (pairs.get(`${e.from}→${e.to}`) ?? 0) + 1);
  return (
    <AppShell nav>
      <TopBar title="Mapa" />
      <div className="relative h-[46dvh] bg-muted">
        <SchematicMap className="h-full w-full" nodes={nodes} />
        <div className="absolute left-3 top-3"><SimBadge>Esquemático · sem coordenadas</SimBadge></div>
      </div>
      <section className="flex flex-col gap-3 px-5 py-5">
        <p className="text-base">A base possui {nodes.length} locais e {g?.edges.length ?? 0} trechos direcionados. Nomes e posições reais dependem de uma base complementar.</p>
        <h2 className="text-lg font-semibold">Trechos por sentido</h2>
        <ul className="grid grid-cols-2 gap-2">
          {[...pairs.entries()].sort().map(([k, n]) => {
            const [a, b] = k.split("→");
            return <li key={k} className="rounded-2xl bg-muted p-3 text-sm"><b>{nodeName(Number(a))} → {nodeName(Number(b))}</b><br />{n} trecho(s)</li>;
          })}
        </ul>
      </section>
    </AppShell>
  );
}
