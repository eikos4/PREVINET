import { useMemo } from "react";

// =========================================================
// 🛑 DEFINICIONES DE TIPOS (Interfáces)
// (Dejamos las interfaces aquí para mantener la estabilidad)
// =========================================================

export type WorkerJourneyStepKey = "fitForWork" | "art" | "irl" | "talks";

interface StepStatus {
  total: number;
  pending: number;
}

export interface WorkerJourneyStatus {
  currentStep: WorkerJourneyStepKey | "done";
  steps: Record<WorkerJourneyStepKey, StepStatus>;
}

export interface Worker {
  nombre: string;
  cargo: string;
  obra: string;
  id: string;
}

// =========================================================
// ✅ COMPONENTE PRINCIPAL
// =========================================================

// --- TIPOS DE ICONOS (Sin cambios) ---
const StepIcons = {
  fitForWork: () => (
    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a12.004 12.004 0 00-7.332 2.946m16.664 0A12.004 12.004 0 0112 21.056c-3.176 0-6.103-1.05-8.332-2.88"
      />
    </svg>
  ),
  art: () => (
    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  ),
  irl: () => (
    <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  ),
  talks: () => (
    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
  Refresh: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 4m0 4v5h.582m15.356-2a8.001 8.001 0 01-14.708 7.334"
      />
    </svg>
  ),
  Profile: () => (
    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"
      />
    </svg>
  ),
};

type Props = {
  worker: Worker;
  status: WorkerJourneyStatus | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onGoTo: (section: "fitForWork" | "art" | "irl" | "talks" | "profile") => void;
};

export default function WorkerJourney({ worker, status, loading, error, onRefresh, onGoTo }: Props) {
  // --- LÓGICA DE DATOS (SIN CAMBIOS) ---
  const steps = useMemo(() => {
    const list: Array<{
      key: WorkerJourneyStepKey;
      title: string;
      subtitle: string;
      icon: keyof typeof StepIcons;
      actionLabel: string;
      actionSection: "fitForWork" | "art" | "irl" | "talks";
    }> = [
      {
        key: "fitForWork",
        title: "Evaluación Fit-for-Work",
        subtitle: "Evaluación diaria (Estado de salud de hoy)",
        icon: "fitForWork",
        actionLabel: "Completar Evaluación",
        actionSection: "fitForWork",
      },
      {
        key: "art",
        title: "Análisis de Riesgo (ART/AST)",
        subtitle: "Documentos de la jornada a firmar",
        icon: "art",
        actionLabel: "Firmar ART",
        actionSection: "art",
      },
      {
        key: "irl",
        title: "Instrucción de Riesgo Específico (IRL)",
        subtitle: "Lectura, preguntas y firma de documentos",
        icon: "irl",
        actionLabel: "Revisar IRL",
        actionSection: "irl",
      },
      {
        key: "talks",
        title: "Charlas de Seguridad",
        subtitle: "Charlas diarias o asignadas",
        icon: "talks",
        actionLabel: "Firmar Charlas",
        actionSection: "talks",
      },
    ];
    return list;
  }, []);

  const doneCount = useMemo(() => {
    if (!status) return 0;
    return steps.filter((s) => status.steps[s.key].pending === 0).length;
  }, [status, steps]);

  const activeKey = status?.currentStep === "done" ? null : (status?.currentStep ?? null);
  // --- FIN LÓGICA DE DATOS ---

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-slate-800 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="min-w-0">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white m-0 truncate">Inicia tu Jornada Hoy</h3>
              <p className="text-xs sm:text-sm text-blue-200 mt-1 m-0 truncate">
                {worker.nombre} · {worker.cargo} · {worker.obra}
              </p>
            </div>

            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-70 shadow-md flex-shrink-0"
              onClick={onRefresh}
              disabled={loading}
            >
              <StepIcons.Refresh />
              {loading ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex justify-between items-center gap-3">
              <div>
                <div className="text-base font-bold text-blue-800">Progreso Diario</div>
                <div className="text-sm text-blue-700 mt-0.5">
                  {status?.currentStep === "done"
                    ? "Jornada completada con éxito. ¡A trabajar!"
                    : "Completa los pasos en orden para habilitar el siguiente."}
                </div>
              </div>
              <div className="text-lg font-extrabold text-blue-900 flex-shrink-0">
                {doneCount}/{steps.length}
              </div>
            </div>

            <div className="mt-3 h-2.5 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.round((doneCount / steps.length) * 100)}%`,
                  background: "linear-gradient(90deg, #3b82f6, #0ea5e9)",
                }}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-300">
              <p className="text-sm text-red-700 font-medium">⚠️ Error al cargar el estado: {error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {steps.map((s, idx) => {
              const counts = status?.steps[s.key] ?? { pending: 0, total: 0 };
              const completed = counts.pending === 0;
              const active = activeKey === s.key;
              const locked = !completed && activeKey !== null && !active;
              const IconComponent = StepIcons[s.icon];

              const cardClasses = [
                "rounded-xl",
                "border",
                "p-4",
                "transition-all",
                "duration-300",
                active ? "border-blue-500 bg-blue-50 shadow-lg transform scale-[1.01]" : "border-gray-200 bg-white hover:shadow-sm",
                locked ? "opacity-50 pointer-events-none" : "",
              ]
                .filter(Boolean)
                .join(" ");

              const statusTagClasses = completed
                ? "bg-green-100 text-green-700 border-green-300"
                : "bg-red-100 text-red-700 border-red-300";

              return (
                <div key={s.key} className={cardClasses}>
                  <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                    <div className="flex gap-4 items-start flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 flex items-center justify-center rounded-lg border flex-shrink-0 ${
                          active ? "bg-blue-100 border-blue-400" : "bg-gray-100 border-gray-200"
                        }`}
                      >
                        <IconComponent />
                      </div>

                      <div className="pt-0.5 min-w-0">
                        <div className="text-base font-bold text-gray-900 flex items-center truncate">
                          {idx + 1}. {s.title}
                          {active && (
                            <span className="ml-3 px-2 py-0.5 text-xs font-semibold bg-blue-600 text-white rounded-full hidden sm:inline-block">
                              ACTUAL
                            </span>
                          )}
                          {completed && !active && (
                            <span className="ml-3 px-2 py-0.5 text-xs font-semibold bg-green-500 text-white rounded-full hidden sm:inline-block">
                              ✓ LISTO
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 mt-0.5 truncate">{s.subtitle}</div>

                        <div className={`mt-2 px-3 py-1 text-xs font-medium rounded-full border w-fit ${statusTagClasses}`}>
                          {counts.total === 0
                            ? "Sin asignaciones"
                            : completed
                              ? "Sin pendientes (Completado)"
                              : `${counts.pending} pendiente(s) de ${counts.total}`}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`mt-3 sm:mt-0 w-full sm:w-auto flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        active && !completed
                          ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                          : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      } disabled:opacity-50 disabled:shadow-none`}
                      onClick={() => onGoTo(s.actionSection)}
                      disabled={locked}
                    >
                      {s.actionLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="text-sm font-bold text-gray-800">Mi Perfil</div>
              <div className="text-sm text-gray-600 mt-0.5">Revisa tu estado, documentos firmados y datos laborales.</div>
            </div>

            <button
              type="button"
              className="mt-2 sm:mt-0 w-full sm:w-auto flex items-center justify-center sm:justify-start px-4 py-2 text-sm font-medium rounded-lg text-blue-700 bg-white border border-blue-300 hover:bg-blue-50 transition-colors shadow-sm"
              onClick={() => onGoTo("profile")}
            >
              <StepIcons.Profile />
              Ir a Mi perfil
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}