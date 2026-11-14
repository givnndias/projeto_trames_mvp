import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AppShell, Button, TopBar } from "@/components/trames/ui";
import { edgeCost } from "@/lib/trames/costs";
import { bellmanFordDP } from "@/lib/trames/dp";
import { nodeName } from "@/lib/trames/graph";
import { fmt } from "@/lib/trames/present";
import { useTrames } from "@/lib/trames/store";

export const Route = createFileRoute("/tecnico")({
  head: () => ({
    meta: [
      { title: "Área técnica — Trames" },
      { name: "description", content: "Auditoria da base, tabela de programação dinâmica e recálculo." },
      { property: "og:title", content: "Área técnica — Trames" },
      { property: "og:description", content: "Detalhes do algoritmo Bellman-Ford por quantidade de arestas." },
    ],
  }),
  component: Tecnico,
});

function Tecnico() {
  const { audit, result, search, loadBase, resetBase, searchRuns } = useTrames();
  const [msg, setMsg] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const o = Number(search.origin);
  const dp = useMemo(() => result.graph && search.origin
    ? bellmanFordDP(result.graph, o, (e) => edgeCost(e, result.profile)) : null, [result, o, search.origin]);

  const onFile = async (f: File) => {
    try {
      const a = loadBase(JSON.parse(await f.text()));
      setMsg(a.ok ? `Nova base carregada: ${a.valid.length} válidos, ${a.invalid.length} inválidos. Rotas recalculadas.` : a.fatal);
    } catch { setMsg("O arquivo não é um JSON válido."); }
  };

  return (
    <AppShell>
      <TopBar title="Área técnica" back="/preferencias" />
      <div className="flex flex-col gap-5 px-5 py-5 text-sm">
        <section>
          <h2 className="text-lg font-semibold">Auditoria da base</h2>
          <p className="text-base">Total: {audit.total} · válidos: {audit.valid.length} · inválidos: {audit.invalid.length} · versão {audit.version}</p>
          {audit.invalid.length > 0 && <ul className="mt-2 list-disc pl-5">{audit.invalid.slice(0, 30).map((i) => <li key={i.index}>Trecho {i.id}: {i.reasons.join("; ")}</li>)}</ul>}
          <div className="mt-3 flex flex-wrap gap-2">
            <input ref={file} type="file" accept="application/json,.json" className="sr-only" aria-label="Carregar nova base JSON"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <Button variant="secondary" onClick={() => file.current?.click()}>Carregar nova base</Button>
            <Button variant="ghost" onClick={() => { resetBase(); setMsg("Base original restaurada."); }}>Restaurar original</Button>
          </div>
          {msg && <p role="status" className="mt-2 rounded-2xl bg-beige p-3 text-base">{msg}</p>}
        </section>
        <section>
          <h2 className="text-lg font-semibold">Busca atual</h2>
          <p>Prioridade: {result.profile.name} · peso: {result.profile.costLabel} · status: {result.status} · execuções da busca (cache): {searchRuns}</p>
          <p>Trechos bloqueados: {search.blocked.length ? search.blocked.join(", ") : "nenhum"}</p>
        </section>
        {dp && (
          <section>
            <h2 className="text-lg font-semibold">Tabela DP[k][v] (origem {nodeName(o)})</h2>
            <div className="overflow-x-auto">
              <table className="mt-2 w-full border-collapse text-left">
                <thead><tr><th className="border-b p-1">k</th>{dp.nodes.map((v) => <th key={v} className="border-b p-1">L{v}</th>)}</tr></thead>
                <tbody>{dp.table.map((row, k) => (
                  <tr key={k}><td className="border-b p-1 font-semibold">{k}</td>{dp.nodes.map((v) => {
                    const val = row.get(v)!; const p = dp.pred[k]!.get(v);
                    return <td key={v} className="border-b p-1">{Number.isFinite(val) ? fmt(val, 1) : "∞"}{p?.kind === "edge" && <span className="block text-xs text-muted-foreground">via #{p.edge.id}</span>}</td>;
                  })}</tr>))}</tbody>
              </table>
            </div>
            <p className="mt-2 text-muted-foreground">∞ = ainda não alcançado com k trechos. “via #id” = trecho escolhido na transição.</p>
          </section>
        )}
      </div>
    </AppShell>
  );
}
