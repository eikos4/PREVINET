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
    <div className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8 py-3 sm:py-8 space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header Section */}
        <div className="bg-slate-800 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="min-w-0 w-full sm:w-auto">
              <h3 className="text-xl sm:text-2xl font-extrabold text-white m-0 leading-tight">
                Inicia tu Jornada
              </h3>
              <p className="text-sm text-blue-200 mt-1 m-0 truncate">
                {worker.nombre}
              </p>
              <p className="text-xs text-blue-300 m-0 truncate">
                {worker.cargo} · {worker.obra}
              </p>
            </div>

            <button
              type="button"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-70 shadow-md"
              onClick={onRefresh}
              disabled={loading}
            >
              <StepIcons.Refresh />
              {loading ? "Actualizando..." : "Actualizar datos"}
            </button>
          </div>
        </div>

        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Progress Section */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex justify-between items-center gap-3">
              <div>
                <div className="text-sm sm:text-base font-bold text-blue-800">Progreso Diario</div>
                <div className="text-xs sm:text-sm text-blue-700 mt-0.5 leading-snug">
                  {status?.currentStep === "done"
                    ? "¡Jornada completada! Todo listo."
                    : "Sigue los pasos en orden."}
                </div>
              </div>
              <div className="text-lg font-extrabold text-blue-900 flex-shrink-0 bg-white px-3 py-1 rounded-lg border border-blue-100 shadow-sm">
                {doneCount}/{steps.length}
              </div>
            </div>

            <div className="mt-3 h-3 bg-blue-200 rounded-full overflow-hidden border border-blue-200/50">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{
                  width: `${Math.round((doneCount / steps.length) * 100)}%`,
                  background: "linear-gradient(90deg, #3b82f6, #0ea5e9)",
                }}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-300">
              <p className="text-sm text-red-700 font-medium flex items-center gap-2">
                <span>⚠️</span> Error: {error}
              </p>
            </div>
          )}

          {/* Steps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
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
                "duration-200",
                active
                  ? "border-blue-500 bg-blue-50/50 shadow-md ring-1 ring-blue-500/20"
                  : "border-gray-200 bg-white shadow-sm",
                locked ? "opacity-60 grayscale-[0.5]" : "",
              ]
                .filter(Boolean)
                .join(" ");

              return (
                <div key={s.key} className={cardClasses}>
                  <div className="flex flex-col gap-4">
                    {/* Top Part: Icon + Texts */}
                    <div className="flex gap-3 items-start">
                      <div
                        className={`w-12 h-12 flex items-center justify-center rounded-xl border flex-shrink-0 shadow-sm ${active ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-gray-50 border-gray-200 text-gray-500"
                          }`}
                      >
                        <div className="scale-110"><IconComponent /></div>
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-sm sm:text-base font-bold ${active ? 'text-blue-900' : 'text-gray-800'}`}>
                            {idx + 1}. {s.title}
                          </span>

                          {active && (
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-blue-600 text-white rounded-full tracking-wide shadow-sm">
                              Actual
                            </span>
                          )}
                          {completed && !active && (
                            <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-green-500 text-white rounded-full tracking-wide shadow-sm">
                              Listo
                            </span>
                          )}
                        </div>

                        <div className="text-xs sm:text-sm text-gray-500 leading-snug mb-2">
                          {s.subtitle}
                        </div>

                        {/* Status Chip Inline */}
                        <div className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-md border ${completed
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-orange-50 text-orange-700 border-orange-200"
                          }`}>
                          {counts.total === 0
                            ? "Sin asignaciones"
                            : completed
                              ? "Completado"
                              : `${counts.pending} pendiente(s)`}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Part: Action Button */}
                    <button
                      type="button"
                      className={`w-full py-2.5 px-4 text-sm font-bold rounded-lg transition-all active:scale-[0.98] ${active && !completed
                          ? "bg-blue-600 text-white shadow-blue-500/30 shadow-lg hover:bg-blue-700"
                          : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                        } disabled:opacity-50 disabled:shadow-none disabled:active:scale-100`}
                      onClick={() => onGoTo(s.actionSection)}
                      disabled={locked}
                    >
                      {locked ? "Bloqueado" : s.actionLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl text-gray-600 bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
              onClick={() => onGoTo("profile")}
            >
              <StepIcons.Profile />
              Ver Mi Perfil completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}