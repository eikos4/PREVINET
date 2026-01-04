import { useEffect, useMemo, useState } from "react";

import Login from "../modules/auth/Login";
import { getCurrentUser, logout } from "../modules/auth/auth.service";
import type { User, UserRole } from "../modules/auth/auth.service";
import { normalizeRole } from "../modules/auth/auth.service";

import WorkersManage from "../modules/workers/WorkersManage";
import WorkerProfile from "../modules/workers/WorkerProfile";
import WorkerJourney from "../modules/workers/WorkerJourney";
import { getWorkerById } from "../modules/workers/worker.service";
import type { Worker } from "../modules/workers/worker.service";
import {
  getWorkerJourneyStatus,
  isWorkerJourneySectionAllowed,
} from "../modules/workers/workerJourney.service";

import ArtForm from "../modules/art/ArtForm";
import ArtList from "../modules/art/ArtList";
import ArtWorkerList from "../modules/art/ArtWorkerList";

import IRLForm from "../modules/irl/IRLForm";
import IRLList from "../modules/irl/IRLList";
import IRLWorkerList from "../modules/irl/IRLWorkerList";

import TalkForm from "../modules/talks/TalkForm";
import TalkList from "../modules/talks/TalkList";
import TalkWorkerList from "../modules/talks/TalkWorkerList";

import FitForWorkForm from "../modules/fitForWork/FitForWorkForm";
import FitForWorkList from "../modules/fitForWork/FitForWorkList";
import FitForWorkWorkerList from "../modules/fitForWork/FitForWorkWorkerList";

import FindingIncidentsView from "../modules/findingIncidents/FindingIncidentsView";

import Dashboard from "../modules/dashboard/Dashboard";
import OnlineStatus from "../components/OnlineStatus";
import InstallBanner from "../components/InstallBanner";
import NotificationsBell from "../components/NotificationsBell";
import { Toaster } from "sonner";

import AdminUsers from "../modules/admin/AdminUsersPro.tsx";
import EmpresasView from "../modules/empresas/EmpresasView.tsx";
import ObrasView from "../modules/obras/ObrasView";
import TemplatesView from "../modules/templates/TemplatesView";
import ExcelTemplatesView from "../modules/templates/ExcelTemplatesView";

import PrevencionistaTimelineView from "../modules/prevencionista/PrevencionistaTimelineView";

import {
  canViewDashboard,
  canManageWorkers,
  canViewWorkerDetail,
  canManageIRL,
  canViewIRL,
  canManageTalks,
  canViewTalks,
  canManageFitForWork,
  canViewFitForWork,
  canCreateART,
  canViewART,
  canCreateTalks,
  canCreateFitForWork,
  canCreateFindingIncidents,
  canViewFindingIncidents,
  isReadOnly,
  isSystemAdmin,
} from "../modules/auth/permissions";

import { APP_MODULES } from "./modules.registry";

type View = "landing" | "login" | "app";
type Section = "inicio" | "dashboard" | "workers" | "workerTimeline" | "art" | "profile" | "irl" | "talks" | "fitForWork" | "findingIncidents" | "templates" | "excelTemplates" | "obras" | "empresas" | "adminUsers";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [section, setSection] = useState<Section>("dashboard");
  const [reload, setReload] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [workerError, setWorkerError] = useState("");
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [journeyError, setJourneyError] = useState("");
  const [journeyStatus, setJourneyStatus] = useState<Awaited<ReturnType<typeof getWorkerJourneyStatus>> | null>(null);
  const [journeyReload, setJourneyReload] = useState(0);

  const navigateTo = (next: Section) => {
    if (role === "trabajador" && worker?.id) {
      const allowed = isWorkerJourneySectionAllowed(journeyStatus, next);
      if (!allowed) {
        setSection("inicio");
        setMenuOpen(false);
        return;
      }
    }

    setSection(next);
    setMenuOpen(false);
  };

  /* ===============================
     LOAD CURRENT USER
     =============================== */
  useEffect(() => {
    getCurrentUser().then(async (u) => {
      if (u) {
        setUser(u);
        setView("app");
        // Auto-pull from cloud on start
        try {
          const { pullFromSupabase } = await import("../services/sync.service");
          pullFromSupabase();
        } catch (e) {
          console.error("Auto-pull failed", e);
        }
      }
    });
  }, []);

  const role: UserRole | null = user?.role ?? null;
  const effectiveRole: UserRole | null = role ? normalizeRole(role) : null;

  /* ===============================
     LOAD WORKER (IF TRABAJADOR)
     =============================== */
  useEffect(() => {
    setWorker(null);
    setWorkerError("");

    if (!user || user.role !== "trabajador") return;
    if (!user.workerId) {
      setWorkerError("No se encontró trabajador asociado a esta sesión");
      return;
    }

    getWorkerById(user.workerId)
      .then((w) => {
        if (!w) {
          setWorkerError("No se encontró el trabajador enrolado");
          return;
        }
        setWorker(w);
      })
      .catch((e) => {
        const message = e instanceof Error ? e.message : "No se pudo cargar el trabajador";
        setWorkerError(message);
      });
  }, [user]);

  useEffect(() => {
    if (view !== "app") return;
    if (role !== "trabajador") {
      setJourneyStatus(null);
      setJourneyError("");
      setJourneyLoading(false);
      return;
    }

    if (!worker?.id) return;

    setJourneyLoading(true);
    setJourneyError("");
    getWorkerJourneyStatus(worker.id)
      .then((s) => setJourneyStatus(s))
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "No se pudo cargar el inicio de jornada";
        setJourneyError(msg);
      })
      .finally(() => setJourneyLoading(false));
  }, [view, role, worker?.id, journeyReload, section]);

  /* ===============================
     ALLOWED SECTIONS BY ROLE
     =============================== */
  const allowedSections = useMemo<Section[]>(() => {
    if (!effectiveRole) return [];
    const canSeeIRL = canManageIRL(effectiveRole) || canViewIRL(effectiveRole);
    const canSeeTalks = canManageTalks(effectiveRole) || canViewTalks(effectiveRole);
    const canSeeFitForWork = canManageFitForWork(effectiveRole) || canViewFitForWork(effectiveRole);
    const canSeeFindingIncidents =
      canViewFindingIncidents(effectiveRole) || canCreateFindingIncidents(effectiveRole);

    const hasModuleAccess = (key: Section): boolean => {
      switch (key) {
        case "inicio":
          return effectiveRole === "trabajador";
        case "profile":
          return effectiveRole === "trabajador";
        case "dashboard":
          return canViewDashboard(effectiveRole);
        case "workers":
          return canManageWorkers(effectiveRole);
        case "workerTimeline":
          return canViewWorkerDetail(effectiveRole);
        case "templates":
          return effectiveRole !== "trabajador";
        case "excelTemplates":
          return effectiveRole !== "trabajador";
        case "empresas":
          return effectiveRole !== "trabajador";
        case "obras":
          return effectiveRole !== "trabajador";
        case "irl":
          return canSeeIRL;
        case "talks":
          return canSeeTalks;
        case "fitForWork":
          return canSeeFitForWork;
        case "art":
          return canViewART(effectiveRole);
        case "findingIncidents":
          return canSeeFindingIncidents;
        case "adminUsers":
          return effectiveRole === "superadmin";
        default:
          return false;
      }
    };

    return APP_MODULES
      .filter((m) => {
        if (m.allowedRoles === "*") return true;
        return m.allowedRoles.includes(effectiveRole);
      })
      .map((m) => m.key)
      .filter((key) => hasModuleAccess(key));
  }, [effectiveRole]);

  /* ===============================
     GUARD: REDIRECT IF FORBIDDEN
     =============================== */
  useEffect(() => {
    if (view !== "app" || !role) return;
    if (!allowedSections.includes(section) && allowedSections.length > 0) {
      setSection(allowedSections[0]);
    }
  }, [view, role, section, allowedSections]);

  // Listen to notification open events to navigate to related content
  useEffect(() => {
    const handler = (ev: Event) => {
      const custom = ev as CustomEvent;
      const n = custom.detail as { related?: { entity: string; id: string } } | undefined;
      if (!n || !n.related) return;
      const map: Record<string, Section> = {
        talk: "talks",
        irl: "irl",
        art: "art",
        document: "templates",
        fitForWork: "fitForWork",
      };
      const key = map[n.related.entity];
      if (key) {
        setView("app");
        setSection(key);
        setMenuOpen(false);
        setReload((r) => r + 1);
      }
    };

    window.addEventListener("notification:open", handler as EventListener);
    return () => window.removeEventListener("notification:open", handler as EventListener);
  }, []);

  const roleLabel = (r: UserRole) => {
    switch (r) {
      case "trabajador":
        return "Trabajador";
      case "prevencionista":
        return "Prevencionista";
      case "supervisor":
        return "Supervisor";
      case "administrador":
        return "Administrador";
      case "auditor":
        return "Auditor";
      case "admin":
        return "Admin Empresa";
      case "superadmin":
        return "Superadmin";
      default:
        return "Usuario";
    }
  };

  const sectionLabel = (s: Section) => {
    switch (s) {
      case "inicio":
        return "Inicio";
      case "dashboard":
        return "Dashboard";
      case "workers":
        return "Trabajadores";
      case "workerTimeline":
        return "Línea de tiempo";
      case "art":
        return "ART";
      case "profile":
        return "Mi perfil";
      case "irl":
        return "IRL";
      case "talks":
        return "Charlas";
      case "fitForWork":
        return "Fit-for-Work";
      case "findingIncidents":
        return "Hallazgos/Incidencias";
      case "templates":
        return "Documentos";
      case "excelTemplates":
        return "Plantillas";
      case "obras":
        return "Obras";
      case "empresas":
        return "Empresas";
      case "adminUsers":
        return "Usuarios";
      default:
        return "";
    }
  };

  /* ===============================
     LANDING
     =============================== */
  if (view === "landing") {
    return (
      <div className="landing">
        <InstallBanner />
        <div className="landing-shell">
          <div className="landing-card landing-hero">
            <img className="landing-logo" src="/logo.png" alt="PreviNet" />

            <p className="landing-subtitle">
              Plataforma preventiva <strong>offline-first</strong>
            </p>

            <p className="landing-description">
              Diseñada para gestión preventiva en terreno, con firma digital y trazabilidad.
            </p>

            <div className="landing-badges">
              <span className="landing-badge">📴 Sin internet</span>
              <span className="landing-badge">🖊️ Firma digital</span>
              <span className="landing-badge">📄 PDFs firmados</span>
              <span className="landing-badge">📊 Dashboard</span>
              <span className="landing-badge">🔎 Auditoría</span>
            </div>

            <div className="landing-actions">
              <button className="btn-primary" onClick={() => setView("login")}>
                Ingresar al sistema
              </button>
            </div>

            <p className="landing-footnote">Menos papeleo, más prevención en terreno.</p>
            <p className="landing-footnote">BY kodesk.cl</p>
          </div>
        </div>
      </div>
    );
  }

  /* ===============================
     LOGIN
     =============================== */
  if (view === "login") {
    return (
      <Login
        onLogin={async () => {
          const u = await getCurrentUser();
          if (u) {
            setUser(u);
            setView("app");
          }
        }}
      />
    );
  }

  /* ===============================
     APP
     =============================== */
  if (!user || !role) {
    return <p style={{ padding: "2rem" }}>Cargando sesión…</p>;
  }

  const readOnly =
    isReadOnly(effectiveRole ?? role) || isSystemAdmin(effectiveRole ?? role);

  const navItems: Array<{ key: Section; label: string; icon: string; visible: boolean }> = APP_MODULES.map(
    (m) => ({
      key: m.key,
      label: m.label,
      icon: m.icon,
      visible: allowedSections.includes(m.key),
    })
  );

  return (
    <div className="layout">
      <InstallBanner />
      <Toaster position="top-center" richColors />
      {/* OVERLAY MOBILE */}
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">PreviNet</div>
          <div className="sidebar-meta">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="sidebar-role">{roleLabel(role)}</div>
                {user.name && <div className="sidebar-user">{user.name}</div>}
              </div>
              <div style={{ marginLeft: 8 }}>
                {/* Bell moved to TopBar */}
              </div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems
            .filter((i) => i.visible)
            .map((i) => {
              const active = section === i.key;
              const locked =
                role === "trabajador" &&
                !isWorkerJourneySectionAllowed(journeyStatus, i.key);
              return (
                <button
                  key={i.key}
                  type="button"
                  onClick={() => navigateTo(i.key)}
                  className={`sidebar-item ${active ? "active" : ""}`}
                  disabled={locked}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="sidebar-icon">{i.icon}</span>
                  <span className="sidebar-text">{i.label}</span>
                </button>
              );
            })}
        </nav>

        <button
          className="btn-logout sidebar-logout"
          onClick={() => {
            logout();
            setUser(null);
            setView("landing");
            setMenuOpen(false);
          }}
        >
          Cerrar sesión
        </button>
      </aside>

      {/* CONTENT */}
      <main className="content">
        {/* MENU MOBILE */}
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú"
        >
          ☰
        </button>

        {/* TOP BAR */}
        <div className="top-bar">
          <div>
            <h1>{sectionLabel(section)}</h1>
            <small>
              Perfil: <strong>{roleLabel(role)}</strong>
              {readOnly && " · Solo lectura"}
              {role === "trabajador" && worker && (
                <>
                  {" "}· <strong>{worker.nombre}</strong>
                  {" "}· {worker.cargo}
                  {" "}· {worker.obra}
                </>
              )}
            </small>
            {role === "trabajador" && !worker && workerError && (
              <small style={{ display: "block", color: "#ef4444" }}>
                {workerError}
              </small>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <NotificationsBell />
            <OnlineStatus />
          </div>
        </div>

        {/* SECTIONS */}
        {role === "trabajador" && !worker && !workerError && (
          <div className="card">
            <p style={{ margin: 0, color: "#64748b" }}>
              Cargando tu perfil de trabajador…
            </p>
          </div>
        )}

        {role === "trabajador" && !worker && workerError && (
          <div className="card">
            <p style={{ margin: 0, color: "#ef4444", fontWeight: 700 }}>
              {workerError}
            </p>
          </div>
        )}

        {section === "inicio" && role === "trabajador" && worker && (
          <WorkerJourney
            worker={worker}
            status={journeyStatus}
            loading={journeyLoading}
            error={journeyError}
            onRefresh={() => setJourneyReload((x) => x + 1)}
            onGoTo={(s) => navigateTo(s)}
          />
        )}

        {section === "dashboard" && canViewDashboard(effectiveRole ?? role) && (
          <Dashboard />
        )}

        {section === "workers" && canManageWorkers(effectiveRole ?? role) && (
          <WorkersManage readOnly={readOnly} />
        )}

        {section === "workerTimeline" && canViewWorkerDetail(effectiveRole ?? role) && (
          <PrevencionistaTimelineView />
        )}

        {section === "irl" && canManageIRL(effectiveRole ?? role) && (
          <>
            {!readOnly && (
              <IRLForm
                creadoPorUserId={user.id}
                onCreated={() => setReload((r) => r + 1)}
              />
            )}
            <IRLList key={`i-${reload}`} />
          </>
        )}

        {section === "irl" && canViewIRL(effectiveRole ?? role) && (
          <>
            {worker ? (
              <IRLWorkerList worker={worker} key={`iw-${reload}`} />
            ) : (
              <div className="card">
                <p style={{ margin: 0, color: "#64748b" }}>
                  Cargando IRL…
                </p>
              </div>
            )}
          </>
        )}

        {section === "talks" && canManageTalks(effectiveRole ?? role) && (
          <>
            {!readOnly && canCreateTalks(effectiveRole ?? role) && (
              <TalkForm
                creadoPorUserId={user.id}
                onCreated={() => setReload((r) => r + 1)}
              />
            )}
            <TalkList key={`t-${reload}`} />
          </>
        )}

        {section === "talks" && canViewTalks(effectiveRole ?? role) && (
          <>
            {worker ? (
              <TalkWorkerList worker={worker} key={`tw-${reload}`} />
            ) : (
              <div className="card">
                <p style={{ margin: 0, color: "#64748b" }}>
                  Cargando charlas…
                </p>
              </div>
            )}
          </>
        )}

        {section === "fitForWork" && canManageFitForWork(effectiveRole ?? role) && (
          <>
            {!readOnly && canCreateFitForWork(effectiveRole ?? role) && (
              <FitForWorkForm
                creadoPorUserId={user.id}
                onCreated={() => setReload((r) => r + 1)}
              />
            )}
            <FitForWorkList key={`ffw-${reload}`} />
          </>
        )}

        {section === "fitForWork" && canViewFitForWork(effectiveRole ?? role) && (
          <>
            {worker ? (
              <FitForWorkWorkerList worker={worker} key={`ffww-${reload}`} />
            ) : (
              <div className="card">
                <p style={{ margin: 0, color: "#64748b" }}>
                  Cargando evaluaciones…
                </p>
              </div>
            )}
          </>
        )}

        {section === "art" && canViewART(effectiveRole ?? role) && (
          <>
            {role === "trabajador" ? (
              worker ? (
                <ArtWorkerList worker={worker} key={`aw-${reload}`} />
              ) : (
                <div className="card">
                  <p style={{ margin: 0, color: "#64748b" }}>
                    Cargando ART/AST…
                  </p>
                </div>
              )
            ) : (
              <>
                {canCreateART(effectiveRole ?? role) && !readOnly && (
                  <ArtForm
                    creadoPorUserId={user.id}
                    onCreated={() => setReload((r) => r + 1)}
                  />
                )}
                <ArtList key={`a-${reload}`} />
              </>
            )}
          </>
        )}

        {section === "findingIncidents" && (
          <>
            {canViewFindingIncidents(effectiveRole ?? role) && (
              <FindingIncidentsView
                readOnly={readOnly}
                canCreate={canCreateFindingIncidents(effectiveRole ?? role) && !readOnly}
                currentUserId={user.id}
                defaultObra={worker?.obra}
              />
            )}
          </>
        )}

        {section === "profile" && role === "trabajador" && (
          <>
            {worker ? (
              <WorkerProfile worker={worker} />
            ) : (
              <div className="card">
                <p style={{ margin: 0, color: "#64748b" }}>
                  Cargando perfil…
                </p>
              </div>
            )}
          </>
        )}

        {section === "adminUsers" && (effectiveRole ?? role) === "superadmin" && (
          <AdminUsers currentUser={user} />
        )}

        {section === "empresas" && (effectiveRole ?? role) !== "trabajador" && (
          <EmpresasView />
        )}

        {section === "obras" && (effectiveRole ?? role) !== "trabajador" && (
          <ObrasView />
        )}

        {section === "templates" && (effectiveRole ?? role) !== "trabajador" && (
          <TemplatesView />
        )}

        {section === "excelTemplates" && (effectiveRole ?? role) !== "trabajador" && (
          <ExcelTemplatesView />
        )}
      </main>
    </div>
  );
}