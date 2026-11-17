// SIMULATED demonstration data. Not real urban data.
import type { Barrier, Feature, Junction, Place, RouteDef, Segment } from "./types";

export const DATA_SOURCE = {
  label: "Dados simulados para demonstração — região fictícia",
  updatedAt: "2026-11-01",
};

export const places: Place[] = [
  { id: "estacao", name: "Estação Central", short: "Estação", x: 60, y: 400 },
  { id: "biblioteca", name: "Biblioteca Municipal", short: "Biblioteca", x: 290, y: 80 },
  { id: "parque", name: "Parque das Águas", short: "Parque", x: 70, y: 150 },
  // Real place name; position, segments and indicators below are SIMULATED (address/city pending confirmation).
  { id: "praca", name: "Praça Vila Oliveira", short: "Vila Oliveira", x: 180, y: 250 },
  { id: "mercado", name: "Mercado Municipal", short: "Mercado", x: 320, y: 190 },
  { id: "hospital", name: "Hospital Regional", short: "Hospital", x: 200, y: 40 },
];

export const junctions: Junction[] = [
  { id: "j1", x: 60, y: 260 },
  { id: "j2", x: 170, y: 340 },
  { id: "j3", x: 300, y: 340 },
  { id: "j4", x: 180, y: 170 },
  { id: "j5", x: 290, y: 260 },
  { id: "j6", x: 290, y: 410 },
];

export const features: Feature[] = [
  { id: "rampa", label: "Rampas de acesso", phrase: "rampas" },
  { id: "calcada_boa", label: "Calçada em bom estado", phrase: "melhores condições de calçada" },
  { id: "sombra", label: "Trechos com sombra", phrase: "trechos com sombra" },
  { id: "bancos", label: "Bancos para descanso", phrase: "bancos para descanso" },
  { id: "semaforo_sonoro", label: "Semáforo sonoro", phrase: "semáforos sonoros" },
  { id: "piso_tatil", label: "Piso tátil", phrase: "piso tátil" },
  { id: "iluminacao", label: "Boa iluminação", phrase: "boa iluminação" },
  { id: "sinalizacao", label: "Placas de orientação", phrase: "placas de orientação" },
];

export const barriers: Barrier[] = [
  { id: "escada", label: "Escadaria sem rampa alternativa", phrase: "escadas", blocks: "semEscadas" },
  { id: "calcada_irregular", label: "Calçada irregular", phrase: "calçada irregular" },
  { id: "ladeira", label: "Ladeira íngreme", phrase: "ladeira íngreme", blocks: "semLadeiras" },
  { id: "terra", label: "Trecho de terra batida", phrase: "trecho de terra batida" },
  { id: "travessia_sem_semaforo", label: "Travessia sem semáforo", phrase: "travessia sem semáforo" },
  { id: "pouca_iluminacao", label: "Pouca iluminação à noite", phrase: "pouca iluminação à noite" },
];

export const segments: Segment[] = [
  // Rota A
  { id: "s1", a: "estacao", b: "j2", name: "Rua do Comércio", length: 200, features: [], barriers: ["calcada_irregular"], crossings: 1 },
  { id: "s2", a: "j2", b: "j4", name: "Escadaria Central", length: 180, features: [], barriers: ["escada"], crossings: 0 },
  { id: "s3", a: "j4", b: "biblioteca", name: "Rua da Biblioteca", length: 220, features: ["calcada_boa"], barriers: [], crossings: 1 },
  // Rota B
  { id: "s4", a: "estacao", b: "j6", name: "Rua das Rampas", length: 250, features: ["rampa", "calcada_boa", "piso_tatil"], barriers: [], crossings: 1 },
  { id: "s5", a: "j6", b: "j3", name: "Travessa Acessível", length: 150, features: ["rampa", "calcada_boa"], barriers: [], crossings: 0 },
  { id: "s6", a: "j3", b: "j5", name: "Alameda Central", length: 200, features: ["calcada_boa", "iluminacao", "sinalizacao"], barriers: [], crossings: 1 },
  { id: "s7", a: "j5", b: "biblioteca", name: "Rua Nova", length: 250, features: ["rampa", "calcada_boa", "semaforo_sonoro"], barriers: [], crossings: 1 },
  // Rota C
  { id: "s8", a: "estacao", b: "j1", name: "Rua da Estação", length: 200, features: ["calcada_boa"], barriers: [], crossings: 1 },
  { id: "s9", a: "j1", b: "parque", name: "Caminho do Parque", length: 260, features: ["sombra", "bancos"], barriers: ["terra", "pouca_iluminacao"], crossings: 0 },
  { id: "s10", a: "parque", b: "biblioteca", name: "Passeio das Árvores", length: 320, features: ["sombra", "bancos", "rampa"], barriers: [], crossings: 1 },
  // Rota D
  { id: "s11", a: "j1", b: "j4", name: "Avenida Principal", length: 280, features: ["semaforo_sonoro", "sinalizacao", "iluminacao"], barriers: [], crossings: 2, missingData: "Condição das calçadas da Avenida Principal ainda não levantada." },
  // Praça Vila Oliveira ↔ Mercado — simulated segments, not real characteristics of the square
  { id: "s12", a: "praca", b: "j4", name: "Escadaria simulada (trecho demo 1)", length: 120, features: [], barriers: ["escada"], crossings: 0 },
  { id: "s13", a: "j4", b: "mercado", name: "Rua do Mercado", length: 230, features: ["calcada_boa"], barriers: ["ladeira"], crossings: 1 },
  { id: "s14", a: "praca", b: "j5", name: "Rua simulada (trecho demo 2)", length: 140, features: ["sombra"], barriers: ["travessia_sem_semaforo"], crossings: 0 },
  { id: "s15", a: "j5", b: "mercado", name: "Degraus do Mercado", length: 270, features: ["bancos"], barriers: ["escada"], crossings: 1 },
];

/** Routes are registered in one direction and served in both. */
export const routes: RouteDef[] = [
  {
    id: "rota-a", label: "Rota A", name: "Pela Escadaria Central",
    from: "estacao", to: "biblioteca", path: ["estacao", "j2", "j4", "biblioteca"],
    indicators: { acessibilidade: 25, seguranca: 60, orientacao: 65, conforto: 45, esforco: 45 },
  },
  {
    id: "rota-b", label: "Rota B", name: "Pela Rua das Rampas",
    from: "estacao", to: "biblioteca", path: ["estacao", "j6", "j3", "j5", "biblioteca"],
    indicators: { acessibilidade: 92, seguranca: 74, orientacao: 78, conforto: 76, esforco: 82 },
  },
  {
    id: "rota-c", label: "Rota C", name: "Pelo Parque das Águas",
    from: "estacao", to: "biblioteca", path: ["estacao", "j1", "parque", "biblioteca"],
    indicators: { acessibilidade: 62, seguranca: 52, orientacao: 58, conforto: 92, esforco: 70 },
  },
  {
    id: "rota-d", label: "Rota D", name: "Pela Avenida Principal",
    from: "estacao", to: "biblioteca", path: ["estacao", "j1", "j4", "biblioteca"],
    indicators: { acessibilidade: null, seguranca: 82, orientacao: 90, conforto: 48, esforco: 66 },
  },
  {
    id: "rota-e", label: "Rota A", name: "Pela escadaria (simulada)",
    from: "praca", to: "mercado", path: ["praca", "j4", "mercado"],
    indicators: { acessibilidade: 20, seguranca: 62, orientacao: 70, conforto: 50, esforco: 30 },
  },
  {
    id: "rota-f", label: "Rota B", name: "Pelos degraus (simulada)",
    from: "praca", to: "mercado", path: ["praca", "j5", "mercado"],
    indicators: { acessibilidade: 35, seguranca: 48, orientacao: 55, conforto: 60, esforco: 50 },
  },
];

export const getPlace = (id: string) => places.find((p) => p.id === id);
export const getNode = (id: string) =>
  places.find((p) => p.id === id) ?? junctions.find((j) => j.id === id);
export const getFeature = (id: string) => features.find((f) => f.id === id)!;
export const getBarrier = (id: string) => barriers.find((b) => b.id === id)!;
export const findSegment = (a: string, b: string) =>
  segments.find((s) => (s.a === a && s.b === b) || (s.a === b && s.b === a));
