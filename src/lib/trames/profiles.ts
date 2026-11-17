import type { PriorityProfile, RestrictionId } from "./types";

export const profiles: PriorityProfile[] = [
  {
    id: "acessibilidade", name: "Acessibilidade", description: "Reduzir barreiras físicas.",
    weights: { acessibilidade: 60, orientacao: 15, conforto: 10, seguranca: 10, esforco: 5 },
    impliedRestrictions: ["semEscadas"],
  },
  {
    id: "seguranca", name: "Segurança relativa", description: "Priorizar melhores indicadores disponíveis.",
    weights: { seguranca: 65, orientacao: 10, acessibilidade: 10, conforto: 10, esforco: 5 },
    impliedRestrictions: [],
  },
  {
    id: "orientacao", name: "Orientação", description: "Facilitar localização e travessias.",
    weights: { orientacao: 60, seguranca: 15, acessibilidade: 15, conforto: 5, esforco: 5 },
    impliedRestrictions: [],
  },
  {
    id: "conforto", name: "Conforto", description: "Valorizar sombra, bancos e boas calçadas.",
    weights: { conforto: 60, acessibilidade: 15, seguranca: 10, orientacao: 5, esforco: 10 },
    impliedRestrictions: [],
  },
  {
    id: "esforco", name: "Menor esforço", description: "Reduzir desgaste físico.",
    // Hypothesis of the prototype, pending validation.
    weights: { esforco: 60, acessibilidade: 15, conforto: 10, rapidez: 10, orientacao: 5 },
    impliedRestrictions: [], hypothesis: true,
  },
  {
    id: "rapidez", name: "Rapidez", description: "Priorizar menor tempo estimado.",
    // Hypothesis of the prototype, pending validation.
    weights: { rapidez: 70, esforco: 10, orientacao: 10, seguranca: 10 },
    impliedRestrictions: [], hypothesis: true,
  },
  {
    id: "equilibrado", name: "Equilibrado", description: "Combinar os critérios.",
    weights: { acessibilidade: 25, seguranca: 25, orientacao: 15, conforto: 15, esforco: 10, rapidez: 10 },
    impliedRestrictions: [],
  },
];

export const restrictions: { id: RestrictionId; label: string; description: string }[] = [
  { id: "semEscadas", label: "Evitar escadas", description: "Rotas com escadas sem rampa não serão recomendadas." },
  { id: "semLadeiras", label: "Evitar ladeiras íngremes", description: "Rotas com ladeiras íngremes não serão recomendadas." },
];

export const dimensionLabels = {
  acessibilidade: "Acessibilidade",
  seguranca: "Segurança relativa",
  orientacao: "Orientação",
  conforto: "Conforto",
  esforco: "Menor esforço",
  rapidez: "Rapidez",
} as const;

export const getProfile = (id: string) => profiles.find((p) => p.id === id) ?? profiles[6]!;
