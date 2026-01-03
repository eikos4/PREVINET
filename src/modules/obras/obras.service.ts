import { db } from "../../offline/db";
import { addToSyncQueue } from "../../services/sync.service";

export type EstadoObra = "activa" | "inactiva";

export type Obra = {
  id: string;
  nombre: string;
  estado: EstadoObra;
  creadoEn: Date;
  empresaId?: string | null;
};

function normalizeNombre(nombre: string): string {
  return (nombre || "").trim();
}

export async function listObras(): Promise<Obra[]> {
  return (await db.table("obras").toArray()) as Obra[];
}

export async function createObra(input: {
  nombre: string;
  estado?: EstadoObra;
  empresaId?: string | null;
}): Promise<Obra> {
  const nombre = normalizeNombre(input.nombre);
  if (!nombre) throw new Error("Nombre de la obra es obligatorio");

  const existing = ((await db.table("obras").toArray()) as Obra[]).find(
    (o) => (o.nombre || "").trim().toLowerCase() === nombre.toLowerCase()
  );
  if (existing) throw new Error("Ya existe una obra con este nombre");

  const estado: EstadoObra = input.estado ?? "activa";
  if (estado !== "activa" && estado !== "inactiva") throw new Error("Estado inválido");

  const obra: Obra = {
    id: crypto.randomUUID(),
    nombre,
    estado,
    creadoEn: new Date(),
    empresaId: input.empresaId ?? null,
  };

  await db.table("obras").add(obra);
  await addToSyncQueue("obra");

  return obra;
}

export async function updateObra(
  id: string,
  patch: { nombre?: string; estado?: EstadoObra; empresaId?: string | null }
): Promise<void> {
  const existing = (await db.table("obras").get(id)) as Obra | undefined;
  if (!existing) throw new Error("Obra no encontrada");

  const nextNombre = normalizeNombre(patch.nombre ?? existing.nombre);
  if (!nextNombre) throw new Error("Nombre de la obra es obligatorio");

  const nextEstado: EstadoObra = (patch.estado ?? existing.estado ?? "activa") as EstadoObra;
  if (nextEstado !== "activa" && nextEstado !== "inactiva") throw new Error("Estado inválido");

  if (nextNombre.toLowerCase() !== (existing.nombre || "").trim().toLowerCase()) {
    const all = (await db.table("obras").toArray()) as Obra[];
    const other = all.find((o) => (o.nombre || "").trim().toLowerCase() === nextNombre.toLowerCase());
    if (other) throw new Error("Ya existe una obra con este nombre");
  }

  await db.table("obras").update(id, { nombre: nextNombre, estado: nextEstado, empresaId: patch.empresaId ?? existing.empresaId ?? null });
  await addToSyncQueue("obra");
}

export async function deleteObra(id: string): Promise<void> {
  await db.table("obras").delete(id);
  await addToSyncQueue("obra");
}
