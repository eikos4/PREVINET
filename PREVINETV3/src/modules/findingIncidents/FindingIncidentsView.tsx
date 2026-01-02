import { useEffect, useMemo, useState } from "react";
// Asegúrate de que las rutas y tipos importados sean correctos
import FindingIncidentForm from "./FindingIncidentForm";
import FindingIncidentList from "./FindingIncidentList";
import { getFindingIncidents, type FindingIncident } from "./findingIncident.service";

// --- ÍCONOS (CLAVES DEFINIDAS PARA CADA USO) ---
const MetricIcons = {
  // Íconos PRINCIPALES del Header (Blanco/Azul)
  TotalHeader: (color: string) => <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  AlertaHeader: (color: string) => <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  DoneHeader: (color: string) => <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,

  // Íconos de las tarjetas de métricas (Usados en ModernMetricCard)
  Total: (color: string) => <svg className={`w-6 h-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Abierto: (color: string) => <svg className={`w-6 h-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10 20h4m-4 0a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>,
  Proceso: (color: string) => <svg className={`w-6 h-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Cerrado: (color: string) => <svg className={`w-6 h-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Hallazgo: (color: string) => <svg className={`w-6 h-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v13m-8 0h16.03M12 10.3l3.75-2.165m-7.5 0L12 10.3m-7.5 0a9 9 0 1115 0a9 9 0 01-15 0" /></svg>,
  Porcentaje: (color: string) => <svg className={`w-6 h-6 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
  
  // SOLUCIÓN: Nuevas claves para tarjetas que usan SVGs del Header
  IncidenciasCard: (color: string) => MetricIcons.AlertaHeader(color),
  Registros7D: (color: string) => MetricIcons.TotalHeader(color),
  CerradosCard: (color: string) => MetricIcons.DoneHeader(color), // Usaremos este para "Cerrados (Mes)"
  
  // Íconos de utilidad
  Register: () => <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>,
  Refresh: (color: string) => <svg className={`w-4 h-4 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 4m0 4v5h.582m15.356-2a8.001 8.001 0 01-14.708 7.334" /></svg>,
};

// --- COMPONENTE DE TARJETA DE MÉTRICA (Sin cambios funcionales) ---
function ModernMetricCard({ label, value, icon, colorClass, subText }: { label: string; value: string | number; icon: keyof typeof MetricIcons, colorClass: string, subText: string }) {
  const IconComponent = MetricIcons[icon];
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all hover:shadow-lg hover:border-blue-100">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {/* Ícono destacado en cuadrado azul claro */}
        <div className={`p-3 rounded-lg flex-shrink-0 bg-blue-50 ${colorClass}`}>
          {IconComponent(colorClass)}
        </div>
        
        {/* Contenido de la métrica */}
        <div>
          <div className="text-sm font-semibold text-gray-500">{label}</div>
          <div className="text-2xl font-extrabold text-gray-900 mt-0.5 leading-tight">
            {value}
          </div>
          <div className="text-xs text-gray-400 mt-1">{subText}</div>
        </div>
      </div>
    </div>
  );
}

// --- VISTA PRINCIPAL ---
export default function FindingIncidentsView({
  readOnly,
  canCreate,
  currentUserId,
  defaultObra,
}: {
  readOnly: boolean;
  canCreate: boolean;
  currentUserId?: string;
  defaultObra?: string;
}) {
  const [reloadKey, setReloadKey] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<FindingIncident[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = () => setReloadKey((k) => k + 1);

  // Efecto para la carga de datos
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
        getFindingIncidents()
          .then(setItems)
          .catch(() => setItems([]))
          .finally(() => setLoading(false));
    }, 500);

    return () => clearTimeout(timer);
  }, [reloadKey]);

  // Lógica de Métricas
  const metrics = useMemo(() => {
    // ... (Lógica de cálculo omitida para brevedad, asumiendo que funciona)
    const total = items.length;
    const abiertos = items.filter((x) => x.estado === "ABIERTO").length;
    const enProceso = items.filter((x) => x.estado === "EN_PROCESO").length;
    const cerrados = items.filter((x) => x.estado === "CERRADO").length;
    const hallazgos = items.filter((x) => x.tipo === "HALLAZGO").length;
    const incidencias = items.filter((x) => x.tipo === "INCIDENCIA").length;

    const last7Count = (() => {
      const now = new Date();
      const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return items.filter((x) => {
        try { return new Date(x.creadoEn) >= since; } catch { return false; }
      }).length;
    })();

    const closureRate = total > 0 ? Math.round((cerrados / total) * 100) : 0;
    
    const statusColor = {
        total: 'text-white',
        abiertos: 'text-yellow-400',
        cerrados: 'text-green-400'
    }

    return { total, abiertos, enProceso, cerrados, hallazgos, incidencias, last7Count, closureRate, statusColor };
  }, [items]);

  if (loading && reloadKey === 0) {
    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
             <div className="bg-gray-200 rounded-3xl h-96 shadow-xl"></div>
             <p className="text-center mt-4 text-gray-500">Cargando dashboard...</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* --- SECCIÓN PRINCIPAL: ENCABEZADO AZUL (USOS CORRECTOS DE HEADER ICONS) --- */}
        <div className="bg-slate-800 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-6 border-b border-gray-700">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6 lg:gap-8">
            
            <div className="max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Gestión de Hallazgos e Incidencias
              </h2>
              <p className="text-sm text-slate-300 mt-2">
                Monitoreo en tiempo real de la seguridad y calidad. Utiliza este panel para identificar
                patrones de riesgo y registrar nuevas observaciones en obra.
              </p>
            </div>

            <div className="flex flex-col lg:items-end gap-3 sm:gap-4 w-full lg:w-auto">
                
                {canCreate && !readOnly && (
                    <button
                        type="button"
                        className="flex items-center justify-center px-5 py-2 text-sm sm:text-md font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg w-full sm:w-auto"
                        onClick={() => setOpen(true)}
                    >
                        <MetricIcons.Register />
                        Registrar Hallazgo
                    </button>
                )}

                <div className="flex flex-wrap gap-3 p-3 bg-slate-700 rounded-lg w-full sm:w-auto">
                    {/* Total (Uso: MetricIcons.TotalHeader(color)) */}
                    <div className="text-center">
                        <div className="text-xs font-medium text-slate-300 flex items-center justify-center gap-1">
                            {MetricIcons.TotalHeader(metrics.statusColor.total)} Total
                        </div>
                        <div className="text-xl font-bold text-white mt-1">{metrics.total}</div>
                    </div>
                    <div className="w-px bg-slate-600 my-1"></div>
                    
                    {/* Abiertos (Uso: MetricIcons.AlertaHeader(color)) */}
                    <div className="text-center">
                        <div className="text-xs font-medium text-slate-300 flex items-center justify-center gap-1">
                             {MetricIcons.AlertaHeader(metrics.statusColor.abiertos)} Pendientes
                        </div>
                        <div className="text-xl font-bold text-yellow-400 mt-1">{metrics.abiertos}</div>
                    </div>
                    <div className="w-px bg-slate-600 my-1"></div>

                    {/* Cerrados (Uso: MetricIcons.DoneHeader(color)) */}
                    <div className="text-center">
                        <div className="text-xs font-medium text-slate-300 flex items-center justify-center gap-1">
                            {MetricIcons.DoneHeader(metrics.statusColor.cerrados)} Cerrados
                        </div>
                        <div className="text-xl font-bold text-green-400 mt-1">{metrics.cerrados}</div>
                    </div>
                </div>

            </div>
          </div>
        </div>

        {/* --- SECCIÓN 2: GRID DE MÉTRICAS DETALLADAS (USOS CORREGIDOS DE CLAVES) --- */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Métricas de Rendimiento</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* FILA 1: Totales y Estados */}
              <ModernMetricCard 
                label="Total Registrado" 
                value={metrics.total} 
                icon="Total" // Clave correcta
                colorClass="text-blue-600" 
                subText={`+${metrics.last7Count} en los últimos 7 días`} 
              />
              <ModernMetricCard 
                label="Abiertos (Riesgo)" 
                value={metrics.abiertos} 
                icon="Abierto" // Clave correcta
                colorClass="text-red-600" 
                subText="Requieren acción inmediata" 
              />
              <ModernMetricCard 
                label="En Proceso (Seguimiento)" 
                value={metrics.enProceso} 
                icon="Proceso" // Clave correcta
                colorClass="text-yellow-600" 
                subText="En etapa de corrección/auditoría" 
              />
              <ModernMetricCard 
                label="Tasa de Cierre" 
                value={`${metrics.closureRate}%`} 
                icon="Porcentaje" // Clave correcta
                colorClass="text-green-600" 
                subText={`${metrics.cerrados} cerrados de ${metrics.total} totales`} 
              />

              {/* FILA 2: Tipos y Tiempo */}
              <ModernMetricCard 
                label="Clasificación: Hallazgos" 
                value={metrics.hallazgos} 
                icon="Hallazgo" // Clave correcta
                colorClass="text-indigo-600" 
                subText="Observaciones preventivas" 
              />
              <ModernMetricCard 
                label="Clasificación: Incidencias" 
                value={metrics.incidencias} 
                icon="IncidenciasCard" // <--- SOLUCIÓN: Usando la nueva clave
                colorClass="text-purple-600" 
                subText="Eventos no deseados registrados" 
              />
              <ModernMetricCard 
                label="Registros (7 Días)" 
                value={metrics.last7Count} 
                icon="Registros7D" // <--- SOLUCIÓN: Usando la nueva clave
                colorClass="text-teal-600" 
                subText="Frecuencia reciente de registro" 
              />
              <ModernMetricCard 
                label="Cerrados (Mes)" 
                value={metrics.cerrados} 
                icon="Cerrado" // Clave correcta
                colorClass="text-blue-600" 
                subText="Cierre total acumulado" 
              />
            </div>
        </div>


        {/* --- SECCIÓN 3: LISTADO DETALLADO --- */}
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
             <h3 className="text-lg sm:text-xl font-bold text-gray-800">Listado de Hallazgos e Incidencias</h3>
             <button
                type="button"
                onClick={refresh} 
                disabled={loading}
                className="flex items-center justify-center sm:justify-start text-sm font-medium px-3 py-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50 w-full sm:w-auto"
              >
                {MetricIcons.Refresh("text-blue-600")}
                <span className="ml-1.5">{loading ? "Actualizando..." : "Recargar Lista"}</span>
              </button>
          </div>
          
          <FindingIncidentList
            readOnly={readOnly}
            currentUserId={currentUserId}
            reloadKey={reloadKey}
            variant="embedded"
            onMutated={refresh} 
          />
        </div>
      </div>

      {/* --- MODAL DE REGISTRO --- */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 transition-opacity duration-300"
          style={{ background: "rgba(0,0,0,0.65)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full"
            style={{ maxWidth: 960, maxHeight: "95vh", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-blue-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-lg font-bold text-blue-800">Registrar Nuevo Elemento</div>
                <div className="text-sm text-blue-600">Completa el formulario para documentar el evento.</div>
              </div>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-3 sm:p-6 overflow-y-auto" style={{ maxHeight: "calc(95vh - 88px)" }}>
              <FindingIncidentForm
                creadoPorUserId={currentUserId ?? ""}
                defaultObra={defaultObra}
                onCreated={() => {
                  setOpen(false);
                  refresh();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}