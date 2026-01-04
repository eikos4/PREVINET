import { db } from "../offline/db";
import { supabase } from "../lib/supabase";

export type SyncItem = {
  type:
  | "worker"
  | "art"
  | "report"
  | "irl"
  | "talk"
  | "fitForWork"
  | "findingIncident"
  | "document"
  | "empresa"
  | "obra"
  | "template"
  | "user"
  | "full_sync";
  createdAt: Date;
};

export async function getPendingSyncCount(): Promise<number> {
  return await db.table("syncQueue").count();
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function triggerBackgroundSync() {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  if (syncTimer) clearTimeout(syncTimer);

  syncTimer = setTimeout(async () => {
    window.dispatchEvent(new CustomEvent('sync:status', { detail: { syncing: true } }));
    try {
      await flushSyncQueue();
    } finally {
      window.dispatchEvent(new CustomEvent('sync:status', { detail: { syncing: false } }));
      syncTimer = null;
    }
  }, 3000); // 3 seconds debounce
}

export async function addToSyncQueue(type: SyncItem["type"]) {
  await db.table("syncQueue").add({
    type,
    createdAt: new Date(),
  });
  triggerBackgroundSync();
}

export async function flushSyncQueue() {
  const items = await db.table("syncQueue").toArray();
  if (items.length === 0) return;

  console.log("📡 Sincronizando con Supabase:", items);

  for (const item of items) {
    try {
      if (item.type === "empresa") {
        const data = await db.table("empresas").toArray();
        for (const emp of data) {
          const { error } = await supabase.from('empresas').upsert({
            id: emp.id,
            nombre_razon_social: emp.nombreRazonSocial,
            rut: emp.rut,
            tipo: emp.tipo,
            giro: emp.giro,
            estado: emp.estado,
            clasificacion: emp.clasificacion,
            creado_en: emp.creadoEn
          });
          if (error) console.error("Error syncing empresa:", error);
        }
      } else if (item.type === "obra") {
        const data = await db.table("obras").toArray();
        for (const obj of data) {
          const { error } = await supabase.from('obras').upsert({
            id: obj.id,
            nombre: obj.nombre,
            estado: obj.estado,
            empresa_id: obj.empresaId,
            creado_en: obj.creadoEn
          });
          if (error) console.error("Error syncing obra:", error);
        }
      } else if (item.type === "worker") {
        const data = await db.table("workers").toArray();
        for (const obj of data) {
          const { error } = await supabase.from('workers').upsert({
            id: obj.id,
            nombre: obj.nombre,
            rut: obj.rut,
            cargo: obj.cargo,
            telefono: obj.telefono,
            empresa_nombre: obj.empresaNombre,
            empresa_rut: obj.empresaRut,
            pin: obj.pin,
            habilitado: obj.habilitado,
            creado_en: obj.creadoEn
          });
          if (error) console.error("Error syncing worker:", error);
        }
      } else if (item.type === "user") {
        const data = await db.table("users").toArray();
        for (const obj of data) {
          const { error } = await supabase.from('users').upsert({
            id: obj.id,
            name: obj.name,
            pin: obj.pin,
            role: obj.role,
            worker_id: obj.workerId,
            company_id: obj.companyId,
            company_name: obj.companyName,
            company_rut: obj.companyRut,
            creado_en: obj.creadoEn
          });
          if (error) console.error("Error syncing user:", error);
        }
      } else if (item.type === "art") {
        const data = await db.table("art").toArray();
        for (const obj of data) {
          const { error } = await supabase.from('art').upsert({
            id: obj.id,
            obra: obj.obra,
            fecha: obj.fecha,
            riesgos: obj.riesgos,
            cerrado: obj.cerrado,
            creado_por_user_id: obj.creadoPorUserId,
            creado_en: obj.creadoEn,
            asignados: obj.asignados,
            trabajadores: obj.trabajadores
          });
          if (error) console.error("Error syncing ART:", error);
        }
      } else if (item.type === "full_sync") {
        // Upload everything
        await pushTable("empresas", "empresas", (e) => ({
          id: e.id,
          nombre_razon_social: e.nombreRazonSocial,
          rut: e.rut,
          tipo: e.tipo,
          giro: e.giro,
          estado: e.estado,
          clasificacion: e.clasificacion,
          creado_en: e.creadoEn
        }));
        await pushTable("obras", "obras", (o) => ({
          id: o.id,
          nombre: o.nombre,
          estado: o.estado,
          empresa_id: o.empresaId,
          creado_en: o.creadoEn
        }));
        await pushTable("workers", "workers", (w) => ({
          id: w.id,
          nombre: w.nombre,
          rut: w.rut,
          cargo: w.cargo,
          telefono: w.telefono,
          empresa_nombre: w.empresaNombre,
          empresa_rut: w.empresaRut,
          pin: w.pin,
          habilitado: w.habilitado,
          creado_en: w.creadoEn
        }));
        await pushTable("users", "users", (u) => ({
          id: u.id,
          name: u.name,
          pin: u.pin,
          role: u.role,
          worker_id: u.workerId,
          company_id: u.companyId,
          company_name: u.companyName,
          company_rut: u.companyRut,
          creado_en: u.creadoEn
        }));
        await pushTable("art", "art", (a) => ({
          id: a.id,
          obra: a.obra,
          fecha: a.fecha,
          riesgos: a.riesgos,
          cerrado: a.cerrado,
          creado_por_user_id: a.creadoPorUserId,
          creado_en: a.creadoEn,
          asignados: a.asignados,
          trabajadores: a.trabajadores
        }));
        await pushTable("irl", "irl", (i) => ({
          id: i.id,
          obra: i.obra,
          fecha: i.fecha,
          titulo: i.titulo,
          descripcion: i.descripcion,
          estado: i.estado,
          creado_por_user_id: i.creadoPorUserId,
          creado_en: i.creadoEn,
          asignados: i.asignados
        }));
      }
    } catch (err) {
      console.error("Sync error:", err);
    }
  }

  await db.table("syncQueue").clear();
}

async function pushTable(tableName: string, supabaseTable: string, mapper: (item: any) => any) {
  const data = await db.table(tableName).toArray();
  for (const item of data) {
    const { error } = await supabase.from(supabaseTable).upsert(mapper(item));
    if (error) console.error(`Error syncing ${tableName}:`, error);
  }
}

export async function pullFromSupabase() {
  console.log("📥 Descargando datos desde Supabase...");

  // Sync Empresas
  const { data: empresas, error: empErr } = await supabase.from('empresas').select('*');
  if (!empErr && empresas) {
    for (const remote of empresas) {
      await db.table('empresas').put({
        id: remote.id,
        nombreRazonSocial: remote.nombre_razon_social,
        rut: remote.rut,
        tipo: remote.tipo,
        giro: remote.giro,
        estado: remote.estado,
        clasificacion: remote.clasificacion,
        creadoEn: new Date(remote.creado_en)
      });
    }
  }

  // Sync Obras
  const { data: obras, error: obrErr } = await supabase.from('obras').select('*');
  if (!obrErr && obras) {
    for (const remote of obras) {
      await db.table('obras').put({
        id: remote.id,
        nombre: remote.nombre,
        estado: remote.estado,
        empresaId: remote.empresa_id,
        creadoEn: new Date(remote.creado_en)
      });
    }
  }

  // Sync Workers
  const { data: workers, error: worErr } = await supabase.from('workers').select('*');
  if (!worErr && workers) {
    for (const remote of workers) {
      await db.table('workers').put({
        id: remote.id,
        nombre: remote.nombre,
        rut: remote.rut,
        cargo: remote.cargo,
        telefono: remote.telefono,
        empresaNombre: remote.empresa_nombre,
        empresaRut: remote.empresa_rut,
        pin: remote.pin,
        habilitado: remote.habilitado,
        creadoEn: new Date(remote.creado_en)
      });
    }
  }

  // Sync Users
  const { data: users, error: usrErr } = await supabase.from('users').select('*');
  if (!usrErr && users) {
    for (const remote of users) {
      await db.table('users').put({
        id: remote.id,
        name: remote.name,
        pin: remote.pin,
        role: remote.role,
        workerId: remote.worker_id,
        companyId: remote.company_id,
        companyName: remote.company_name,
        companyRut: remote.company_rut,
        creadoEn: new Date(remote.creado_en)
      });
    }
  }

  // Sync IRL
  const { data: irls, error: irlErr } = await supabase.from('irl').select('*');
  if (!irlErr && irls) {
    for (const remote of irls) {
      await db.table('irl').put({
        id: remote.id,
        obra: remote.obra,
        fecha: remote.fecha,
        titulo: remote.titulo,
        descripcion: remote.descripcion,
        estado: remote.estado,
        creadoPorUserId: remote.creado_por_user_id,
        asignados: remote.asignados,
        creadoEn: new Date(remote.creado_en)
      });
    }
  }

  // Sync ART
  const { data: arts, error: artErr } = await supabase.from('art').select('*');
  if (!artErr && arts) {
    for (const remote of arts) {
      await db.table('art').put({
        id: remote.id,
        obra: remote.obra,
        fecha: remote.fecha,
        riesgos: remote.riesgos,
        cerrado: remote.cerrado,
        creadoPorUserId: remote.creado_por_user_id,
        asignados: remote.asignados,
        trabajadores: remote.trabajadores,
        creadoEn: new Date(remote.creado_en)
      });
    }
  }

  console.log("✅ Sincronización completa");
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    getPendingSyncCount().then(count => {
      if (count > 0) triggerBackgroundSync();
    });
  });
}
