import { db } from "../offline/db";
import { logout } from "../modules/auth/auth.service";
import type { User } from "../modules/auth/auth.service";
import { normalizeRole } from "../modules/auth/auth.service";
import type { Empresa } from "../modules/empresas/empresas.service";
import type { Obra } from "../modules/obras/obras.service";
import type { Worker } from "../modules/workers/worker.service";
import { addToSyncQueue } from "./sync.service";

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

export async function loadDemoData(): Promise<void> {
  // Garantiza apertura/upgrade del schema antes de transaccionar
  try { await db.open(); } catch { }
  const CURRENT_USER_KEY = "currentUserId";
  const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
  const currentUser = currentUserId
    ? ((await db.table<User>("users").get(currentUserId)) as User | undefined)
    : undefined;

  // Limpieza total
  const allStores = [
    "users", "workers", "empresas", "obras", "templates",
    "art", "reports", "irl", "talks", "fitForWork",
    "findingIncidents", "documents", "evidences", "syncQueue",
    "irlSignedPdfs", "artSignedPdfs", "talkSignedPdfs",
    "fitForWorkSignedPdfs", "documentSignedPdfs",
    "templateSignedPdfs", "workerEnrollmentSignedPdfs",
    "notifications"
  ];
  await clearStores(allStores);

  // Reinsertar superadmin actual (si existía) para mantener sesión
  if (currentUser && normalizeRole(currentUser.role) === "superadmin") {
    await db.table("users").put(currentUser);
  }

  // IDs Compartidos
  const empIdA = "5530f68d-4e9f-4f6e-9860-29daea69581a";
  const empNombreA = "Constructora Norte SpA";
  const empRutA = "76111111-1";

  const obraIdA = "ada41708-4680-4965-a8c7-4384a6b23a7e";
  const obraNombreA = "Edificio Central";

  const w1Id = "0672e096-748f-4d91-88df-6799cc974b78"; // Juan
  const w2Id = "3939e6a0-532b-42f0-a083-2070e6086f68"; // Pedro
  const w3Id = "c8112d35-3738-4e89-8dcb-c920fcaebf3e"; // Ana

  // 1. EMPRESAS Y OBRAS
  await db.table<Empresa>("empresas").bulkPut([
    {
      id: empIdA,
      nombreRazonSocial: empNombreA,
      rut: empRutA,
      tipo: "mandante",
      giro: "Construcción Civil",
      estado: "activa",
      creadoEn: new Date(),
    },
    {
      id: "d2be7308-3066-4180-863a-234b3f09041a",
      nombreRazonSocial: "Ingeniería Sur Ltda",
      rut: "76222222-2",
      tipo: "subcontratista",
      giro: "Montaje Industrial",
      estado: "activa",
      creadoEn: new Date(),
    }
  ]);

  await db.table<Obra>("obras").bulkPut([
    {
      id: obraIdA,
      nombre: obraNombreA,
      estado: "activa",
      creadoEn: new Date(),
      empresaId: empIdA,
    },
    {
      id: "c3098675-9b16-4af5-b44c-35cd77874bd0",
      nombre: "Planta Solar Sur",
      estado: "activa",
      creadoEn: new Date(),
      empresaId: "d2be7308-3066-4180-863a-234b3f09041a",
    }
  ]);

  // 2. USUARIOS DE ADMINISTRACIÓN (Constructora Norte)
  await db.table<User>("users").bulkPut([
    {
      id: "u-admin-norte",
      name: "Admin Empresa Norte",
      pin: "1001",
      role: "administrador",
      companyName: empNombreA,
      companyRut: empRutA,
      companyId: empIdA,
      creadoEn: new Date(),
    },
    {
      id: "u-auditor-norte",
      name: "Auditor Externo Norte",
      pin: "2001",
      role: "auditor",
      companyName: empNombreA,
      companyRut: empRutA,
      companyId: empIdA,
      creadoEn: new Date(),
    },
    {
      id: "u-supervisor-norte",
      name: "Supervisor de Terreno",
      pin: "3001",
      role: "supervisor",
      companyName: empNombreA,
      companyRut: empRutA,
      companyId: empIdA,
      creadoEn: new Date(),
    },
    {
      id: "u-prev-norte",
      name: "Prevencionista Norte",
      pin: "4001",
      role: "prevencionista",
      companyName: empNombreA,
      companyRut: empRutA,
      companyId: empIdA,
      creadoEn: new Date(),
    }
  ]);

  // 3. TRABAJADORES Y SUS USUARIOS
  await db.table<Worker>("workers").bulkPut([
    {
      id: w1Id,
      creadoEn: new Date(),
      nombre: "Juan Pérez",
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
      nombre: "Pedro González",
      rut: "10222222-2",
      cargo: "Jornal",
      obra: obraNombreA,
      empresaNombre: empNombreA,
      empresaRut: empRutA,
      telefono: "+56 9 1111 0002",
      pin: "5002",
      habilitado: true,
    },
    {
      id: w3Id,
      creadoEn: new Date(),
      nombre: "Ana Silva",
      rut: "20111111-1",
      cargo: "Soldador",
      obra: obraNombreA,
      empresaNombre: empNombreA,
      empresaRut: empRutA,
      telefono: "+56 9 2222 0001",
      pin: "6001",
      habilitado: true,
    }
  ]);

  await db.table<User>("users").bulkPut([
    {
      id: "u-w1",
      name: "Juan Pérez",
      pin: "5001",
      role: "trabajador",
      workerId: w1Id,
      companyId: empIdA,
      creadoEn: new Date(),
    },
    {
      id: "u-w2",
      name: "Pedro González",
      pin: "5002",
      role: "trabajador",
      workerId: w2Id,
      companyId: empIdA,
      creadoEn: new Date(),
    },
    {
      id: "u-w3",
      name: "Ana Silva",
      pin: "6001",
      role: "trabajador",
      workerId: w3Id,
      companyId: empIdA,
      creadoEn: new Date(),
    }
  ]);

  // 4. MÓDULOS OPERATIVOS

  // A. ART (Análisis de Riesgo)
  await db.table("art").bulkPut([
    {
      id: "art-1",
      obra: obraNombreA,
      fecha: todayDate(),
      riesgos: "Trabajos en altura y manejo de cargas",
      cerrado: false,
      creadoPorUserId: "u-prev-norte",
      creadoEn: new Date(),
      trabajadores: [w1Id, w2Id, w3Id],
      asignados: [
        { workerId: w1Id, token: "tok-art-1-w1" },
        { workerId: w2Id, token: "tok-art-1-w2" },
        { workerId: w3Id, token: "tok-art-1-w3" },
      ]
    },
    {
      id: "art-2",
      obra: obraNombreA,
      fecha: todayDate(),
      riesgos: "Excavación y movimiento de tierra",
      cerrado: true,
      creadoPorUserId: "u-prev-norte",
      creadoEn: new Date(Date.now() - 86400000), // Ayer
      trabajadores: [w1Id],
      asignados: [
        {
          workerId: w1Id,
          token: "tok-art-2-w1",
          firmadoPorNombre: "Juan Pérez",
          firmadoPorRut: "10111111-1",
          firmadoEn: new Date()
        }
      ]
    }
  ]);

  // B. Charlas (Talks)
  await db.table("talks").bulkPut([
    {
      id: "talk-1",
      tema: "Uso correcto de EPP y protección auditiva",
      obra: obraNombreA,
      fechaHora: new Date().toISOString(),
      estado: "PUBLICADO",
      creadoEn: new Date(),
      creadoPorUserId: "u-prev-norte",
      asignados: [
        { workerId: w1Id, token: "tok-talk-1-w1" },
        { workerId: w2Id, token: "tok-talk-1-w2" },
        { workerId: w3Id, token: "tok-talk-1-w3" }
      ]
    }
  ]);

  // C. Fit-for-Work (Aptitud Diaria)
  await db.table("fitForWork").bulkPut([
    {
      id: "ffw-1",
      fecha: todayDate(),
      turno: "mañana",
      obra: obraNombreA,
      estado: "PUBLICADO",
      creadoEn: new Date(),
      questions: [
        { id: "q1", question: "¿Te sientes en buen estado de salud?" },
        { id: "q2", question: "¿Has descansado adecuadamente?" },
        { id: "q3", question: "¿Estás libre de alcohol y drogas?" }
      ],
      asignados: [
        { workerId: w1Id, token: "tok-ffw-1-w1" },
        {
          workerId: w2Id,
          token: "tok-ffw-1-w2",
          apto: false, // PEDRO NO ESTÁ APTO (para mostrar alerta en dashboard)
          firmadoEn: new Date(),
          firmadoPorNombre: "Pedro González",
          firmadoPorRut: "10222222-2",
          responses: [
            { id: "q1", question: "¿Te sientes en buen estado de salud?", response: false },
            { id: "q2", question: "¿Has descansado adecuadamente?", response: true },
            { id: "q3", question: "¿Estás libre de alcohol y drogas?", response: true }
          ]
        }
      ]
    }
  ]);

  // D. IRL (Protocolos Informativos)
  await db.table("irl").bulkPut([
    {
      id: "irl-1",
      titulo: "Protocolo de Seguridad en Soldadura",
      descripcion: "Medidas preventivas para evitar quemaduras y proyecciones.",
      obra: obraNombreA,
      fecha: todayDate(),
      estado: "PUBLICADO",
      creadoEn: new Date(),
      creadoPorUserId: "u-prev-norte",
      asignados: [
        { workerId: w3Id, token: "tok-irl-1-w3" }
      ]
    }
  ]);

  // E. Hallazgos e Incidentes (Findings)
  await db.table("findingIncidents").bulkPut([
    {
      id: "find-1",
      tipo: "HALLAZGO",
      estado: "ABIERTO",
      obra: obraNombreA,
      lugar: "Sector Grúa Torre",
      fecha: todayDate(),
      descripcion: "Cables eléctricos expuestos en paso peatonal de la obra.",
      riesgoPotencial: "Electrocución / Caídas",
      responsable: "Jefe de Eléctricos",
      creadoPorUserId: "u-supervisor-norte",
      creadoEn: new Date()
    },
    {
      id: "find-2",
      tipo: "INCIDENCIA",
      estado: "CERRADO",
      obra: obraNombreA,
      lugar: "Bodega materiales",
      fecha: todayDate(),
      descripcion: "Derrame menor de aceite hidráulico durante descarga.",
      causasProbables: "Falla en manguera de camión",
      medidasInmediatas: "Limpieza con aserrín y contención",
      creadoPorUserId: "u-supervisor-norte",
      creadoEn: new Date(Date.now() - 3600000),
      cerradoEn: new Date()
    }
  ]);

  // F. Documentos
  await db.table("documents").bulkPut([
    {
      id: "doc-1",
      titulo: "Reglamento Interno de Orden, Higiene y Seguridad",
      descripcion: "Documento oficial de la empresa para el año 2026.",
      obra: "GLOBAL",
      fecha: todayDate(),
      estado: "PUBLICADO",
      creadoEn: new Date(),
      creadoPorUserId: "u-admin-norte",
      asignados: [
        { workerId: w1Id, token: "tok-doc-w1" },
        { workerId: w2Id, token: "tok-doc-w2" }
      ]
    }
  ]);

  // G. Reportes de Gestión (Dashboards)
  await db.table("reports").bulkPut([
    {
      id: "rep-1",
      tipo: "REVISIÓN SEMANAL",
      estado: "CERRADO",
      obra: obraNombreA,
      fecha: todayDate(),
      synced: true,
      creadoEn: new Date()
    }
  ]);

  // 🔄 Trigger Cloud Sync immediately for the demo data
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
