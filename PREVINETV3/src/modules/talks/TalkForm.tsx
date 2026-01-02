import { useEffect, useMemo, useState } from "react";
import { addTalk } from "./talk.service";

import { getWorkers } from "../workers/worker.service";
import type { Worker } from "../workers/worker.service";
import { createObra, listObras, type Obra } from "../obras/obras.service";
import { getCurrentUser } from "../auth/auth.service";

export default function TalkForm({
  onCreated,
  creadoPorUserId,
}: {
  onCreated: () => void;
  creadoPorUserId?: string;
}) {
  const [tema, setTema] = useState("");
  const [obraId, setObraId] = useState<string>("");
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraQuickName, setObraQuickName] = useState("");
  const [fechaHora, setFechaHora] = useState("");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getWorkers().then(setWorkers);
    listObras()
      .then((all) => setObras(all.filter((o) => o.estado !== "inactiva")))
      .catch(() => setObras([]));
  }, []);

  const selectableWorkers = useMemo(() => workers.filter((w) => w.habilitado), [workers]);

  const toggleWorker = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    setError("");

    if (!tema || !fechaHora || !obraId) {
      setError("Completa obra, tema y fecha/hora");
      return;
    }

    if (selected.length === 0) {
      setError("Selecciona al menos un trabajador");
      return;
    }

    const obra = obras.find((o) => o.id === obraId)?.nombre || "";
    if (!obra.trim()) {
      setError("Selecciona la obra/faena");
      return;
    }

    await addTalk({
      obra,
      tema,
      fechaHora,
      asignados: selected.map((workerId) => ({
        workerId,
        token: crypto.randomUUID(),
      })),
      creadoPorUserId,
    });

    setTema("");
    setObraId("");
    setObraQuickName("");
    setFechaHora("");
    setSelected([]);
    onCreated();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2 m-0">
          <span className="text-2xl">🗣️</span>
          <span>Crear charla diaria (5 minutos)</span>
        </h3>
      </div>

      <div className="p-6">
        <p className="text-sm text-gray-500" style={{ marginTop: 0 }}>
          Registra la charla del día y asigna los trabajadores que deben firmarla.
        </p>

        <div className="form-grid">
          <div className="flex flex-col" style={{ gridColumn: "1 / -1" }}>
            <span className="text-sm font-medium text-gray-500 mb-1">Obra/Faena</span>
            <select value={obraId} onChange={(e) => setObraId(e.target.value)}>
              <option value="">Selecciona obra…</option>
              {obras
                .slice()
                .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"))
                .map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
            </select>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                className="flex-1 min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none"
                placeholder="Crear obra rápida…"
                value={obraQuickName}
                onChange={(e) => setObraQuickName(e.target.value)}
              />
              <button
                type="button"
                className="flex-none btn-secondary"
                onClick={async () => {
                  setError("");
                  try {
                    const user = await getCurrentUser();
                    const created = await createObra({ nombre: obraQuickName, empresaId: user?.companyId ?? null });
                    const next = await listObras();
                    setObras(next.filter((o) => o.estado !== "inactiva"));
                    setObraId(created.id);
                    setObraQuickName("");
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : "No se pudo crear la obra";
                    setError(msg);
                  }
                }}
              >
                Crear
              </button>
            </div>
          </div>

          <div className="flex flex-col" style={{ gridColumn: "1 / -1" }}>
            <span className="text-sm font-medium text-gray-500 mb-1">Tema</span>
            <input placeholder="Tema de la charla" value={tema} onChange={(e) => setTema(e.target.value)} />
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500 mb-1">Fecha y hora</span>
            <input type="datetime-local" value={fechaHora} onChange={(e) => setFechaHora(e.target.value)} />
          </div>
        </div>

        <strong className="form-section-title">👷 Trabajadores asignados</strong>

        {selectableWorkers.length === 0 ? (
          <p className="form-empty">No hay trabajadores habilitados. Habilita trabajadores para poder asignarlos.</p>
        ) : (
          <div className="worker-select-grid">
            {selectableWorkers.map((w) => (
              <button
                key={w.id}
                type="button"
                className={`worker-select ${selected.includes(w.id) ? "selected" : ""}`}
                onClick={() => toggleWorker(w.id)}
              >
                <span className="worker-initial">{w.nombre.charAt(0).toUpperCase()}</span>
                <span>{w.nombre}</span>
              </button>
            ))}
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        <button className="btn-primary" onClick={handleSubmit}>
          Publicar charla
        </button>
      </div>
    </div>
  );
}
