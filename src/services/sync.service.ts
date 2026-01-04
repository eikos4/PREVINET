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
  | "notification"
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

  const errors: any[] = [];
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
          if (error) throw error;
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
          if (error) throw error;
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
          if (error) throw error;
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
          if (error) throw error;
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
            creado_por_user_id: obj.creado_por_user_id,
            creado_en: obj.creadoEn,
            asignados: obj.asignados,
            trabajadores: obj.trabajadores
          });
          if (error) throw error;
        }
      } else if (item.type === "irl") {
        const data = await db.table("irl").toArray();
        for (const obj of data) {
          const { error } = await supabase.from('irl').upsert({
            id: obj.id,
            obra: obj.obra,
            fecha: obj.fecha,
            titulo: obj.titulo,
            descripcion: obj.descripcion,
            estado: obj.estado,
            creado_por_user_id: obj.creadoPorUserId,
            creado_en: obj.creadoEn,
            asignados: obj.asignados
          });
          if (error) throw error;
        }
      } else if (item.type === "talk" || item.type === "fitForWork" || item.type === "findingIncident" || item.type === "report" || item.type === "document" || item.type === "notification" || item.type === "template") {
        // Handled via individual calls or full_sync below
        // Actually, let's keep it simple and just use the type-specific logic if needed
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
        await pushTable("talks", "talks", (t) => ({
          id: t.id,
          tema: t.tema,
          obra: t.obra,
          fecha_hora: t.fechaHora,
          estado: t.estado,
          asignados: t.asignados,
          creado_por_user_id: t.creadoPorUserId,
          creado_en: t.creadoEn
        }));
        await pushTable("fitForWork", "fit_for_work", (f) => ({
          id: f.id,
          fecha: f.fecha,
          turno: f.turno,
          obra: f.obra,
          estado: f.estado,
          questions: f.questions,
          asignados: f.asignados,
          creado_por_user_id: f.creadoPorUserId,
          creado_en: f.creadoEn
        }));
        await pushTable("findingIncidents", "finding_incidents", (fi) => ({
          id: fi.id,
          tipo: fi.tipo,
          estado: fi.estado,
          obra: fi.obra,
          lugar: fi.lugar,
          fecha: fi.fecha,
          hora: fi.hora,
          descripcion: fi.descripcion,
          riesgo_potencial: fi.riesgoPotencial,
          responsable: fi.responsable,
          recomendacion: fi.recomendacion,
          plazo_resolver: fi.plazoResolver,
          personas_involucradas: fi.personasInvolucradas,
          consecuencias: fi.consecuencias,
          causas_probables: fi.causasProbables,
          medidas_inmediatas: fi.medidasInmediatas,
          evidencias: fi.evidencias,
          seguimiento: fi.seguimiento,
          creado_por_user_id: fi.creadoPorUserId,
          creado_en: fi.creadoEn,
          cerrado_en: fi.cerradoEn
        }));
        await pushTable("reports", "reports", (r) => ({
          id: r.id,
          obra: r.obra,
          categoria: r.categoria,
          descripcion: r.descripcion,
          estado: r.estado,
          creado_en: r.creadoEn
        }));
        await pushTable("documents", "documents", (d) => ({
          id: d.id,
          obra: d.obra,
          fecha: d.fecha,
          titulo: d.titulo,
          descripcion: d.descripcion,
          categoria: d.categoria,
          estado: d.estado,
          asignados: d.asignados,
          creado_por_user_id: d.creadoPorUserId,
          creado_en: d.creadoEn
        }));
        await pushTable("notifications", "notifications", (n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          to_user_id: n.toUserId,
          to_role: n.toRole,
          company_id: n.companyId,
          from_user_id: n.fromUserId,
          read: n.read,
          created_at: n.createdAt,
          data: n.data,
          related: n.related
        }));
        await pushTable("templates", "templates", (t) => ({
          id: t.id,
          naturaleza: t.naturaleza,
          categoria: t.categoria,
          subtipo: t.subtipo,
          nombre: t.nombre,
          contenido: t.contenido,
          formato: t.formato,
          excel_data: t.excelData,
          word_data: t.wordData,
          creado_en: t.creadoEn
        }));
      }
    } catch (err) {
      console.error("Sync error:", err);
      errors.push(err);
    }
  }

  await db.table("syncQueue").clear();
  if (errors.length > 0) {
    throw new Error(`Sincronización incompleta: ${errors.length} errores. Revisa la consola.`);
  }
}

async function pushTable(tableName: string, supabaseTable: string, mapper: (item: any) => any) {
  const data = await db.table(tableName).toArray();
  for (const item of data) {
    const { error } = await supabase.from(supabaseTable).upsert(mapper(item));
    if (error) {
      console.error(`Error syncing ${tableName}:`, error);
      throw error;
    }
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

  // Sync Talks
  const { data: talks, error: talkErr } = await supabase.from('talks').select('*');
  if (!talkErr && talks) {
    for (const remote of talks) {
      await db.table('talks').put({
        id: remote.id,
        tema: remote.tema,
        obra: remote.obra,
        fechaHora: remote.fecha_hora,
        estado: remote.estado,
        asignados: remote.asignados,
        creadoPorUserId: remote.creado_por_user_id,
        creadoEn: new Date(remote.creado_en)
      });
    }
  }

  // Sync FitForWork
  const { data: fits, error: fitErr } = await supabase.from('fit_for_work').select('*');
  if (!fitErr && fits) {
    for (const remote of fits) {
      await db.table('fitForWork').put({
        id: remote.id,
        fecha: remote.fecha,
        turno: remote.turno,
        obra: remote.obra,
        estado: remote.estado,
        questions: remote.questions,
        asignados: remote.asignados,
        creadoPorUserId: remote.creado_por_user_id,
        creadoEn: new Date(remote.creado_en)
      });
    }
  }

  // Sync FindingIncidents
  const { data: findings, error: findErr } = await supabase.from('finding_incidents').select('*');
  if (!findErr && findings) {
    for (const remote of findings) {
      await db.table('findingIncidents').put({
        id: remote.id,
        tipo: remote.tipo,
        estado: remote.estado,
        obra: remote.obra,
        lugar: remote.lugar,
        fecha: remote.fecha,
        hora: remote.hora,
        descripcion: remote.descripcion,
        riesgoPotencial: remote.riesgo_potencial,
        responsable: remote.responsable,
        recomendacion: remote.recomendacion,
        plazoResolver: remote.plazo_resolver,
        personasInvolucradas: remote.personas_involucradas,
        consecuencias: remote.consecuencias,
        causasProbables: remote.causas_probables,
        medidasInmediatas: remote.medidas_inmediatas,
        evidencias: remote.evidencias,
        seguimiento: remote.seguimiento,
        creado_por_user_id: remote.creado_por_user_id,
        creadoEn: new Date(remote.creado_en),
        cerradoEn: remote.cerrado_en ? new Date(remote.cerrado_en) : undefined
      });
    }
  }

  // Sync Reports
  const { data: reports, error: repErr } = await supabase.from('reports').select('*');
  if (!repErr && reports) {
    for (const remote of reports) {
      await db.table('reports').put({
        id: remote.id,
        obra: remote.obra,
        categoria: remote.categoria,
        descripcion: remote.descripcion,
        estado: remote.estado,
        creadoEn: new Date(remote.creado_en)
      });
    }
  }

  // Sync Documents
  const { data: docs, error: docErr } = await supabase.from('documents').select('*');
  if (!docErr && docs) {
    for (const remote of docs) {
      await db.table('documents').put({
        id: remote.id,
        obra: remote.obra,
        fecha: remote.fecha,
        titulo: remote.titulo,
        descripcion: remote.descripcion,
        categoria: remote.categoria,
        estado: remote.estado,
        asignados: remote.asignados,
        creadoPorUserId: remote.creado_por_user_id,
        creadoEn: new Date(remote.creado_en)
      });
    }
  }

  // Sync Notifications
  const { data: notifications, error: notifErr } = await supabase.from('notifications').select('*');
  if (!notifErr && notifications) {
    for (const remote of notifications) {
      await db.table('notifications').put({
        id: remote.id,
        type: remote.type,
        title: remote.title,
        body: remote.body,
        toUserId: remote.to_user_id,
        toRole: remote.to_role,
        companyId: remote.company_id,
        fromUserId: remote.from_user_id,
        read: remote.read,
        createdAt: new Date(remote.created_at),
        data: remote.data,
        related: remote.related
      });
    }
  }

  // Sync Templates
  const { data: templates, error: tempErr } = await supabase.from('templates').select('*');
  if (!tempErr && templates) {
    for (const remote of templates) {
      await db.table('templates').put({
        id: remote.id,
        naturaleza: remote.naturaleza,
        categoria: remote.categoria,
        subtipo: remote.subtipo,
        nombre: remote.nombre,
        contenido: remote.contenido,
        formato: remote.formato,
        excelData: remote.excel_data,
        wordData: remote.word_data,
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
