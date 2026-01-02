import { useEffect, useMemo, useState } from "react";
import type { Empresa, EstadoEmpresa, TipoEmpresa } from "./empresas.service";
import { createEmpresa, deleteEmpresa, listEmpresas, updateEmpresa } from "./empresas.service";

type FormState = {
  id?: string;
  nombreRazonSocial: string;
  rut: string;
  tipo: TipoEmpresa;
  clasificacion: "grande_constructora" | "independiente";
  giro: string;
  estado: EstadoEmpresa;
};

function labelTipoEmpresa(tipo: TipoEmpresa) {
  switch (tipo) {
    case "mandante":
      return "Mandante";
    case "contratista":
      return "Contratista";
    case "subcontratista":
      return "Subcontratista";
    case "proveedor_servicio":
      return "Proveedor / Servicio";
    case "sub_contrato":
      return "Subcontratista";
    default:
      return "Mandante";
  }
}

import { getCurrentUser } from "../auth/auth.service";


export default function EmpresasView() {
  const inputClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10";
  const selectClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10";

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Permissions
  const [canCreate, setCanCreate] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    nombreRazonSocial: "",
    rut: "",
    tipo: "mandante",
    clasificacion: "independiente",
    giro: "",
    estado: "activa",
  });

  const load = async () => {
    const user = await getCurrentUser();
    if (!user) return;

    const isSuper = user.role === "superadmin";

    // Create/Delete only for Superadmin
    setCanCreate(isSuper);
    setCanDelete(isSuper);

    // Edit for Superadmin AND Administrador (Company Admin)
    setCanEdit(isSuper || user.role === "administrador");

    // Scope list
    const scopeRut = isSuper ? undefined : user.companyRut;
    listEmpresas(scopeRut).then(setEmpresas);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [...empresas].sort((a, b) => a.nombreRazonSocial.localeCompare(b.nombreRazonSocial));

    return empresas
      .filter((e) => {
        return (
          e.nombreRazonSocial.toLowerCase().includes(term) ||
          (e.rut || "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => a.nombreRazonSocial.localeCompare(b.nombreRazonSocial));
  }, [empresas, search]);

  const resetForm = () => {
    setForm({ nombreRazonSocial: "", rut: "", tipo: "mandante", clasificacion: "independiente", giro: "", estado: "activa" });
  };

  const openCreate = () => {
    setError("");
    setSuccess("");
    resetForm();
    setOpen(true);
  };

  const openEdit = (empresa: Empresa) => {
    setError("");
    setSuccess("");
    setForm({
      id: empresa.id,
      nombreRazonSocial: empresa.nombreRazonSocial,
      rut: empresa.rut,
      tipo: empresa.tipo,
      clasificacion: empresa.clasificacion ?? "independiente",
      giro: empresa.giro || "",
      estado: empresa.estado || "activa",
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (form.id) {
        await updateEmpresa(form.id, {
          nombreRazonSocial: form.nombreRazonSocial,
          rut: form.rut,
          tipo: form.tipo,
          clasificacion: form.clasificacion,
          giro: form.giro,
          estado: form.estado,
        });
        setSuccess("Empresa actualizada");
      } else {
        await createEmpresa({
          nombreRazonSocial: form.nombreRazonSocial,
          rut: form.rut,
          tipo: form.tipo,
          clasificacion: form.clasificacion,
          giro: form.giro,
          estado: form.estado,
        });
        setSuccess("Empresa creada");
      }

      setOpen(false);
      resetForm();
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo guardar empresa";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (empresa: Empresa) => {
    setError("");
    setSuccess("");

    const ok = window.confirm(`¿Eliminar la empresa "${empresa.nombreRazonSocial}"?`);
    if (!ok) return;

    setLoading(true);
    try {
      await deleteEmpresa(empresa.id);
      setSuccess("Empresa eliminada");
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo eliminar empresa";
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
              <span className="text-2xl">🏢</span>
              <span>Empresas</span>
            </h3>
            {canCreate && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
                onClick={openCreate}
                disabled={loading}
              >
                Nueva empresa
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700">Buscar</label>
            <input
              className={inputClassName}
              type="text"
              placeholder="Buscar por nombre o RUT"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500" style={{ margin: 0 }}>
              No hay empresas.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((e) => (
                <div
                  key={e.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{e.nombreRazonSocial}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      RUT: {e.rut} · Tipo: {labelTipoEmpresa(e.tipo)} · Clasificación: {e.clasificacion === "grande_constructora" ? "Grande Constructora" : "Independiente"} · Giro: {e.giro || "-"} · Estado: {e.estado === "inactiva" ? "Inactiva" : "Activa"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                        onClick={() => openEdit(e)}
                        disabled={loading}
                      >
                        Editar
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-60"
                        onClick={() => handleDelete(e)}
                        disabled={loading}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="m-0 text-lg font-semibold text-white">
                {form.id ? "Editar empresa" : "Nueva empresa"}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Nombre / Razón Social *</label>
                <input
                  className={inputClassName}
                  type="text"
                  value={form.nombreRazonSocial}
                  onChange={(e) => setForm((p) => ({ ...p, nombreRazonSocial: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">RUT empresa *</label>
                <input
                  className={inputClassName}
                  type="text"
                  value={form.rut}
                  onChange={(e) => setForm((p) => ({ ...p, rut: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Tipo *</label>
                <select
                  className={selectClassName}
                  value={form.tipo}
                  onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as TipoEmpresa }))}
                >
                  <option value="mandante">Mandante</option>
                  <option value="contratista">Contratista</option>
                  <option value="subcontratista">Subcontratista</option>
                  <option value="proveedor_servicio">Proveedor / Servicio</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Clasificación *</label>
                <select
                  className={selectClassName}
                  value={form.clasificacion}
                  onChange={(e) => setForm((p) => ({ ...p, clasificacion: e.target.value as "grande_constructora" | "independiente" }))}
                >
                  <option value="independiente">Independiente</option>
                  <option value="grande_constructora">Grande Constructora</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Giro *</label>
                <input
                  className={inputClassName}
                  type="text"
                  value={form.giro}
                  onChange={(e) => setForm((p) => ({ ...p, giro: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Estado *</label>
                <select
                  className={selectClassName}
                  value={form.estado}
                  onChange={(e) => setForm((p) => ({ ...p, estado: e.target.value as EstadoEmpresa }))}
                >
                  <option value="activa">Activa</option>
                  <option value="inactiva">Inactiva</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
