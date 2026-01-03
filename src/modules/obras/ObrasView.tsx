import { useEffect, useMemo, useState } from "react";
import type { EstadoObra, Obra } from "./obras.service";
import { createObra, deleteObra, listObras, updateObra } from "./obras.service";
import { listEmpresas, type Empresa } from "../empresas/empresas.service";

type FormState = {
  id?: string;
  nombre: string;
  estado: EstadoObra;
  empresaId?: string;
};

export default function ObrasView() {
  const inputClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10";
  const selectClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10";

  const [obras, setObras] = useState<Obra[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({ nombre: "", estado: "activa", empresaId: "" });

  const load = () => {
    listObras()
      .then((all) => {
        const sorted = all.slice().sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "", "es"));
        setObras(sorted);
      })
      .catch(() => setObras([]));

    listEmpresas().then(setEmpresas).catch(() => setEmpresas([]));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return obras;
    return obras.filter((o) => (o.nombre || "").toLowerCase().includes(term));
  }, [obras, search]);

  const resetForm = () => {
    setForm({ nombre: "", estado: "activa", empresaId: "" });
  };

  const openCreate = () => {
    setError("");
    setSuccess("");
    resetForm();
    setOpen(true);
  };

  const openEdit = (obra: Obra) => {
    setError("");
    setSuccess("");
    setForm({ id: obra.id, nombre: obra.nombre, estado: obra.estado || "activa", empresaId: (obra as any)?.empresaId ?? "" });
    setOpen(true);
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (form.id) {
        await updateObra(form.id, { nombre: form.nombre, estado: form.estado, empresaId: form.empresaId ? form.empresaId : null });
        setSuccess("Obra actualizada");
      } else {
        await createObra({ nombre: form.nombre, estado: form.estado, empresaId: form.empresaId ? form.empresaId : null });
        setSuccess("Obra creada");
      }

      setOpen(false);
      resetForm();
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo guardar obra";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (obra: Obra) => {
    setError("");
    setSuccess("");

    const ok = window.confirm(`¿Eliminar la obra "${obra.nombre}"?`);
    if (!ok) return;

    setLoading(true);
    try {
      await deleteObra(obra.id);
      setSuccess("Obra eliminada");
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo eliminar obra";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="m-0 flex items-center gap-2 text-xl font-semibold text-white">
              <span className="text-2xl">🏗️</span>
              <span>Obras</span>
            </h3>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
              onClick={openCreate}
              disabled={loading}
            >
              Nueva obra
            </button>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>
          )}

          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700">Buscar</label>
            <input
              className={inputClassName}
              type="text"
              placeholder="Buscar por nombre"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500" style={{ margin: 0 }}>
              No hay obras.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{o.nombre}</div>
                    <div className="mt-1 text-xs text-slate-600">Estado: {o.estado === "inactiva" ? "Inactiva" : "Activa"}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                      onClick={() => openEdit(o)}
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-60"
                      onClick={() => handleDelete(o)}
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-full sm:max-w-lg max-h-[90vh] sm:max-h-[80vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="m-0 text-lg font-semibold text-white">{form.id ? "Editar obra" : "Nueva obra"}</h3>
            </div>

            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="text-sm font-medium text-slate-700">Nombre *</label>
                <input
                  className={inputClassName}
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Estado</label>
                <select
                  className={selectClassName}
                  value={form.estado}
                  onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as EstadoObra }))}
                >
                  <option value="activa">Activa</option>
                  <option value="inactiva">Inactiva</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Empresa (opcional)</label>
                <select
                  className={selectClassName}
                  value={form.empresaId ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, empresaId: e.target.value }))}
                >
                  <option value="">Sin empresa</option>
                  {empresas
                    .slice()
                    .sort((a, b) => (a.nombreRazonSocial || "").localeCompare(b.nombreRazonSocial || "", "es"))
                    .map((er) => (
                      <option key={er.id} value={er.id}>
                        {er.nombreRazonSocial}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
