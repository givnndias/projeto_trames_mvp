// Import + audit layer for the Data Science export. Pure, no UI.

export interface RawTrecho {
  id_trecho: number; origem_id: number; destino_id: number; distancia_m: number;
  IAR: number; faixa_IAR: string; score_recursos: number; score_seguranca: number;
  score_avaliacao: number; qtd_avaliacoes: number; qtd_ocorrencias: number;
  qtd_ocorrencias_ativas: number; penalidade_ocorrencias: number; penalidade_obstaculos: number;
  custo_recomendacao: number; confianca_dados: string;
}

export interface InvalidRecord { id: string; index: number; reasons: string[] }

export interface AuditResult {
  ok: boolean;
  valid: RawTrecho[];
  invalid: InvalidRecord[];
  total: number;
  /** Friendly error when the whole base is unusable. */
  fatal: string | null;
  version: string;
}

export const REQUIRED_FIELDS = [
  "id_trecho", "origem_id", "destino_id", "distancia_m", "IAR", "faixa_IAR",
  "score_recursos", "score_seguranca", "score_avaliacao", "qtd_avaliacoes",
  "qtd_ocorrencias", "qtd_ocorrencias_ativas", "penalidade_ocorrencias",
  "penalidade_obstaculos", "custo_recomendacao", "confianca_dados",
] as const;

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isIntLike = (v: unknown): v is number => isNum(v) && Number.isInteger(v);

/** Simple deterministic hash used as dataset version (cache invalidation). */
export function hashText(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

export function auditBase(input: unknown): AuditResult {
  const version = hashText(JSON.stringify(input ?? null));
  if (!Array.isArray(input)) {
    return { ok: false, valid: [], invalid: [], total: 0, version,
      fatal: "O arquivo da base não está no formato esperado (lista de trechos)." };
  }
  const valid: RawTrecho[] = [];
  const invalid: InvalidRecord[] = [];
  const seen = new Set<number>();

  input.forEach((rec, index) => {
    const reasons: string[] = [];
    if (rec === null || typeof rec !== "object" || Array.isArray(rec)) {
      invalid.push({ id: `#${index}`, index, reasons: ["registro não é um objeto"] });
      return;
    }
    const r = rec as Record<string, unknown>;
    for (const f of REQUIRED_FIELDS) {
      if (!(f in r)) reasons.push(`campo ausente: ${f}`);
      else if (r[f] === null || r[f] === undefined) reasons.push(`campo nulo: ${f}`);
    }
    const chk = (f: string, ok: boolean, msg: string) => {
      if (f in r && r[f] !== null && r[f] !== undefined && !ok) reasons.push(`${f}: ${msg}`);
    };
    for (const f of ["id_trecho", "origem_id", "destino_id"]) {
      chk(f, isIntLike(r[f]) && (r[f] as number) > 0, "ID deve ser inteiro positivo");
    }
    chk("distancia_m", isNum(r["distancia_m"]) && r["distancia_m"] > 0, "distância deve ser número finito maior que zero");
    chk("custo_recomendacao", isNum(r["custo_recomendacao"]) && r["custo_recomendacao"] >= 0, "custo deve ser número finito não negativo");
    for (const f of ["IAR", "score_recursos", "score_seguranca", "score_avaliacao"]) {
      chk(f, isNum(r[f]) && (r[f] as number) >= 0 && (r[f] as number) <= 100, "deve estar entre 0 e 100");
    }
    for (const f of ["qtd_avaliacoes", "qtd_ocorrencias", "qtd_ocorrencias_ativas"]) {
      chk(f, isIntLike(r[f]) && (r[f] as number) >= 0, "contagem deve ser inteira e não negativa");
    }
    for (const f of ["penalidade_ocorrencias", "penalidade_obstaculos"]) {
      chk(f, isNum(r[f]) && (r[f] as number) >= 0, "penalidade deve ser número finito não negativo");
    }
    for (const f of ["faixa_IAR", "confianca_dados"]) chk(f, typeof r[f] === "string", "deve ser texto");
    if (isIntLike(r["qtd_ocorrencias"]) && isIntLike(r["qtd_ocorrencias_ativas"]) && r["qtd_ocorrencias_ativas"] > r["qtd_ocorrencias"]) {
      reasons.push("qtd_ocorrencias_ativas maior que qtd_ocorrencias");
    }
    if (isIntLike(r["id_trecho"])) {
      if (seen.has(r["id_trecho"])) reasons.push("id_trecho duplicado");
      seen.add(r["id_trecho"]);
    }
    const id = isIntLike(r["id_trecho"]) ? String(r["id_trecho"]) : `#${index}`;
    if (reasons.length) invalid.push({ id, index, reasons });
    else valid.push(r as unknown as RawTrecho);
  });

  const fatal = valid.length === 0
    ? "Nenhum trecho válido foi encontrado na base. Verifique o arquivo exportado."
    : null;
  return { ok: !fatal, valid, invalid, total: input.length, fatal, version };
}
