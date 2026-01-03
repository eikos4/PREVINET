import { db } from "../offline/db";
import { logout } from "../modules/auth/auth.service";
import type { User } from "../modules/auth/auth.service";
import { normalizeRole } from "../modules/auth/auth.service";
import type { Empresa } from "../modules/empresas/empresas.service";
import type { Obra } from "../modules/obras/obras.service";
import type { Worker } from "../modules/workers/worker.service";
import type { ART, ARTWorkerAssignment } from "../modules/art/art.service";
import type { IRL, IRLWorkerAssignment } from "../modules/irl/irl.service";
import type { Talk, TalkWorkerAssignment } from "../modules/talks/talk.service";
import type { DocumentRecord, DocumentWorkerAssignment } from "../modules/documents/documents.service";
import type { FitForWork, FitForWorkQuestion, FitForWorkWorkerAssignment } from "../modules/fitForWork/fitForWork.service";

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowIso(): string {
  return new Date().toISOString();
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
  try { await db.open(); } catch {}
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

  // ===== Inserción de datos DEMO =====
  // 1) Empresa, Obra, Usuarios base, Trabajadores
  await runTxn(["empresas", "obras", "users", "workers"], async (has) => {
    const empresaNombre = "Empresa Demo SpA";
    const empresaRut = "76123456-5";
    const obraNombre = "Obra Demo Central";

    if (has("empresas")) {
      const empresa: Empresa = {
        id: "demo-empresa-1",
        nombreRazonSocial: empresaNombre,
        rut: empresaRut,
        tipo: "mandante",
        giro: "Construcción",
        estado: "activa",
        creadoEn: new Date(),
      };
      await db.table("empresas").put(empresa);
    }

    if (has("obras")) {
      const obra: Obra = {
        id: "demo-obra-1",
        nombre: obraNombre,
        estado: "activa",
        creadoEn: new Date(),
        // Asociar la obra a la empresa demo
        empresaId: "demo-empresa-1",
      };
      await db.table("obras").put(obra);
    }

    if (has("users")) {
      const prevencionista: User = {
        id: "demo-prevencionista-1",
        name: "Prevencionista Demo",
        pin: "4001",
        role: "prevencionista",
        companyName: empresaNombre,
        companyRut: empresaRut,
        companyId: "demo-empresa-1",
        creadoEn: new Date(),
        nombre: "Juan Pérez", // Demo worker
        rut: "11111111-1",
        cargo: "Maestro",
        obra: obraNombre,
        empresaNombre,
        empresaRut,
        telefono: "+56 9 1111 1111",
        pin: "5001",
        habilitado: true,
      };
      const worker2: Worker = {
        id: "demo-worker-2",
        creadoEn: new Date(),
        nombre: "María López", // Demo worker
        rut: "22222222-2",
        cargo: "Ayudante",
        obra: obraNombre,
        empresaNombre,
        empresaRut,
        telefono: "+56 9 2222 2222",
        pin: "5002",
        habilitado: true,
      };
      await db.table("workers").bulkPut([worker1, worker2]);

      if (has("users")) {
        const userW1: User = {
          id: "demo-user-worker-1",
          name: worker1.nombre,
          pin: worker1.pin,
          role: "trabajador",
          workerId: worker1.id,
          companyId: "demo-empresa-1",
          creadoEn: new Date(),
        };
        const userW2: User = {
          id: "demo-user-worker-2",
          name: worker2.nombre,
          pin: worker2.pin,
          role: "trabajador",
          workerId: worker2.id,
          companyId: "demo-empresa-1",
          creadoEn: new Date(),
        };
        await db.table("users").bulkPut([userW1, userW2]);
      }
    }
  });

  // 2) ART e IRL
  await runTxn(["art", "irl", "users", "workers"], async (has) => {
    const obraNombre = "Obra Demo Central";
    const prevencionista = has("users")
      ? ((await db.table<User>("users").get("demo-prevencionista-1")) as User | undefined)
      : undefined;
    const worker1 = has("workers")
      ? ((await db.table<Worker>("workers").get("demo-worker-1")) as Worker | undefined)
      : undefined;
    const worker2 = has("workers")
      ? ((await db.table<Worker>("workers").get("demo-worker-2")) as Worker | undefined)
      : undefined;

    if (has("art")) {
      const artAsignados: ARTWorkerAssignment[] = [
        ...(worker1 ? [{ workerId: worker1.id, token: "tok-art-w1" }] : []),
        ...(worker2 ? [{ workerId: worker2.id, token: "tok-art-w2" }] : []),
      ];
      const art: ART = {
        id: "demo-art-1",
        obra: obraNombre,
        fecha: todayDate(),
        trabajadores: [worker1?.id, worker2?.id].filter(Boolean) as string[],
        asignados: artAsignados,
        riesgos: "Trabajo en altura, uso de arnés",
        cerrado: false,
        creadoPorUserId: prevencionista?.id,
        creadoEn: new Date(),
      };
      await db.table("art").put(art);
    }

    if (has("irl")) {
      const irlAsignados: IRLWorkerAssignment[] = [
        ...(worker1 ? [{ workerId: worker1.id, token: "tok-irl-w1" }] : []),
        ...(worker2 ? [{ workerId: worker2.id, token: "tok-irl-w2" }] : []),
      ];
      const irl: IRL = {
        id: "demo-irl-1",
        obra: obraNombre,
        fecha: todayDate(),
        titulo: "IRL - Instrucciones de Seguridad Demo",
        descripcion: "Indicaciones básicas de seguridad para la faena demo.",
        estado: "PUBLICADO",
        asignados: irlAsignados,
        creadoPorUserId: prevencionista?.id,
        creadoEn: new Date(),
      };
      await db.table("irl").put(irl);
    }
  });

  // 3) Charlas y Documentos
  await runTxn(["talks", "documents", "users", "workers"], async (has) => {
    const obraNombre = "Obra Demo Central";
    const prevencionista = has("users")
      ? ((await db.table<User>("users").get("demo-prevencionista-1")) as User | undefined)
      : undefined;
    const worker1 = has("workers")
      ? ((await db.table<Worker>("workers").get("demo-worker-1")) as Worker | undefined)
      : undefined;
    const worker2 = has("workers")
      ? ((await db.table<Worker>("workers").get("demo-worker-2")) as Worker | undefined)
      : undefined;

    if (has("talks")) {
      const talkAsignados: TalkWorkerAssignment[] = [
        ...(worker1 ? [{ workerId: worker1.id, token: "tok-talk-w1" }] : []),
        ...(worker2 ? [{ workerId: worker2.id, token: "tok-talk-w2" }] : []),
      ];
      const talk: Talk = {
        id: "demo-talk-1",
        tema: "Uso de EPP y orden",
        obra: obraNombre,
        fechaHora: nowIso(),
        estado: "PUBLICADO",
        asignados: talkAsignados,
        creadoPorUserId: prevencionista?.id,
        creadoEn: new Date(),
      };
      await db.table("talks").put(talk);
    }

    if (has("documents")) {
      const docAsignados: DocumentWorkerAssignment[] = [
        ...(worker1 ? [{ workerId: worker1.id, token: "tok-doc-w1" }] : []),
      ];
      const document: DocumentRecord = {
        id: "demo-doc-1",
        obra: obraNombre,
        fecha: todayDate(),
        titulo: "Reglamento Interno Demo",
        descripcion: "Documento de referencia para la obra demo.",
        categoria: "Reglamento",
        estado: "PUBLICADO",
        asignados: docAsignados,
        attachment: {
          fileName: "reglamento_demo.txt",
          mimeType: "text/plain",
          blob: new Blob(["Documento de demo"], { type: "text/plain" }),
        },
        creadoPorUserId: prevencionista?.id,
        creadoEn: new Date(),
      };
      await db.table("documents").put(document);
    }
  });

  // 4) Fit-for-Work
  await runTxn(["fitForWork", "users", "workers"], async (has) => {
    if (!has("fitForWork")) return;
    const obraNombre = "Obra Demo Central";
    const prevencionista = (await db.table<User>("users").get("demo-prevencionista-1")) as
      | User
      | undefined;
    const worker1 = (await db.table<Worker>("workers").get("demo-worker-1")) as
      | Worker
      | undefined;
    const worker2 = (await db.table<Worker>("workers").get("demo-worker-2")) as
      | Worker
      | undefined;

    const fQuestions: FitForWorkQuestion[] = [
      { id: "q1", question: "¿Te sientes en buen estado de salud?" },
      { id: "q2", question: "¿Has descansado adecuadamente (mínimo 6 horas)?" },
      { id: "q3", question: "¿Estás libre de alcohol y drogas?" },
      { id: "q4", question: "¿Estás libre de lesiones o dolores?" },
      { id: "q5", question: "¿Estás mentalmente preparado para trabajar?" },
    ];
    const fitAsignados: FitForWorkWorkerAssignment[] = [
      ...(worker1 ? [{ workerId: worker1.id, token: "tok-fit-w1" }] : []),
      ...(worker2 ? [{ workerId: worker2.id, token: "tok-fit-w2" }] : []),
    ];
    const fit: FitForWork = {
      id: "demo-fit-1",
      fecha: todayDate(),
      turno: "mañana",
      obra: obraNombre,
      estado: "PUBLICADO",
      questions: fQuestions,
      asignados: fitAsignados,
      creadoPorUserId: prevencionista?.id,
      creadoEn: new Date(),
    };
    await db.table("fitForWork").put(fit);
  });
}

export async function resetDemoData(): Promise<void> {
  try { await db.open(); } catch {}
  // Borrar todo y cerrar sesión en grupos (solo stores existentes)
  await clearStores(["users", "workers", "empresas", "obras", "templates"]);
  await clearStores(["art", "reports", "irl", "talks", "fitForWork"]);
  await clearStores(["findingIncidents", "documents", "evidences", "syncQueue"]);
  await clearStores(["irlSignedPdfs", "artSignedPdfs", "talkSignedPdfs", "fitForWorkSignedPdfs", "documentSignedPdfs"]);
  await clearStores(["templateSignedPdfs", "workerEnrollmentSignedPdfs"]);

  // Remover sesión y dejar app limpia
  logout();
}
