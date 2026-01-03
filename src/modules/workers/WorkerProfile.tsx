import { useState } from "react";
import type { Worker } from "./worker.service";
import TemplateSigner from "../templates/TemplateSigner";
import {
  downloadBlobAsFile,
  getSignedWorkerEnrollmentPdfByKey,
} from "./workerEnrollmentPdf.service";

// --- ÍCONOS (SIN CAMBIOS FUNCIONALES) ---
const Icons = {
  User: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  ID: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-4 0h4" />
    </svg>
  ),
  Building: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8v-4a1 1 0 011-1h2a1 1 0 011 1v4" />
    </svg>
  ),
  Contact: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Hazard: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  PDF: () => (
    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0011.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
};

// Componente de Campo (Field Component)
const Field = ({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactElement }) => (
  <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100 transition-shadow hover:shadow-md">
    <div className="text-blue-600 flex-shrink-0 mt-0.5">{icon}</div>
    <div className="flex flex-col">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className="text-sm text-gray-900 mt-0.5 font-medium">{value}</span>
    </div>
  </div>
);

export default function WorkerProfile({ worker }: { worker: Worker }) {
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  
  // Lógica original para calcular las exposiciones
  const exp = worker.expuestoA;
  const expParts = [
    exp?.alturaFisica ? "Altura física" : null,
    exp?.ruidos ? "Ruidos" : null,
    exp?.otros ? `Otros${exp?.otrosDetalle ? ` (${exp.otrosDetalle})` : ""}` : null,
  ].filter(Boolean) as string[];

  // Función de descarga (lógica original)
  const handleDownloadPdf = async () => {
    if (!worker.enrolamientoToken) return;
    setError("");
    setDownloading(true);
    try {
      const rec = await getSignedWorkerEnrollmentPdfByKey({
        workerId: worker.id,
        token: worker.enrolamientoToken,
      });
      if (!rec) throw new Error("No se encontró el PDF firmado de enrolamiento");
      downloadBlobAsFile(rec.pdf, rec.fileName);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo descargar";
      setError(msg);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8">
      
      {/* Tarjeta Principal de Perfil */}
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
        
        {/* Encabezado: Diseño de color consistente */}
        <div className="bg-slate-800 px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-2xl font-extrabold text-white flex items-center gap-3 m-0">
            <span className="text-3xl">👷‍♂️</span>
            <span>Perfil del Trabajador</span>
          </h3>
          <span
            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold shadow-lg ${
              worker.habilitado
                ? "bg-green-500 text-white" 
                : "bg-red-500 text-white" 
            }`}
          >
            <span className="mr-1.5">
              <Icons.Check />
            </span>
            {worker.habilitado ? "Habilitado" : "No Habilitado"}
          </span>
        </div>

        {/* Contenido: Grid de Información Estructurada */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Bloque: Identificación y Contacto */}
          <section>
            <h4 className="text-xl font-bold text-blue-700 mb-4 border-b pb-2">Información Personal y Laboral</h4>
            
            {/* Grid responsivo: 1 col (móvil) -> 2 col (sm) -> 3 col (md) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Field 
                label="Nombre Completo" 
                value={<span className="font-bold">{worker.nombre}</span>} 
                icon={<Icons.User />} 
              />
              <Field 
                label="RUT" 
                value={worker.rut} 
                icon={<Icons.ID />} 
              />
              <Field 
                label="Cargo Actual" 
                value={worker.cargo} 
                icon={<Icons.User />} 
              />
              <Field 
                label="Obra / Faena" 
                value={worker.obra} 
                icon={<Icons.Building />} 
              />
              <Field 
                label="Empresa" 
                value={
                  <>
                    <span className="font-semibold">{worker.empresaNombre}</span>
                    {worker.empresaRut && (<span className="text-gray-500 ml-1">({worker.empresaRut})</span>)}
                  </>
                } 
                icon={<Icons.Building />} 
              />
              {worker.telefono && (
                <Field 
                  label="Teléfono de Contacto" 
                  value={worker.telefono} 
                  icon={<Icons.Contact />} 
                />
              )}
            </div>
          </section>
          
          <hr className="border-gray-200"/>

          {/* Bloque: Salud y Enrolamiento */}
          <section>
            <h4 className="text-xl font-bold text-blue-700 mb-4 border-b pb-2">Salud Ocupacional y Documentación</h4>
            
            {/* Grid para riesgo y enrolamiento: Riesgo siempre ocupa 2/3 en PC. */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Campo: Expuesto a */}
              <div className="lg:col-span-2">
                <Field
                  label="Expuesto a Riesgos"
                  icon={<Icons.Hazard />}
                  value={
                    <div className="flex flex-wrap gap-2 pt-1">
                      {expParts.length > 0 ? (
                        expParts.map((part, index) => (
                          <span key={index} className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full border border-blue-200 shadow-sm">
                            {part}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 italic">- Sin exposición crítica especificada -</span>
                      )}
                    </div>
                  }
                />
              </div>

              {/* Campo: Enrolamiento (Siempre al lado derecho en PC) */}
              {worker.enrolamientoFirmadoEn && (
                <div className="lg:col-span-1">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-300 shadow-sm h-full flex flex-col justify-between">
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Documento de Enrolamiento</span>
                    <p className="text-sm text-gray-700 mt-1">
                      Firmado: **{new Date(worker.enrolamientoFirmadoEn).toLocaleDateString("es-CL", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}**
                    </p>
                    {worker.enrolamientoToken && (
                      <button
                        type="button"
                        className="mt-3 flex items-center justify-center w-full py-2 px-3 text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={downloading}
                        onClick={handleDownloadPdf}
                      >
                        <Icons.PDF />
                        {downloading ? "Descargando..." : "Descargar PDF firmado"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Manejo de Errores Profesional */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-300">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ **Error de Descarga:** {error}
              </p>
            </div>
          )}

        </div>
      </div>
      
      {/* Componente de Firma (Manteniendo el espacio) */}
      <TemplateSigner worker={worker} title="Firmar documento (plantillas)" />
    </div>
  );
}