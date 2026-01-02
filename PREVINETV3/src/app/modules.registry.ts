import type { UserRole } from "../modules/auth/auth.service";

export type AppSection =
  | "inicio"
  | "dashboard"
  | "workers"
  | "workerTimeline"
  | "art"
  | "profile"
  | "irl"
  | "talks"
  | "fitForWork"
  | "findingIncidents"
  | "templates"
  | "excelTemplates"
  | "obras"
  | "empresas"
  | "adminUsers";

export type AppModuleDefinition = {
  key: AppSection;
  label: string;
  icon: string;
  allowedRoles: UserRole[] | "*";
};

export const APP_MODULES: AppModuleDefinition[] = [
  {
    key: "inicio",
    label: "Inicio",
    icon: "🏁",
    allowedRoles: ["trabajador"],
  },
  {
    key: "profile",
    label: "Mi perfil",
    icon: "🙍",
    allowedRoles: ["trabajador"],
  },
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "📊",
    allowedRoles: ["prevencionista", "supervisor", "auditor", "superadmin"],
  },
  {
    key: "empresas",
    label: "Empresas",
    icon: "🏢",
    allowedRoles: ["prevencionista", "supervisor", "superadmin"],
  },
  {
    key: "obras",
    label: "Obras",
    icon: "🏗️",
    allowedRoles: ["prevencionista", "supervisor", "superadmin"],
  },
  {
    key: "adminUsers",
    label: "Usuarios del Sistema",
    icon: "👥",
    allowedRoles: ["superadmin", "administrador"],
  },
  {
    key: "findingIncidents",
    label: "Hallazgos/Incidencias",
    icon: "🧱",
    allowedRoles: "*",
  },
  {
    key: "workers",
    label: "Trabajadores",
    icon: "👷",
    allowedRoles: ["prevencionista", "supervisor", "auditor", "superadmin"],
  },
  {
    key: "workerTimeline",
    label: "Línea de tiempo",
    icon: "🕒",
    allowedRoles: ["prevencionista", "supervisor", "auditor", "superadmin"],
  },
  {
    key: "templates",
    label: "Documentos",
    icon: "📄",
    allowedRoles: ["prevencionista", "supervisor", "auditor", "superadmin"],
  },
  {
    key: "excelTemplates",
    label: "Plantillas",
    icon: "📊",
    allowedRoles: ["prevencionista", "supervisor", "superadmin"],
  },
  {
    key: "irl",
    label: "IRL",
    icon: "🧾",
    allowedRoles: "*",
  },
  {
    key: "talks",
    label: "Charlas",
    icon: "🗣️",
    allowedRoles: "*",
  },
  {
    key: "fitForWork",
    label: "Fit-for-Work",
    icon: "✅",
    allowedRoles: "*",
  },
  {
    key: "art",
    label: "AST/ART",
    icon: "📝",
    allowedRoles: "*",
  },
];
