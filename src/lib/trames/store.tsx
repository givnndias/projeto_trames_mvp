import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { PriorityId, RestrictionId } from "./types";

export interface Prefs {
  defaultPriority: PriorityId;
  textScale: number; // 1 = 100%
  audio: boolean;
}
export interface Search {
  origin: string;
  destination: string;
  priority: PriorityId;
  restrictions: RestrictionId[];
  selectedRouteId: string | null;
}

const defaultPrefs: Prefs = { defaultPriority: "equilibrado", textScale: 1, audio: true };
const defaultSearch: Search = {
  origin: "", destination: "", priority: "equilibrado", restrictions: [], selectedRouteId: null,
};

interface Ctx {
  prefs: Prefs;
  setPrefs: (p: Partial<Prefs>) => void;
  search: Search;
  setSearch: (s: Partial<Search>) => void;
  hydrated: boolean;
}
const StoreCtx = createContext<Ctx | null>(null);

export function TramesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Prefs>(defaultPrefs);
  const [search, setSearchState] = useState<Search>(defaultSearch);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem("trames:prefs");
      const loaded = p ? { ...defaultPrefs, ...JSON.parse(p) } : defaultPrefs;
      setPrefsState(loaded);
      const s = sessionStorage.getItem("trames:search");
      setSearchState(s ? { ...defaultSearch, ...JSON.parse(s) } : { ...defaultSearch, priority: loaded.defaultPriority });
    } catch { /* storage unavailable */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("trames:prefs", JSON.stringify(prefs));
    document.documentElement.style.setProperty("--text-scale", String(prefs.textScale));
  }, [prefs, hydrated]);
  useEffect(() => {
    if (hydrated) sessionStorage.setItem("trames:search", JSON.stringify(search));
  }, [search, hydrated]);

  return (
    <StoreCtx.Provider
      value={{
        prefs, search, hydrated,
        setPrefs: (p) => setPrefsState((o) => ({ ...o, ...p })),
        setSearch: (s) => setSearchState((o) => ({ ...o, ...s })),
      }}
    >
      {children}
    </StoreCtx.Provider>
  );
}

export function useTrames() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useTrames outside provider");
  return c;
}
