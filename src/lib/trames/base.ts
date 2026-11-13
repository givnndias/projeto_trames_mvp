// Default dataset (Data Science export) + audit.
import raw from "@/data/trames_base_integracao.json";
import { auditBase } from "./audit";

export const DEFAULT_BASE: unknown = raw;
export const DEFAULT_AUDIT = auditBase(raw);
export const BASE_LABEL = "trames_base_integracao.json (exportação de Data Science)";
