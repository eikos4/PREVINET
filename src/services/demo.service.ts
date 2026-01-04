import { db } from "../offline/db";
import { logout } from "../modules/auth/auth.service";
import type { User } from "../modules/auth/auth.service";
import { normalizeRole } from "../modules/auth/auth.service";
import type { Empresa } from "../modules/empresas/empresas.service";
import type { Obra } from "../modules/obras/obras.service";
import type { Worker } from "../modules/workers/worker.service";
import type { ART } from "../modules/art/art.service";
import type { IRL } from "../modules/irl/irl.service";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function existingStoreSet() {
  return new Set(db.tables.map((t) => t.name));
}

async function clearStores(names: string[]) {
  const exist = existingStoreSet();
  const toUse = names.filter((n) => exist.has(n));
  if (toUse.length === 0) return;
  const tables = toUse.map((n) => db.table(n));
  await db.transaction("rw", tables as any, async () => {
    for (const n of toUse) {
      await db.table(n).clear();
    }
  });
}

async function runTxn<T>(names: string[], fn: (has: (n: string) => boolean) => Promise<T>) {
  const exist = existingStoreSet();
  const toUse = names.filter((n) => exist.has(n));
  const has = (n: string) => exist.has(n);
  if (toUse.length === 0) return await fn(has);
  const tables = toUse.map((n) => db.table(n));
  return await db.transaction("rw", tables as any, async () => {
    return await fn(has);
  });
}

export async function loadDemoData(): Promise<void> {
  // Garantiza apertura/upgrade del schema antes de transaccionar
  try { await db.open(); } catch { }
  const CURRENT_USER_KEY = "currentUserId";
  const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
  const currentUser = currentUserId
    ? ((await db.table<User>("users").get(currentUserId)) as User | undefined)
    : undefined;

  // Limpieza en grupos (solo stores existentes)
  await clearStores(["users", "workers"]);
  await clearStores(["empresas", "obras"]);
  await clearStores(["templates"]);
  await clearStores(["art", "reports"]);
  await clearStores(["irl", "talks"]);
  await clearStores(["fitForWork"]);
  await clearStores(["findingIncidents", "documents"]);
  await clearStores(["evidences", "syncQueue"]);
  await clearStores(["irlSignedPdfs", "artSignedPdfs"]);
  await clearStores(["talkSignedPdfs", "fitForWorkSignedPdfs"]);
  await clearStores(["documentSignedPdfs"]);
  await clearStores(["templateSignedPdfs", "workerEnrollmentSignedPdfs"]);

  // Reinsertar superadmin actual (si existía) para mantener sesión
  if (currentUser && normalizeRole(currentUser.role) === "superadmin") {
    await db.table("users").put(currentUser);
  }

  // ===== Inserción de datos DEMO: Empresa A (Norte) =====
  await runTxn(["empresas", "obras", "users", "workers", "art", "irl", "talks", "documents", "fitForWork"], async (has) => {
    // 1. Empresa y Obra A
    const empIdA = "demo-empresa-A";
    const empNombreA = "Constructora Norte SpA";
    const empRutA = "76111111-1";

    if (has("empresas")) {
      await db.table<Empresa>("empresas").put({
        id: empIdA,
        nombreRazonSocial: empNombreA,
        rut: empRutA,
        tipo: "mandante",
        giro: "Construcción Civil",
        estado: "activa",
        creadoEn: new Date(),
      });
    }

    const obraIdA = "demo-obra-A";
    const obraNombreA = "Edificio Central";
    if (has("obras")) {
      await db.table<Obra>("obras").put({
        id: obraIdA,
        nombre: obraNombreA,
        estado: "activa",
        creadoEn: new Date(),
        empresaId: empIdA,
      });
    }

    // 2. Usuarios y Trabajadores A
    const prevIdA = "demo-prev-A";
    if (has("users")) {
      await db.table<User>("users").put({
        id: prevIdA,
        name: "Prevencionista Norte",
        pin: "4001",
        role: "prevencionista",
        companyName: empNombreA,
        companyRut: empRutA,
        companyId: empIdA,
        creadoEn: new Date(),
      });
    }

    const w1Id = "demo-worker-A1";
    const w2Id = "demo-worker-A2";

    if (has("workers")) {
      await db.table<Worker>("workers").bulkPut([
        {
          id: w1Id,
          creadoEn: new Date(),
          nombre: "Juan Pérez (Norte)",
          rut: "10111111-1",
          cargo: "Maestro Mayor",
          obra: obraNombreA,
          empresaNombre: empNombreA,
          empresaRut: empRutA,
          telefono: "+56 9 1111 0001",
          pin: "5001",
          habilitado: true,
        },
        {
          id: w2Id,
          creadoEn: new Date(),
          nombre: "Pedro González (Norte)",
          rut: "10222222-2",
          cargo: "Jornal",
          obra: obraNombreA,
          empresaNombre: empNombreA,
          empresaRut: empRutA,
          telefono: "+56 9 1111 0002",
          pin: "5002",
          habilitado: true,
        }
      ]);
    }

    if (has("users")) {
      await db.table<User>("users").bulkPut([
        {
          id: "user-wA1",
          name: "Juan Pérez (Norte)",
          pin: "5001",
          role: "trabajador",
          workerId: w1Id,
          companyId: empIdA,
          creadoEn: new Date(),
        },
        {
          id: "user-wA2",
          name: "Pedro González (Norte)",
          pin: "5002",
          role: "trabajador",
          workerId: w2Id,
          companyId: empIdA,
          creadoEn: new Date(),
        }
      ]);
    }

    // 3. Recursos (ART, IRL, Chats) A
    if (has("art")) {
      await db.table<ART>("art").put({
        id: "demo-art-A1",
        obra: obraNombreA,
        fecha: todayDate(),
        trabajadores: [w1Id, w2Id],
        asignados: [
          { workerId: w1Id, token: "tok-art-A1" },
          { workerId: w2Id, token: "tok-art-A2" },
        ],
        riesgos: "Caída a distinto nivel (Norte)",
        cerrado: false,
        creadoPorUserId: prevIdA,
        creadoEn: new Date(),
      });
    }
  });

  // ===== Inserción de datos DEMO: Empresa B (Sur) =====
  await runTxn(["empresas", "obras", "users", "workers", "art", "irl", "talks", "documents", "fitForWork"], async (has) => {
    // 1. Empresa y Obra B
    const empIdB = "demo-empresa-B";
    const empNombreB = "Ingeniería Sur Ltda";
    const empRutB = "76222222-2";

    if (has("empresas")) {
      await db.table<Empresa>("empresas").put({
        id: empIdB,
        nombreRazonSocial: empNombreB,
        rut: empRutB,
        tipo: "subcontratista",
        giro: "Montaje Industrial",
        estado: "activa",
        creadoEn: new Date(),
      });
    }

    const obraIdB = "demo-obra-B";
    const obraNombreB = "Planta Solar Sur";
    if (has("obras")) {
      await db.table<Obra>("obras").put({
        id: obraIdB,
        nombre: obraNombreB,
        estado: "activa",
        creadoEn: new Date(),
        empresaId: empIdB,
      });
    }

    // 2. Usuarios y Trabajadores B
    const prevIdB = "demo-prev-B";
    if (has("users")) {
      await db.table<User>("users").put({
        id: prevIdB,
        name: "Prevencionista Sur",
        pin: "4002",
        role: "prevencionista",
        companyName: empNombreB,
        companyRut: empRutB,
        companyId: empIdB,
        creadoEn: new Date(),
      });
    }

    const w1Id = "demo-worker-B1";
    const w2Id = "demo-worker-B2";

    if (has("workers")) {
      await db.table<Worker>("workers").bulkPut([
        {
          id: w1Id,
          creadoEn: new Date(),
          nombre: "Ana Silva (Sur)",
          rut: "20111111-1",
          cargo: "Soldador",
          obra: obraNombreB,
          empresaNombre: empNombreB,
          empresaRut: empRutB,
          telefono: "+56 9 2222 0001",
          pin: "6001",
          habilitado: true,
        },
        {
          id: w2Id,
          creadoEn: new Date(),
          nombre: "Carlos Ruiz (Sur)",
          rut: "20222222-2",
          cargo: "Eléctrico",
          obra: obraNombreB,
          empresaNombre: empNombreB,
          empresaRut: empRutB,
          telefono: "+56 9 2222 0002",
          pin: "6002",
          habilitado: true,
        }
      ]);
    }

    if (has("users")) {
      await db.table<User>("users").bulkPut([
        {
          id: "user-wB1",
          name: "Ana Silva (Sur)",
          pin: "6001",
          role: "trabajador",
          workerId: w1Id,
          companyId: empIdB,
          creadoEn: new Date(),
        },
        {
          id: "user-wB2",
          name: "Carlos Ruiz (Sur)",
          pin: "6002",
          role: "trabajador",
          workerId: w2Id,
          companyId: empIdB,
          creadoEn: new Date(),
        }
      ]);
    }

    // 3. Recursos (ART, IRL, Chats) B
    if (has("irl")) {
      await db.table<IRL>("irl").put({
        id: "demo-irl-B1",
        obra: obraNombreB,
        fecha: todayDate(),
        titulo: "Protocolo Eléctrico (Sur)",
        descripcion: "Normas de seguridad para trabajos en alta tensión",
        estado: "PUBLICADO",
        asignados: [
          { workerId: w2Id, token: "tok-irl-B2" } // Solo al electrico
        ],
        creadoPorUserId: prevIdB,
        creadoEn: new Date(),
      });
    }
  });

  // 🔄 Trigger Cloud Sync immediately for the demo data
  const { addToSyncQueue } = await import("./sync.service");
  await addToSyncQueue("full_sync");
}

export async function resetDemoData(): Promise<void> {
  try { await db.open(); } catch { }
  // Borrar todo y cerrar sesión en grupos (solo stores existentes)
  await clearStores(["users", "workers", "empresas", "obras", "templates"]);
  await clearStores(["art", "reports", "irl", "talks", "fitForWork"]);
  await clearStores(["findingIncidents", "documents", "evidences", "syncQueue"]);
  await clearStores(["irlSignedPdfs", "artSignedPdfs", "talkSignedPdfs", "fitForWorkSignedPdfs", "documentSignedPdfs"]);
  await clearStores(["templateSignedPdfs", "workerEnrollmentSignedPdfs"]);

  // Remover sesión y dejar app limpia
  logout();
}
