import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect } from "react";
import { AppShell, Button, TopBar, priorityIcon } from "@/components/trames/ui";
import { getProfile, profiles } from "@/lib/trames/costs";
import { nodeName } from "@/lib/trames/graph";
import { useTrames } from "@/lib/trames/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/prioridade")({
  head: () => ({
    meta: [
      { title: "O que importa neste caminho? — Trames" },
      { name: "description", content: "Escolha a prioridade do seu percurso a pé." },
      { property: "og:title", content: "Escolha da prioridade — Trames" },
      { property: "og:description", content: "Acessibilidade, segurança, orientação, conforto, esforço, rapidez ou equilibrado." },
    ],
  }),
  component: Prioridade,
});

function Prioridade() {
  const { search, setSearch, hydrated } = useTrames();
  const navigate = useNavigate();
  useEffect(() => {
    if (hydrated && (!search.origin || !search.destination)) navigate({ to: "/" });
  }, [hydrated, search.origin, search.destination, navigate]);
  const profile = getProfile(search.priority);

  return (
    <AppShell>
      <TopBar title="Prioridade" back="/" />
      <div className="flex flex-col gap-4 px-5 py-4 pb-32">
        <p className="text-sm text-muted-foreground">
          {nodeName(Number(search.origin))} → {nodeName(Number(search.destination))}
        </p>
        <h2 className="text-2xl font-bold">O que importa neste caminho?</h2>
        <fieldset>
          <legend className="sr-only">Prioridade principal</legend>
          <div className="flex flex-col gap-3">
            {profiles.map((p) => {
              const Icon = priorityIcon[p.id];
              const sel = search.priority === p.id;
              return (
                <label key={p.id} className={cn(
                  "tap flex cursor-pointer items-center gap-4 rounded-2xl border-2 bg-background p-4 transition-colors",
                  sel ? "border-brand bg-beige" : "border-border hover:border-brand-light",
                )}>
                  <input type="radio" name="prio" className="sr-only" checked={sel}
                    onChange={() => setSearch({ priority: p.id, selectedKey: null })} />
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                    sel ? "bg-primary text-primary-foreground" : "bg-muted text-ink")}>
                    <Icon className="h-6 w-6" aria-hidden />
                  </span>
                  <span className="flex-1">
                    <span className="block text-base font-semibold">{p.name}</span>
                    <span className="block text-sm text-muted-foreground">{p.description}</span>
                  </span>
                  {sel && <span className="flex items-center gap-1 text-sm font-semibold text-brand-strong"><Check className="h-5 w-5" aria-hidden />Selecionada</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
        {profile.limitation && (
          <p role="note" className="rounded-2xl bg-beige p-4 text-base"><b>Limitação da base:</b> {profile.limitation}</p>
        )}
        <p className="text-sm text-muted-foreground">Peso usado na busca: {profile.costLabel}. Pesos derivados são configuração proposta para o protótipo.</p>
      </div>
      <div className="pb-safe fixed inset-x-0 bottom-0 mx-auto max-w-md border-t bg-background px-5 pt-3 shadow-float">
        <Button block onClick={() => navigate({ to: "/rotas" })}>Comparar rotas</Button>
      </div>
    </AppShell>
  );
}
