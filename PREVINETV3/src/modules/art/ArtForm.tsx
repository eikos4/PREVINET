import { useEffect, useState } from "react";
import { addART } from "./art.service";

import { getWorkers } from "../workers/worker.service";
import type { Worker } from "../workers/worker.service";
import { createObra, listObras, type Obra } from "../obras/obras.service";
import { getCurrentUser } from "../auth/auth.service";

export default function ArtForm({
  onCreated,
  creadoPorUserId,
}: {
  onCreated: () => void;
  creadoPorUserId?: string;
}) {
  const [mode, setMode] = useState<"form" | "file">("form");
  const [obraId, setObraId] = useState<string>("");
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraQuickName, setObraQuickName] = useState("");
  const [fecha, setFecha] = useState("");
  const [riesgos, setRiesgos] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [q1, setQ1] = useState("");
  const [q1o1, setQ1o1] = useState("");
  const [q1o2, setQ1o2] = useState("");
  const [q1o3, setQ1o3] = useState("");
  const [q1Correct, setQ1Correct] = useState<number>(0);
  const [q2, setQ2] = useState("");
  const [q2o1, setQ2o1] = useState("");
  const [q2o2, setQ2o2] = useState("");
  const [q2o3, setQ2o3] = useState("");
  const [q2Correct, setQ2Correct] = useState<number>(0);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getWorkers().then(setWorkers);
    listObras()
      .then((all) => setObras(all.filter((o) => o.estado !== "inactiva")))
      .catch(() => setObras([]));
  }, []);

  const toggleWorker = (id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((w) => w !== id)
        : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setError("");

    if (!obraId || !fecha || selected.length === 0) {
      setError("Completa obra, fecha y selecciona al menos un trabajador");
      return;
    }

    const obra = obras.find((o) => o.id === obraId)?.nombre || "";
    if (!obra.trim()) {
      setError("Selecciona la obra/faena");
      return;
    }

    const normalizedQ1 = q1.trim();
    const normalizedQ2 = q2.trim();
    const q1Options = [q1o1, q1o2, q1o3].map((x) => x.trim()).filter(Boolean);
    const q2Options = [q2o1, q2o2, q2o3].map((x) => x.trim()).filter(Boolean);

    if (!normalizedQ1 || !normalizedQ2) {
      setError("Debes ingresar 2 preguntas de verificación");
      return;
    }

    if (q1Options.length < 2 || q2Options.length < 2) {
      setError("Cada pregunta debe tener al menos 2 alternativas");
      return;
    }

    if (q1Correct < 0 || q1Correct >= q1Options.length || q2Correct < 0 || q2Correct >= q2Options.length) {
      setError("Debes marcar una alternativa correcta por pregunta");
      return;
    }

    if (mode === "file") {
      if (!attachment) {
        setError("Selecciona un archivo (PDF o Word)");
        return;
      }

      const name = (attachment.name || "").toLowerCase();
      const looksPdf = name.endsWith(".pdf");
      const looksDoc = name.endsWith(".doc") || name.endsWith(".docx");

      const isAllowed =
        attachment.type === "application/pdf" ||
        attachment.type === "application/msword" ||
        attachment.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        looksPdf ||
        looksDoc;

      if (!isAllowed) {
        setError("Formato no soportado. Solo PDF o Word (.doc/.docx)");
        return;
      }
    }

    await addART({
      obra,
      fecha,
      trabajadores: selected,
      asignados: selected.map((workerId) => ({
        workerId,
        token: crypto.randomUUID(),
      })),
      riesgos,
      verificationQuestions: [
        {
          id: "q1",
          question: normalizedQ1,
          options: q1Options,
          correctOptionIndex: q1Correct,
        },
        {
          id: "q2",
          question: normalizedQ2,
          options: q2Options,
          correctOptionIndex: q2Correct,
        },
      ],
      attachment: attachment
        ? {
          fileName: attachment.name,
          mimeType: inferMimeType(attachment.name, attachment.type),
          blob: attachment,
        }
        : undefined,
      cerrado: true,
      creadoPorUserId,
    });

    setObraId("");
    setObraQuickName("");
    setFecha("");
    setRiesgos("");
    setAttachment(null);
    setQ1("");
    setQ1o1("");
    setQ1o2("");
    setQ1o3("");
    setQ1Correct(0);
    setQ2("");
    setQ2o1("");
    setQ2o2("");
    setQ2o3("");
    setQ2Correct(0);
    setSelected([]);
    onCreated();
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 m-0">
            <span className="text-2xl">📝</span>
            <span>Nuevo ART/AST</span>
          </h3>
          <p className="text-slate-300 text-sm mt-1 m-0">
            Análisis de Riesgos del Trabajo para la jornada
          </p>
        </div>

        <div className="p-6">
          {/* MODE SELECTOR - SEGMENTED CONTROL */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-8 max-w-md mx-auto">
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === "form"
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                  : "text-slate-500 hover:text-slate-700"
                }`}
              onClick={() => setMode("form")}
            >
              <span>📋</span>
              <span>Formulario Digital</span>
            </button>
            <button
              type="button"
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${mode === "file"
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                  : "text-slate-500 hover:text-slate-700"
                }`}
              onClick={() => setMode("file")}
            >
              <span>📎</span>
              <span>Cargar Archivo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* OBRA SELECTOR */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Obra / Faena
              </label>
              <select
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                value={obraId}
                onChange={(e) => setObraId(e.target.value)}
              >
                <option value="">-- Selecciona obra --</option>
                {obras
                  .slice()
                  .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"))
                  .map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre}
                    </option>
                  ))}
              </select>

              {/* QUICK CREATE OBRA */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  placeholder="O crea una nueva..."
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                  value={obraQuickName}
                  onChange={(e) => setObraQuickName(e.target.value)}
                />
                <button
                  type="button"
                  className="flex-none bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                  onClick={async () => {
                    if (!obraQuickName.trim()) return;
                    setError("");
                    try {
                      const user = await getCurrentUser();
                      const created = await createObra({
                        nombre: obraQuickName,
                        empresaId: user?.companyId ?? null,
                      });
                      const next = await listObras();
                      setObras(next.filter((o) => o.estado !== "inactiva"));
                      setObraId(created.id);
                      setObraQuickName("");
                    } catch (e) {
                      const msg = e instanceof Error ? e.message : "Error al crear obra";
                      setError(msg);
                    }
                  }}
                  disabled={!obraQuickName.trim()}
                >
                  Crear
                </button>
              </div>
            </div>

            {/* DATE PICKER */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Fecha
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>

          {/* RIESGOS / ARCHIVO */}
          <div className="mb-8">
            <label className="text-sm font-semibold text-slate-700 ml-1 mb-2 block">
              {mode === "form" ? "Riesgos y Medidas Preventivas" : "Documento Adjunto (PDF/Word)"}
            </label>

            {mode === "form" ? (
              <textarea
                className="w-full min-h-[120px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-y"
                placeholder="Describe los riesgos identificados y las medidas a tomar..."
                value={riesgos}
                onChange={(e) => setRiesgos(e.target.value)}
              />
            ) : (
              <div className="relative group">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                />
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${attachment
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400"
                    }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {attachment ? (
                      <>
                        <span className="text-3xl mb-2">📄</span>
                        <p className="text-sm font-semibold text-blue-700 text-center px-4">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                          Click para cambiar archivo
                        </p>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl mb-2 opacity-50">cloud_upload</span>
                        <p className="text-sm text-slate-500">
                          <span className="font-semibold text-blue-600">Click para subir</span> o arrastra y soltar
                        </p>
                        <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* TRABAJADORES */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <span>👷</span>
                <span>Trabajadores Participantes</span>
              </label>
              {selected.length > 0 && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                  {selected.length} seleccionados
                </span>
              )}
            </div>

            {workers.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500 text-sm">No hay trabajadores enrolados disponible.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[240px] overflow-y-auto p-1">
                {workers.map((w) => {
                  const isSelected = selected.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => toggleWorker(w.id)}
                      className={`relative flex flex-col items-center p-3 rounded-xl border transition-all duration-200 ${isSelected
                          ? "bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500"
                          : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"
                        }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-colors ${isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                      >
                        {w.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span className={`text-xs text-center font-medium leading-tight ${isSelected ? "text-blue-900" : "text-slate-600"}`}>
                        {w.nombre}
                      </span>
                      {isSelected && (
                        <div className="absolute top-2 right-2 text-blue-600 text-xs">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* VERIFICATION QUESTIONS */}
          <div className="bg-orange-50 rounded-xl border border-orange-100 p-6 mb-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="bg-orange-100 p-2 rounded-lg text-2xl">✅</div>
              <div>
                <h4 className="font-bold text-orange-900 m-0">Preguntas de Verificación</h4>
                <p className="text-sm text-orange-700 mt-1 m-0">
                  Define 2 preguntas claves que los trabajadores deberán responder correctamente antes de firmar el documento.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                {
                  label: "Pregunta 1",
                  qVal: q1, setQ: setQ1,
                  opts: [q1o1, q1o2, q1o3],
                  setOpts: [setQ1o1, setQ1o2, setQ1o3],
                  correct: q1Correct, setCorrect: setQ1Correct
                },
                {
                  label: "Pregunta 2",
                  qVal: q2, setQ: setQ2,
                  opts: [q2o1, q2o2, q2o3],
                  setOpts: [setQ2o1, setQ2o2, setQ2o3],
                  correct: q2Correct, setCorrect: setQ2Correct
                }
              ].map((item, qIdx) => (
                <div key={qIdx} className="bg-white rounded-xl border border-orange-200 p-4 shadow-sm">
                  <span className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2 block">
                    {item.label}
                  </span>
                  <input
                    placeholder="Escribe la pregunta..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium focus:border-orange-500 focus:bg-white focus:outline-none mb-3"
                    value={item.qVal}
                    onChange={(e) => item.setQ(e.target.value)}
                  />

                  <div className="space-y-2">
                    {item.opts.map((optVal, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={item.correct === oIdx}
                          onChange={() => item.setCorrect(oIdx)}
                          className="text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
                        />
                        <input
                          placeholder={`Alternativa ${oIdx + 1}`}
                          className={`flex-1 rounded-lg border px-3 py-1.5 text-sm transition-colors focus:outline-none ${item.correct === oIdx
                              ? "border-orange-500 bg-orange-50 text-orange-900"
                              : "border-slate-200 bg-white focus:border-orange-300"
                            }`}
                          value={optVal}
                          onChange={(e) => {
                            if (qIdx === 0) {
                              if (oIdx === 0) setQ1o1(e.target.value);
                              if (oIdx === 1) setQ1o2(e.target.value);
                              if (oIdx === 2) setQ1o3(e.target.value);
                            } else {
                              if (oIdx === 0) setQ2o1(e.target.value);
                              if (oIdx === 1) setQ2o2(e.target.value);
                              if (oIdx === 2) setQ2o3(e.target.value);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700">
              <span className="text-xl">⚠️</span>
              <span className="text-sm font-semibold">{error}</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            <span>Publicar ART/AST</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function inferMimeType(fileName: string, providedMimeType: string) {
  const mime = (providedMimeType || "").trim();
  if (mime) return mime;

  const lower = (fileName || "").toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".docx")) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  return "application/octet-stream";
}
