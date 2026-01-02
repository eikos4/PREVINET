import { db } from "../../offline/db";
import { addToSyncQueue } from "../../services/sync.service";

export type TipoEmpresa = "mandante" | "contratista" | "subcontratista" | "proveedor_servicio" | "sub_contrato";

export type EstadoEmpresa = "activa" | "inactiva";

export type Empresa = {
  id: string;
  nombreRazonSocial: string;
  rut: string;
  tipo: TipoEmpresa;
  clasificacion?: "grande_constructora" | "independiente";
  giro: string;
  estado: EstadoEmpresa;
  creadoEn: Date;
};

function cleanRut(rut: string): string {
  return (rut || "").replace(/[^0-9kK]/g, "").toUpperCase();
}

function normalizeTipoEmpresa(tipo: string): TipoEmpresa {
  if (tipo === "sub_contrato") return "subcontratista";
  if (tipo === "mandante" || tipo === "contratista" || tipo === "subcontratista" || tipo === "proveedor_servicio") return tipo;
  return "mandante";
}

export function validateRut(rut: string): boolean {
  const clean = cleanRut(rut);
  if (clean.length < 2) return false;

  const number = clean.slice(0, -1);
  const dv = clean.slice(-1);

  if (!/^[0-9]+$/.test(number)) return false;
  if (!/^[0-9K]$/.test(dv)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = number.length - 1; i >= 0; i--) {
    sum += parseInt(number[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? "0" : expectedDv === 10 ? "K" : expectedDv.toString();

  return calculatedDv === dv;
}

export async function listEmpresas(companyRut?: string): Promise<Empresa[]> {
  const all = (await db.table("empresas").toArray()) as Empresa[];
  if (companyRut) {
    const target = cleanRut(companyRut);
    return all.filter((e) => e.rut === target);
  }
  return all;
}

export async function createEmpresa(input: {
  nombreRazonSocial: string;
  rut: string;
  tipo: TipoEmpresa;
  clasificacion?: "grande_constructora" | "independiente";
  giro: string;
  estado: EstadoEmpresa;
}): Promise<Empresa> {
  const nombre = input.nombreRazonSocial.trim();
  if (!nombre) throw new Error("Nombre/Razón Social es obligatorio");

  const giro = (input.giro || "").trim();
  if (!giro) throw new Error("Giro es obligatorio");

  const estado = input.estado;
  if (estado !== "activa" && estado !== "inactiva") {
    throw new Error("Estado inválido");
  }

  const rutClean = cleanRut(input.rut);
  if (!rutClean) throw new Error("RUT es obligatorio");

  const existing = await db.table("empresas").where("rut").equals(rutClean).first();
  if (existing) throw new Error("Ya existe una empresa con este RUT");

  const empresa: Empresa = {
    id: crypto.randomUUID(),
    nombreRazonSocial: nombre,
    rut: rutClean,
    tipo: normalizeTipoEmpresa(input.tipo),
    clasificacion: input.clasificacion ?? "independiente",
    giro,
    estado,
    creadoEn: new Date(),
  };

  await db.table("empresas").add(empresa);
  await addToSyncQueue("empresa");

  return empresa;
}

export async function updateEmpresa(id: string, patch: {
  nombreRazonSocial?: string;
  rut?: string;
  tipo?: TipoEmpresa;
  clasificacion?: "grande_constructora" | "independiente";
  giro?: string;
  estado?: EstadoEmpresa;
}): Promise<void> {
  const existing = (await db.table("empresas").get(id)) as Empresa | undefined;
  if (!existing) throw new Error("Empresa no encontrada");

  const nextNombre = (patch.nombreRazonSocial ?? existing.nombreRazonSocial).trim();
  if (!nextNombre) throw new Error("Nombre/Razón Social es obligatorio");

  const nextRut = patch.rut !== undefined ? cleanRut(patch.rut) : existing.rut;
  if (!nextRut) throw new Error("RUT es obligatorio");

  if (nextRut !== existing.rut) {
    const other = await db.table("empresas").where("rut").equals(nextRut).first();
    if (other) throw new Error("Ya existe una empresa con este RUT");
  }

  const nextTipo = normalizeTipoEmpresa(patch.tipo ?? existing.tipo);

  const nextGiro = (patch.giro ?? existing.giro ?? "").trim();
  if (!nextGiro) throw new Error("Giro es obligatorio");

  const nextEstado = patch.estado ?? existing.estado ?? "activa";
  if (nextEstado !== "activa" && nextEstado !== "inactiva") {
    throw new Error("Estado inválido");
  }

  await db.table("empresas").update(id, {
    nombreRazonSocial: nextNombre,
    rut: nextRut,
    tipo: nextTipo,
    clasificacion: patch.clasificacion ?? existing.clasificacion ?? "independiente",
    giro: nextGiro,
    estado: nextEstado,
  });

  await addToSyncQueue("empresa");
}

export async function deleteEmpresa(id: string): Promise<void> {
  await db.table("empresas").delete(id);
  await addToSyncQueue("empresa");
}
