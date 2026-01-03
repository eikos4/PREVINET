import type { UserRole } from "./auth.service";
import { normalizeRole } from "./auth.service";

/* ===============================
   VISIBILIDAD DE SECCIONES
   =============================== */

export const canViewDashboard = (role: UserRole) =>
  normalizeRole(role) !== "trabajador";

export const canManageWorkers = (role: UserRole) =>
  normalizeRole(role) === "superadmin" ||
  role === "prevencionista" ||
  role === "supervisor" ||
  role === "administrador" ||
  role === "auditor";

export const canViewART = (role: UserRole) =>
  normalizeRole(role) === "superadmin" || role !== "administrador";

export const canViewReports = (role: UserRole) =>
  normalizeRole(role) === "superadmin" || role !== "administrador";

export const canViewFindingIncidents = (role: UserRole) =>
  normalizeRole(role) === "superadmin" ||
  role === "administrador" ||
  role === "admin" ||
  role === "prevencionista" ||
  role === "supervisor" ||
  role === "auditor" ||
  role === "trabajador";

export const canViewWorkerDetail = (role: UserRole) =>
  normalizeRole(role) === "superadmin" ||
  role === "prevencionista" ||
  role === "supervisor" ||
  role === "administrador" ||
  role === "auditor";

export const canManageDocuments = (role: UserRole) =>
  normalizeRole(role) === "superadmin" ||
  role === "prevencionista" ||
  role === "supervisor" ||
  role === "administrador";

export const canViewDocuments = (role: UserRole) =>
  role === "trabajador";

export const canManageIRL = (role: UserRole) =>
  normalizeRole(role) === "superadmin" ||
  role === "prevencionista" ||
  role === "supervisor" ||
  role === "administrador" ||
  role === "auditor";

export const canViewIRL = (role: UserRole) =>
  role === "trabajador";

export const canManageTalks = (role: UserRole) =>
  normalizeRole(role) === "superadmin" ||
  role === "prevencionista" ||
  role === "supervisor" ||
  role === "administrador" ||
  role === "auditor";

export const canViewTalks = (role: UserRole) =>
  role === "trabajador";

export const canManageFitForWork = (role: UserRole) =>
  normalizeRole(role) === "superadmin" ||
  role === "prevencionista" ||
  role === "supervisor" ||
  role === "administrador" ||
  role === "auditor";

export const canViewFitForWork = (role: UserRole) =>
  role === "trabajador";

/* ===============================
   CREACIÓN
   =============================== */

export const canCreateART = (role: UserRole) =>
  normalizeRole(role) === "superadmin" || role === "prevencionista" || role === "supervisor";

export const canCreateTalks = (role: UserRole) =>
  normalizeRole(role) === "superadmin" || role === "prevencionista" || role === "supervisor";

export const canCreateFitForWork = (role: UserRole) =>
  normalizeRole(role) === "superadmin" || role === "prevencionista" || role === "supervisor";

export const canCreateReport = (role: UserRole) =>
  role === "trabajador";

export const canCreateFindingIncidents = (role: UserRole) =>
  normalizeRole(role) === "superadmin" || role === "trabajador" || role === "prevencionista";

/* ===============================
   ROLES ESPECIALES
   =============================== */

export const isReadOnly = (role: UserRole) =>
  role === "auditor";

export const isCompanyAdmin = (role: UserRole) =>
  normalizeRole(role) === "superadmin" || role === "administrador";

export const isSystemAdmin = (role: UserRole) =>
  normalizeRole(role) === "superadmin";
