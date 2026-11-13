import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { auditBase, type AuditResult } from "./audit";
import { DEFAULT_AUDIT } from "./base";
import type { PriorityId } from "./costs";
import { RouteCache } from "./recalc";
import type { SearchOutput } from "./ranking";

export interface Prefs { defaultPriority: PriorityId; textScale: number; audio: boolean }
export interface Search {
  origin: string; destination: string; priority: PriorityId;
  selectedKey: string | null; blocked: number[];
}

const defaultPrefs: Prefs = { defaultPriority: "equilibrado", textScale: 1, audio: true };
const defaultSearch: Search = { origin: "", destination: "", priority: "equilibrado", selectedKey: null, blocked: [] };

interface Ctx {
  prefs: Prefs; setPrefs: (p: Partial<Prefs>) => void;
  search: Search; setSearch: (s: Partial<Search>) => void;
  hydrated: boolean;
  audit: AuditResult; loadBase: (json: unknown) => AuditResult; resetBase: () => void;
  result: SearchOutput; searchRuns: number;
}
const StoreCtx = createContext<Ctx | null>(null);

export function TramesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(defaultPrefs);
  const [search, setSearchState] = useState<Search>(defaultSearch);
  const [hydrated, setHydrated] = useState(false);
  const [audit, setAudit] = useState<AuditResult>(DEFAULT_AUDIT);
  const cache = useRef(new RouteCache());

  useEffect(() => {
    try {
      const p = localStorage.getItem("trames:prefs");
      const loaded = p ? { ...defaultPrefs, ...JSON.parse(p) } : defaultPrefs;
      setPrefsState(loaded);
      const s = sessionStorage.getItem("trames:search2");
      setSearchState(s ? { ...defaultSearch, ...JSON.parse(s) } : { ...defaultSearch, priority: loaded.defaultPriority });
    } catch { /* storage unavailable */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("trames:prefs", JSON.stringify(prefs));
    document.documentElement.style.setProperty("--text-scale", String(prefs.textScale));
  }, [prefs, hydrated]);
  useEffect(() => { if (hydrated) sessionStorage.setItem("trames:search2", JSON.stringify(search)); }, [search, hydrated]);

  const result = useMemo(() => cache.current.get(audit.ok ? audit.valid : null, {
    version: audit.version,
    origin: search.origin ? Number(search.origin) : null,
    dest: search.destination ? Number(search.destination) : null,
    priority: search.priority, blocked: search.blocked,
  }), [audit, search.origin, search.destination, search.priority, search.blocked]);

  const value: Ctx = {
    prefs, search, hydrated, audit, result, searchRuns: cache.current.runs,
    setPrefs: (p) => setPrefsState((o) => ({ ...o, ...p })),
    setSearch: (s) => setSearchState((o) => ({ ...o, ...s })),
    loadBase: (json) => {
      const a = auditBase(json);
      if (a.ok) { cache.current.invalidate(); setAudit(a); setSearchState((o) => ({ ...o, blocked: [], selectedKey: null })); }
      return a;
    },
    resetBase: () => { cache.current.invalidate(); setAudit(DEFAULT_AUDIT); setSearchState((o) => ({ ...o, blocked: [], selectedKey: null })); },
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useTrames() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useTrames outside provider");
  return c;
}
