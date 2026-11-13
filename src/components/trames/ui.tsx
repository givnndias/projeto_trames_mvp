import { Link, useRouter } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Accessibility, ArrowLeft, Clock, Compass, Footprints, Home, Map as MapIcon, Scale, Settings,
  ShieldCheck, Trees, FlaskConical,
} from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import logoH from "@/assets/trames_logo_horizontal.png.asset.json";
import logoC from "@/assets/trames_logo_compact.png.asset.json";
import type { PriorityId } from "@/lib/trames/costs";

export const btn = cva(
  "tap inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-card hover:bg-brand-light",
        secondary: "border-2 border-brand bg-background text-brand-strong hover:bg-beige",
        ghost: "text-brand-strong hover:bg-beige",
        danger: "border-2 border-destructive bg-background text-destructive hover:bg-muted",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "primary" },
  },
);

export function Button({
  variant, block, className, ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof btn>) {
  return <button className={cn(btn({ variant, block }), className)} {...p} />;
}

export function Logo({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <img
      src={compact ? logoC.url : logoH.url}
      alt="Trames"
      className={cn(compact ? "h-10 w-auto" : "h-12 w-auto", className)}
    />
  );
}

export function AppShell({ children, nav, className }: { children: ReactNode; nav?: boolean; className?: string }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background">
      <main className={cn("flex flex-1 flex-col", nav && "pb-24", className)}>{children}</main>
      {nav && <BottomNav />}
    </div>
  );
}

export function TopBar({ title, back, right }: { title: string; back?: string; right?: ReactNode }) {
  const router = useRouter();
  return (
    <header className="pt-safe sticky top-0 z-20 flex items-center gap-2 border-b bg-background px-2 pb-2">
      {back !== undefined && (
        <button
          onClick={() => (back ? router.navigate({ to: back }) : router.history.back())}
          className="tap flex items-center justify-center rounded-full hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
      )}
      <h1 className="flex-1 truncate px-2 text-lg font-semibold">{title}</h1>
      {right}
    </header>
  );
}

function BottomNav() {
  const items = [
    { to: "/", label: "Início", icon: Home },
    { to: "/mapa", label: "Mapa", icon: MapIcon },
    { to: "/preferencias", label: "Preferências", icon: Settings },
  ] as const;
  return (
    <nav aria-label="Navegação principal" className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t bg-background shadow-float">
      <ul className="flex">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: true }}
              className="tap flex flex-col items-center gap-0.5 py-2 text-sm text-muted-foreground data-[status=active]:font-semibold data-[status=active]:text-brand-strong"
            >
              <Icon className="h-6 w-6" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SimBadge({ children = "Dados simulados" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-beige px-3 py-1 text-sm font-medium text-ink">
      <FlaskConical className="h-4 w-4" aria-hidden /> {children}
    </span>
  );
}

export const priorityIcon: Record<PriorityId, typeof Home> = {
  acessibilidade: Accessibility,
  seguranca: ShieldCheck,
  orientacao: Compass,
  conforto: Trees,
  esforco: Footprints,
  rapidez: Clock,
  equilibrado: Scale,
};

export function IarBadge({ value, size = "md" }: { value: number | null; size?: "md" | "lg" }) {
  const shown = value === null ? null : Math.round(value);
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-2xl bg-beige text-ink",
        size === "lg" ? "h-24 w-24" : "h-16 w-16",
      )}
      aria-label={shown === null ? "IAR indisponível por dados insuficientes" : `IAR médio ${shown} de 100`}
    >
      <span className={cn("font-bold leading-none", size === "lg" ? "text-4xl" : "text-2xl")}>{shown ?? "—"}</span>
      <span className="text-xs font-medium">IAR</span>
    </div>
  );
}
