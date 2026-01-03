import { useMemo, useState } from "react";
import {
  addFindingIncident,
  type EvidenceAttachment,
  type FindingIncidentType,
} from "./findingIncident.service";

// Iconos inline para no depender de librerías externas en este ejemplo
const Icons = {
  Hallazgo: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Incidencia: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Clip: () => (
    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  )
};

export default function FindingIncidentForm({
  creadoPorUserId,
  defaultObra,
  onCreated,
}: {
  creadoPorUserId?: string;
  defaultObra?: string;
  onCreated: () => void;
}) {
  // --- 100% FUNCIONALIDAD ORIGINAL (LOGIC) ---
  const [tipo, setTipo] = useState<FindingIncidentType>("HALLAZGO");

  const [obra, setObra] = useState(defaultObra ?? "");
  const [lugar, setLugar] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");

  const [descripcion, setDescripcion] = useState("");

  const [riesgoPotencial, setRiesgoPotencial] = useState("");
  const [responsable, setResponsable] = useState("");
  const [recomendacion, setRecomendacion] = useState("");
  const [plazoResolver, setPlazoResolver] = useState("");

  const [personasInvolucradas, setPersonasInvolucradas] = useState("");
  const [consecuencias, setConsecuencias] = useState("");
  const [causasProbables, setCausasProbables] = useState("");
  const [medidasInmediatas, setMedidasInmediatas] = useState("");

  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  const tipoLabel = useMemo(() => {
    return tipo === "HALLAZGO" ? "Hallazgo" : "Incidencia";
  }, [tipo]);

  const handleSubmit = async () => {
    setError("");

    if (!obra.trim() || !lugar.trim() || !fecha || !descripcion.trim()) {
      setError("Completa obra, lugar, fecha y descripción");
      return;
    }

    if (tipo === "HALLAZGO") {
      if (!riesgoPotencial.trim() || !responsable.trim() || !recomendacion.trim()) {
        setError("Completa riesgo potencial, responsable y recomendación");
        return;
      }
    }

    if (tipo === "INCIDENCIA") {
      if (!hora.trim()) {
        setError("Completa la hora del evento");
        return;
      }
      if (!consecuencias.trim() || !causasProbables.trim() || !medidasInmediatas.trim()) {
        setError("Completa consecuencias, causas probables y medidas inmediatas");
        return;
      }
    }

    const evidencias: EvidenceAttachment[] = files.map((f) => ({
      id: crypto.randomUUID(),
      fileName: f.name,
      mimeType: f.type || "application/octet-stream",
      blob: f,
      creadoEn: new Date(),
    }));

    await addFindingIncident({
      tipo,
      obra: obra.trim(),
      lugar: lugar.trim(),
      fecha,
      hora: hora.trim() || undefined,
      descripcion: descripcion.trim(),
      riesgoPotencial: tipo === "HALLAZGO" ? riesgoPotencial.trim() : undefined,
      responsable: tipo === "HALLAZGO" ? responsable.trim() : undefined,
      recomendacion: tipo === "HALLAZGO" ? recomendacion.trim() : undefined,
      plazoResolver: tipo === "HALLAZGO" ? (plazoResolver.trim() || undefined) : undefined,
      personasInvolucradas: tipo === "INCIDENCIA" ? (personasInvolucradas.trim() || undefined) : undefined,
      consecuencias: tipo === "INCIDENCIA" ? consecuencias.trim() : undefined,
      causasProbables: tipo === "INCIDENCIA" ? causasProbables.trim() : undefined,
      medidasInmediatas: tipo === "INCIDENCIA" ? medidasInmediatas.trim() : undefined,
      evidencias: evidencias.length > 0 ? evidencias : undefined,
      seguimiento: [],
      creadoPorUserId,
    });

    // Reset fields
    setLugar("");
    setFecha("");
    setHora("");
    setDescripcion("");
    setRiesgoPotencial("");
    setResponsable("");
    setRecomendacion("");
    setPlazoResolver("");
    setPersonasInvolucradas("");
    setConsecuencias("");
    setCausasProbables("");
    setMedidasInmediatas("");
    setFiles([]);
    onCreated();
  };
  // --- FIN LÓGICA ORIGINAL ---

  // --- UI MODERNA ---
  const inputClass = "w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-gray-800 text-sm placeholder-gray-400";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1";

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      
      {/* Header Visual */}
      <div className={`px-6 py-5 border-b ${tipo === "HALLAZGO" ? "bg-indigo-50 border-indigo-100" : "bg-orange-50 border-orange-100"}`}>
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          {tipo === "HALLAZGO" ? <span className="text-indigo-600"><Icons.Hallazgo/></span> : <span className="text-orange-600"><Icons.Incidencia/></span>}
          Registro de {tipoLabel}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {tipo === "HALLAZGO"
            ? "Reporte preventivo de condiciones inseguras detectadas."
            : "Reporte de eventos no deseados ocurridos en obra."}
        </p>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Selector de Tipo (Tabs Modernos) */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setTipo("HALLAZGO")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              tipo === "HALLAZGO" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icons.Hallazgo /> Hallazgo
          </button>
          <button
            onClick={() => setTipo("INCIDENCIA")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
              tipo === "INCIDENCIA" ? "bg-white text-orange-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icons.Incidencia /> Incidencia
          </button>
        </div>

        {/* Grupo: Contexto */}
        <section>
          <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4">📍 Contexto del Evento</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Obra / Faena</label>
              <input placeholder="Ej. Edificio Alto Las Condes" value={obra} onChange={(e) => setObra(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Lugar Exacto</label>
              <input placeholder="Ej. Piso 3, Sector Norte" value={lugar} onChange={(e) => setLugar(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
            </div>
            {tipo === "INCIDENCIA" && (
              <div>
                <label className={labelClass}>Hora</label>
                <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={inputClass} />
              </div>
            )}
          </div>
        </section>

        {/* Grupo: Detalles */}
        <section>
          <h4 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4">📝 Descripción General</h4>
          <div>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              placeholder={tipo === "HALLAZGO" ? "Describa la condición subestándar observada..." : "Relate cronológicamente qué sucedió..."}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>
        </section>

        {/* Grupo: Campos Dinámicos */}
        <section className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-bold text-gray-900 mb-4">
            {tipo === "HALLAZGO" ? "🛡️ Análisis de Riesgo" : "🚨 Análisis del Incidente"}
          </h4>
          
          <div className="space-y-4">
            {tipo === "HALLAZGO" ? (
              <>
                <div>
                  <label className={labelClass}>Riesgo Potencial</label>
                  <textarea className={inputClass} placeholder="¿Qué podría pasar si no se arregla?" value={riesgoPotencial} onChange={(e) => setRiesgoPotencial(e.target.value)} rows={2} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Responsable</label>
                    <input className={inputClass} placeholder="Nombre del responsable" value={responsable} onChange={(e) => setResponsable(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Plazo (Opcional)</label>
                    <input className={inputClass} placeholder="Ej. Inmediato, 24 horas..." value={plazoResolver} onChange={(e) => setPlazoResolver(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Recomendación</label>
                  <textarea className={inputClass} placeholder="Acción correctiva sugerida" value={recomendacion} onChange={(e) => setRecomendacion(e.target.value)} rows={2} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className={labelClass}>Personas Involucradas (Opcional)</label>
                  <textarea className={inputClass} rows={2} placeholder="Nombres de los afectados..." value={personasInvolucradas} onChange={(e) => setPersonasInvolucradas(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Consecuencias</label>
                    <textarea className={inputClass} rows={3} placeholder="Daños materiales o lesiones..." value={consecuencias} onChange={(e) => setConsecuencias(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Causas Probables</label>
                    <textarea className={inputClass} rows={3} placeholder="¿Por qué ocurrió?" value={causasProbables} onChange={(e) => setCausasProbables(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Medidas Inmediatas</label>
                  <textarea className={inputClass} rows={2} placeholder="¿Qué se hizo al momento?" value={medidasInmediatas} onChange={(e) => setMedidasInmediatas(e.target.value)} />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Zona de Archivos */}
        <section>
          <label className="block text-sm font-medium text-gray-700 mb-2">Evidencia Fotográfica / Documental</label>
          <div className="relative group">
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 group-hover:bg-gray-100 group-hover:border-indigo-400 transition-colors">
              <Icons.Upload />
              <p className="mt-2 text-sm text-gray-500">
                <span className="font-semibold text-indigo-600">Haz click para subir</span> o arrastra archivos aquí
              </p>
              <p className="text-xs text-gray-400 mt-1">Soporta imágenes y documentos</p>
            </div>
          </div>
          
          {/* Lista de archivos seleccionados */}
          {files.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium border border-indigo-100">
                  <Icons.Clip />
                  <span className="truncate max-w-[150px]">{file.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Errores */}
        {error && (
          <div className="p-4 rounded-md bg-red-50 border border-red-200">
            <div className="flex gap-3">
              <div className="text-red-500">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-100">
          <button
            className={`w-full py-3 px-4 rounded-lg text-white font-semibold shadow-md transform transition hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 ${
              tipo === "HALLAZGO" 
                ? "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500" 
                : "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500"
            }`}
            onClick={handleSubmit}
          >
            Guardar {tipoLabel}
          </button>
        </div>
      </div>
    </div>
  );
}