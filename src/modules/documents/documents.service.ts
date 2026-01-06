import { db } from "../../offline/db";
import { addToSyncQueue } from "../../services/sync.service";
import { saveSignedDocumentPdf } from "./documentsPdf.service";
import { createNotification } from "../notifications/notifications.service";

export type DocumentWorkerAssignment = {
  workerId: string;
  token: string;
  firmadoPorNombre?: string;
  firmadoPorRut?: string;
  firmadoEn?: Date;
  geo?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
};

export type DocumentRecord = {
  id: string;
  obra: string;
  fecha: string;
  titulo: string;
  descripcion?: string;
  categoria?: string;
  estado: "PUBLICADO";
  asignados: DocumentWorkerAssignment[];
  attachment: {
    fileName: string;
    mimeType: string;
    blob: Blob;
  };
  creadoPorUserId?: string;
  creadoEn: Date;
};

export async function getDocuments(): Promise<DocumentRecord[]> {
  const list = await db.table("documents").toArray();
  return list as DocumentRecord[];
}

export async function addDocument(
  data: Omit<DocumentRecord, "id" | "creadoEn" | "estado">
) {
  const doc: DocumentRecord = {
    id: crypto.randomUUID(),
    creadoEn: new Date(),
    estado: "PUBLICADO",
    ...data,
  };

  await db.table("documents").add(doc);
  await addToSyncQueue("document");

  return doc;
}

export async function getDocumentsForWorker(workerId: string): Promise<DocumentRecord[]> {
  const list = (await db.table("documents").toArray()) as DocumentRecord[];
  return list.filter((d) => d.asignados?.some((a) => a.workerId === workerId));
}

export async function signDocument(
  documentId: string,
  workerId: string,
  firmadoPorNombre: string,
  firmadoPorRut: string,
  signatureDataUrl: string,
  geo?: { lat: number; lng: number; accuracy?: number }
) {
  const doc = (await db.table("documents").get(documentId)) as DocumentRecord | undefined;
  if (!doc) throw new Error("Documento no encontrado");

  const idx = doc.asignados.findIndex((a) => a.workerId === workerId);
  if (idx === -1) throw new Error("Este documento no está asignado a este trabajador");

  const current = doc.asignados[idx];
  if (current.firmadoEn) throw new Error("Este documento ya fue firmado");
  if (!signatureDataUrl) throw new Error("Firma requerida");

  const firmadoEn = new Date();

  const updated: DocumentRecord = {
    ...doc,
    asignados: doc.asignados.map((a) =>
      a.workerId === workerId
        ? {
          ...a,
          firmadoPorNombre,
          firmadoPorRut,
          firmadoEn,
          geo,
        }
        : a
    ),
  };

  await db.table("documents").put(updated);
  await addToSyncQueue("document");

  const updatedAssignment = updated.asignados.find((a) => a.workerId === workerId);
  if (!updatedAssignment || !updatedAssignment.firmadoEn) {
    throw new Error("No se pudo registrar la firma");
  }

  await saveSignedDocumentPdf({
    document: updated,
    assignment: updatedAssignment,
    signatureDataUrl,
  });

  // 🔔 Notificar al creador del documento
  if (updated.creadoPorUserId) {
    await createNotification({
      type: "document_signed",
      title: `${firmadoPorNombre} leyó el documento`,
      body: `Documento: ${updated.titulo}`,
      toUserId: updated.creadoPorUserId,
      related: { entity: "document", id: updated.id },
    });
  }

  return updated;
}
export async function updateDocumentAssignments(
  documentId: string,
  workerIds: string[]
) {
  const doc = (await db.table("documents").get(documentId)) as DocumentRecord | undefined;
  if (!doc) throw new Error("Documento no encontrado");

  // Mantener los que ya están firmados, agregar los nuevos
  const existingAssignments = doc.asignados || [];
  const newAssignments: DocumentWorkerAssignment[] = [...existingAssignments];

  workerIds.forEach((wid) => {
    if (!newAssignments.some((a) => a.workerId === wid)) {
      newAssignments.push({
        workerId: wid,
        token: crypto.randomUUID(),
      });
    }
  });

  // (Opcional) Quitar los que no están en la nueva lista SI no han firmado todavía
  const finalAssignments = newAssignments.filter((a) => {
    if (a.firmadoEn) return true; // Si ya firmó, se queda
    return workerIds.includes(a.workerId); // Si no ha firmado, debe estar en la nueva lista
  });

  await db.table("documents").update(documentId, { asignados: finalAssignments });
  await addToSyncQueue("document");
}
