import { useEffect, useMemo, useRef, useState } from "react";

import ExcelEditor, { exportToExcel, importExcelFile } from "../../shared/components/ExcelEditor";

import type { DocumentoCategoria, DocumentoNaturaleza, TemplateRecord } from "./templates.service";
import { createTemplate, deleteTemplate, getSubtiposSugeridos, listTemplates } from "./templates.service";

export default function ExcelTemplatesView() {
  const inputClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10";
  const selectClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10";

  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedNaturaleza, setSelectedNaturaleza] = useState<DocumentoNaturaleza | "__all__">("__all__");
  const [selectedCategoria, setSelectedCategoria] = useState<DocumentoCategoria | "__all__">("__all__");
  const [selectedSubtipo, setSelectedSubtipo] = useState<string | "__all__">("__all__");

  const [open, setOpen] = useState(false);
  const [naturalezaDraft, setNaturalezaDraft] = useState<DocumentoNaturaleza>("Entidad del sistema");
  const [categoriaDraft, setCategoriaDraft] = useState<DocumentoCategoria>("Gestión Preventiva Base");
  const [subtipoDraft, setSubtipoDraft] = useState("IRL");
  const [subtipoMode, setSubtipoMode] = useState<"suggested" | "custom">("suggested");
  const [nombreDraft, setNombreDraft] = useState("");
  const [excelDataDraft, setExcelDataDraft] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const NATURALEZAS: DocumentoNaturaleza[] = ["Entidad del sistema", "Plantilla operativa", "Documento de respaldo"];

  const CATEGORIAS: DocumentoCategoria[] = [
    "Gestión Preventiva Base",
    "Identificación y Control de Riesgos",
    "Operación en Terreno",
    "Personas y Competencias",
    "Emergencias",
    "Incidentes y Mejoras",
    "Vigilancia de la Salud",
    "Auditoría y Mutual",
    "Activos y Sustancias",
  ];

  const load = () => {
    listTemplates().then((all) => setTemplates(all.filter((t) => t.formato === "excel")));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = templates
      .filter((t) => (selectedNaturaleza === "__all__" ? true : t.naturaleza === selectedNaturaleza))
      .filter((t) => (selectedCategoria === "__all__" ? true : t.categoria === selectedCategoria))
      .filter((t) => (selectedSubtipo === "__all__" ? true : t.subtipo === selectedSubtipo))
      .slice();
    if (!term) {
      return base.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    return base
      .filter((t) => t.nombre.toLowerCase().includes(term) || t.subtipo.toLowerCase().includes(term))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [templates, search, selectedNaturaleza, selectedCategoria, selectedSubtipo]);

  const subtiposDisponibles = useMemo(() => {
    const base = templates
      .filter((t) => (selectedNaturaleza === "__all__" ? true : t.naturaleza === selectedNaturaleza))
      .filter((t) => (selectedCategoria === "__all__" ? true : t.categoria === selectedCategoria));

    const set = new Set<string>();
    base.forEach((t) => set.add(t.subtipo));

    if (selectedNaturaleza !== "__all__" && selectedCategoria !== "__all__") {
      getSubtiposSugeridos({ naturaleza: selectedNaturaleza, categoria: selectedCategoria }).forEach((s) => set.add(s));
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [templates, selectedNaturaleza, selectedCategoria]);

  const reset = () => {
    setNaturalezaDraft("Entidad del sistema");
    setCategoriaDraft("Gestión Preventiva Base");
    setSubtipoDraft("IRL");
    setSubtipoMode("suggested");
    setNombreDraft("");
    setExcelDataDraft(null);
  };

  const openCreate = () => {
    setError("");
    setSuccess("");
    reset();
    setOpen(true);
  };

  const handleCreate = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await createTemplate({
        naturaleza: naturalezaDraft,
        categoria: categoriaDraft,
        subtipo: subtipoDraft,
        nombre: nombreDraft,
        formato: "excel",
        excelData: excelDataDraft,
      });
      setSuccess("Plantilla Excel creada");
      setOpen(false);
      reset();
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo crear";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (t: TemplateRecord) => {
    setError("");
    setSuccess("");

    const ok = window.confirm(`¿Eliminar la plantilla "${t.nombre}"?`);
    if (!ok) return;

    setLoading(true);
    try {
      await deleteTemplate(t.id);
      setSuccess("Plantilla eliminada");
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo eliminar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="m-0 flex items-center gap-2 text-xl font-semibold text-white">
              <span className="text-2xl">📊</span>
              <span>Plantillas</span>
            </h3>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
              onClick={openCreate}
              disabled={loading}
            >
              Nueva plantilla
            </button>
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

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Naturaleza</label>
              <select
                className={selectClassName}
                value={selectedNaturaleza}
                onChange={(e) => setSelectedNaturaleza(e.target.value as any)}
              >
                <option value="__all__">Todos</option>
                {NATURALEZAS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Categoría</label>
              <select
                className={selectClassName}
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value as any)}
              >
                <option value="__all__">Todas</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Subtipo</label>
              <select
                className={selectClassName}
                value={selectedSubtipo}
                onChange={(e) => setSelectedSubtipo(e.target.value as any)}
              >
                <option value="__all__">Todos</option>
                {subtiposDisponibles.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Buscar</label>
              <input
                className={inputClassName}
                type="text"
                placeholder="Buscar por nombre o subtipo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500" style={{ margin: 0 }}>
              No hay plantillas.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t.nombre}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Naturaleza: {t.naturaleza} · Subtipo: {t.subtipo} · Categoría: {t.categoria}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {t.excelData && (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                        onClick={() => exportToExcel(t.excelData!, `${t.nombre}.xlsx`)}
                      >
                        Exportar
                      </button>
                    )}
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-60"
                      onClick={() => handleDelete(t)}
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
          <div className="w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
              <h3 className="m-0 text-lg font-semibold text-white">Crear Plantilla Excel</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Naturaleza *</label>
                  <select
                    className={selectClassName}
                    value={naturalezaDraft}
                    onChange={(e) => setNaturalezaDraft(e.target.value as any)}
                  >
                    {NATURALEZAS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Subtipo/Uso *</label>
                  <select
                    className={selectClassName}
                    value={subtipoMode === "custom" ? "__custom__" : subtipoDraft}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "__custom__") {
                        setSubtipoMode("custom");
                        setSubtipoDraft("");
                        return;
                      }
                      setSubtipoMode("suggested");
                      setSubtipoDraft(v);
                    }}
                  >
                    {getSubtiposSugeridos({ naturaleza: naturalezaDraft, categoria: categoriaDraft }).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    <option value="__custom__">Otro...</option>
                  </select>

                  {subtipoMode === "custom" && (
                    <input
                      className={inputClassName}
                      type="text"
                      placeholder="Escribe el subtipo (ej: PSST, RIOHS, Informe Mutual...)"
                      value={subtipoDraft}
                      onChange={(e) => setSubtipoDraft(e.target.value)}
                    />
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Categoría *</label>
                  <select
                    className={selectClassName}
                    value={categoriaDraft}
                    onChange={(e) => setCategoriaDraft(e.target.value as DocumentoCategoria)}
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Nombre *</label>
                  <input
                    className={inputClassName}
                    type="text"
                    value={nombreDraft}
                    onChange={(e) => setNombreDraft(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-end justify-end">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const excelData = await importExcelFile(file);
                    setExcelDataDraft(excelData);
                    if (!nombreDraft) setNombreDraft(file.name.replace(/\.(xlsx|xls)$/i, ""));
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  onClick={() => fileRef.current?.click()}
                >
                  Importar .xlsx
                </button>
              </div>

              <ExcelEditor data={excelDataDraft || undefined} onChange={setExcelDataDraft} height={460} />

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
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                  onClick={handleCreate}
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
