import { db } from "../../offline/db";
import { addToSyncQueue } from "../../services/sync.service";
import type { ExcelTemplateData } from "../../shared/components/ExcelEditor";
import type { WordImportResult } from "../../shared/utils/word-utils";

export type TemplateFormato = "tiptap" | "excel" | "word";

export type DocumentoNaturaleza = "Entidad del sistema" | "Plantilla operativa" | "Documento de respaldo";

export type DocumentoCategoria =
  | "Gestión Preventiva Base"
  | "Identificación y Control de Riesgos"
  | "Operación en Terreno"
  | "Personas y Competencias"
  | "Emergencias"
  | "Incidentes y Mejoras"
  | "Vigilancia de la Salud"
  | "Auditoría y Mutual"
  | "Activos y Sustancias";

export const SUBTIPOS_SUGERIDOS: Record<DocumentoNaturaleza, Partial<Record<DocumentoCategoria, string[]>>> = {
  "Entidad del sistema": {
    "Gestión Preventiva Base": ["IRL"],
    "Identificación y Control de Riesgos": ["ART", "AST"],
    "Operación en Terreno": ["PTS"],
  },
  "Plantilla operativa": {
    "Gestión Preventiva Base": [
      "Matriz IPER (DS44 Art. 7)",
      "Programa de Trabajo PRL (DS44 Art. 8)",
      "Mapa de Riesgos (DS44 Art. 62)",
      "Información de Riesgos (DS44 Art. 15)",
      "Reglamento Interno HyS (DS44 Art. 56-61)",
    ],
    "Identificación y Control de Riesgos": [
      "Inspección de Seguridad",
      "Observación Conductual",
      "Checklists de Riesgos Críticos",
      "Matriz de Riesgos por Tarea",
    ],
    "Operación en Terreno": [
      "Procedimiento de Trabajo Seguro (PTS)",
      "Permiso de Trabajo",
      "AST",
      "ART",
      "Checklist Pre-uso Equipos",
      "Bloqueo y Etiquetado (LOTO)",
      "Trabajo en Altura",
      "Izaje",
      "Excavaciones",
      "Espacios Confinados",
    ],
    "Personas y Competencias": [
      "Inducción de Seguridad",
      "Charla 5 Minutos",
      "Registro de Capacitación SST",
      "Entrega EPP (DS44 Art. 12-13)",
    ],
    Emergencias: [
      "Plan de Emergencia",
      "Simulacro",
      "Plan Gestión del Riesgo de Desastres (DS44 Art. 18-19)",
      "Brigada de Emergencia",
    ],
    "Incidentes y Mejoras": [
      "Registro de Incidentes con Potencial de Daño",
      "Investigación de Accidentes/EP (DS44 Art. 71)",
      "Acción Correctiva y Preventiva",
      "Lección Aprendida",
    ],
    "Vigilancia de la Salud": ["Plan de Vigilancia", "Examen Ocupacional", "Seguimiento Caso"],
    "Auditoría y Mutual": [
      "Auditoría Interna SG-SST",
      "FUF Fiscalización DS44",
      "Acta Comité Paritario (DS44 Art. 23-49)",
      "Informe Mutual",
    ],
    "Activos y Sustancias": ["Inventario de Sustancias", "SDS/HDS", "RIOHS", "Gestión de Residuos"],
  },
  "Documento de respaldo": {
    "Gestión Preventiva Base": ["Política SST", "Organigrama SST"],
    "Personas y Competencias": ["Certificado Capacitación", "Licencia/Autorización"],
    "Vigilancia de la Salud": ["Certificado de Aptitud", "Informe Médico"],
    "Auditoría y Mutual": ["Informe Mutual", "Carta Observaciones", "Plan de Acción Mutual"],
    "Activos y Sustancias": ["Certificado Mantención", "Certificado Calibración", "Certificado Izaje"],
  },
};

export function getSubtiposSugeridos(params: {
  naturaleza: DocumentoNaturaleza;
  categoria: DocumentoCategoria;
}): string[] {
  const list = SUBTIPOS_SUGERIDOS[params.naturaleza]?.[params.categoria] || [];
  const unique = Array.from(new Set(list.map((x) => String(x || "").trim()).filter(Boolean)));
  unique.sort((a, b) => a.localeCompare(b));
  return unique;
}

export type TemplateRecord = {
  id: string;
  naturaleza: DocumentoNaturaleza;
  categoria: DocumentoCategoria;
  subtipo: string;
  nombre: string;
  contenido: any;
  formato: TemplateFormato;
  excelData?: ExcelTemplateData;
  wordData?: WordImportResult;
  creadoEn: Date;
};

export async function listTemplates(): Promise<TemplateRecord[]> {
  const rows = (await db.table("templates").toArray()) as Array<TemplateRecord | any>;
  return rows.map((r) => ({
    ...r,
    naturaleza: (r?.naturaleza as DocumentoNaturaleza) || "Entidad del sistema",
    categoria: (r?.categoria as DocumentoCategoria) || "Gestión Preventiva Base",
    subtipo: String(r?.subtipo || r?.tipo || "").trim(),
  })) as TemplateRecord[];
}

export async function createTemplate(input: {
  naturaleza: DocumentoNaturaleza;
  categoria: DocumentoCategoria;
  subtipo: string;
  nombre: string;
  formato: TemplateFormato;
  contenido?: any;
  excelData?: ExcelTemplateData;
  wordData?: WordImportResult;
}): Promise<TemplateRecord> {
  const naturaleza = input.naturaleza;
  if (!naturaleza) throw new Error("Naturaleza es obligatoria");

  const categoria = input.categoria;
  if (!categoria) throw new Error("Categoría es obligatoria");

  const subtipo = (input.subtipo || "").trim();
  if (!subtipo) throw new Error("Subtipo/Uso es obligatorio");

  const nombre = (input.nombre || "").trim();
  if (!nombre) throw new Error("Nombre de la plantilla es obligatorio");

  if (input.formato === "excel" && !input.excelData) {
    throw new Error("Debe importar o crear contenido Excel");
  }

  if (input.formato === "word" && !input.wordData) {
    throw new Error("Debe importar un archivo Word");
  }

  if (input.formato === "tiptap" && !input.contenido) {
    throw new Error("Contenido es obligatorio");
  }

  const record: TemplateRecord = {
    id: crypto.randomUUID(),
    naturaleza,
    categoria,
    subtipo,
    nombre,
    formato: input.formato,
    contenido: input.formato === "tiptap" ? input.contenido : null,
    excelData: input.formato === "excel" ? input.excelData : undefined,
    wordData: input.formato === "word" ? input.wordData : undefined,
    creadoEn: new Date(),
  };

  await db.table("templates").add(record);
  await addToSyncQueue("template");

  return record;
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.table("templates").delete(id);
  await addToSyncQueue("template");
}
