import Dexie from "dexie";

export const db = new Dexie("previnet");

db.version(15).stores({
  users: "id, pin, role, workerId",
  workers: "id, rut, pin, obra",
  empresas: "id, rut, tipo, creadoEn",
  obras: "id, nombre, estado, creadoEn",
  templates: "id, naturaleza, categoria, subtipo, formato, creadoEn",
  art: "id, fecha, synced",
  reports: "id, estado, synced",
  irl: "id, fecha, obra, estado",
  talks: "id, fechaHora, obra, estado",
  fitForWork: "id, fecha, turno, obra, estado",
  findingIncidents: "id, tipo, estado, obra, fecha, creadoEn, creadoPorUserId",
  documents: "id, fecha, obra, estado, creadoEn, creadoPorUserId",
  evidences: "id, ref",
  irlSignedPdfs: "id, irlId, workerId, token, createdAt",
  artSignedPdfs: "id, artId, workerId, token, createdAt",
  talkSignedPdfs: "id, talkId, workerId, token, createdAt",
  fitForWorkSignedPdfs: "id, fitForWorkId, workerId, token, createdAt",
  documentSignedPdfs: "id, documentId, workerId, token, createdAt",
  templateSignedPdfs: "id, templateId, workerId, token, createdAt",
  workerEnrollmentSignedPdfs: "id, workerId, token, createdAt",
  syncQueue: "++id, type, created_at"
});

// Notifications store (v16)
db.version(16).stores({
  notifications: "++id, type, toUserId, toRole, read, createdAt"
});

// Add empresaId to obras & users and index companyId on notifications (v17)
db.version(17).stores({
  obras: "id, nombre, estado, creadoEn, empresaId",
  users: "id, pin, role, workerId, companyId",
  notifications: "++id, type, toUserId, toRole, companyId, read, createdAt"
});
