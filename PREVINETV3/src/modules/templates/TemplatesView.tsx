import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import ExcelEditor, { exportToExcel, importExcelFile } from "../../shared/components/ExcelEditor";
import { importWordFile } from "../../shared/utils/word-utils";
import { getCurrentUser } from "../auth/auth.service";
import type { UserRole } from "../auth/auth.service";
import { isReadOnly } from "../auth/permissions";

import type { DocumentoCategoria, DocumentoNaturaleza, TemplateFormato, TemplateRecord } from "./templates.service";
import { createTemplate, deleteTemplate, getSubtiposSugeridos, listTemplates } from "./templates.service";

export default function TemplatesView() {
  const inputClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10";
  const selectClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10";

  const [role, setRole] = useState<UserRole | null>(null);

  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const readOnly = useMemo(() => (role ? isReadOnly(role) : false), [role]);

  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateRecord | null>(null);

  const [naturalezaDraft, setNaturalezaDraft] = useState<DocumentoNaturaleza>("Entidad del sistema");
  const [categoriaDraft, setCategoriaDraft] = useState<DocumentoCategoria>("Gestión Preventiva Base");
  const [subtipoDraft, setSubtipoDraft] = useState("IRL");
  const [subtipoMode, setSubtipoMode] = useState<"suggested" | "custom">("suggested");
  const [nombreDraft, setNombreDraft] = useState("");
  const [formatoUi, setFormatoUi] = useState<TemplateFormato | "plantilla">("tiptap");
  const [formatoDraft, setFormatoDraft] = useState<TemplateFormato>("tiptap");
  const [plantillaBaseId, setPlantillaBaseId] = useState<string>("");
  const [excelDataDraft, setExcelDataDraft] = useState<any>(null);
  const [wordDataDraft, setWordDataDraft] = useState<any>(null);

  const [selectedCategoria, setSelectedCategoria] = useState<DocumentoCategoria | "__all__">("__all__");
  const [selectedNaturaleza, setSelectedNaturaleza] = useState<DocumentoNaturaleza | "__all__">("__all__");
  const [selectedSubtipo, setSelectedSubtipo] = useState<string | "__all__">("__all__");

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

  const excelFileRef = useRef<HTMLInputElement | null>(null);
  const wordFileRef = useRef<HTMLInputElement | null>(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none p-3 min-h-[140px] border rounded-md focus:outline-none",
      },
    },
  });

  const load = () => {
    listTemplates().then(setTemplates);
  };

  useEffect(() => {
    getCurrentUser().then((u) => setRole((u?.role as UserRole | undefined) ?? null));
    load();
  }, []);

  const subtiposDisponibles = useMemo(() => {
    const base = templates
      .filter((t) => (selectedCategoria === "__all__" ? true : t.categoria === selectedCategoria))
      .filter((t) => (selectedNaturaleza === "__all__" ? true : t.naturaleza === selectedNaturaleza));

    const set = new Set<string>();
    base.forEach((t) => set.add(t.subtipo));

    if (selectedCategoria !== "__all__" && selectedNaturaleza !== "__all__") {
      getSubtiposSugeridos({ naturaleza: selectedNaturaleza, categoria: selectedCategoria }).forEach((s) => set.add(s));
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [templates, selectedCategoria, selectedNaturaleza]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = templates
      .filter((t) => (selectedCategoria === "__all__" ? true : t.categoria === selectedCategoria))
      .filter((t) => (selectedNaturaleza === "__all__" ? true : t.naturaleza === selectedNaturaleza))
      .filter((t) => (selectedSubtipo === "__all__" ? true : t.subtipo === selectedSubtipo))
      .slice();
    if (!term) {
      return base.sort((a, b) => {
        if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
        if (a.naturaleza !== b.naturaleza) return a.naturaleza.localeCompare(b.naturaleza);
        if (a.subtipo !== b.subtipo) return a.subtipo.localeCompare(b.subtipo);
        return a.nombre.localeCompare(b.nombre);
      });
    }

    return base
      .filter((t) =>
        t.nombre.toLowerCase().includes(term) ||
        t.subtipo.toLowerCase().includes(term) ||
        t.naturaleza.toLowerCase().includes(term) ||
        t.categoria.toLowerCase().includes(term)
      )
      .sort((a, b) => {
        if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
        if (a.naturaleza !== b.naturaleza) return a.naturaleza.localeCompare(b.naturaleza);
        if (a.subtipo !== b.subtipo) return a.subtipo.localeCompare(b.subtipo);
        return a.nombre.localeCompare(b.nombre);
      });
  }, [templates, search, selectedCategoria, selectedNaturaleza, selectedSubtipo]);

  const countsByCategoria = useMemo(() => {
    const m = new Map<DocumentoCategoria, number>();
    for (const c of CATEGORIAS) m.set(c, 0);
    templates.forEach((t) => m.set(t.categoria, (m.get(t.categoria) ?? 0) + 1));
    return m;
  }, [templates]);

  const plantillasBaseDisponibles = useMemo(() => {
    return templates
      .filter((t) => t.naturaleza === naturalezaDraft)
      .filter((t) => t.categoria === categoriaDraft)
      .slice()
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [templates, naturalezaDraft, categoriaDraft]);

  const resetDraft = () => {
    setNaturalezaDraft("Entidad del sistema");
    setCategoriaDraft("Gestión Preventiva Base");
    setSubtipoDraft("IRL");
    setSubtipoMode("suggested");
    setNombreDraft("");
    setFormatoUi("tiptap");
    setFormatoDraft("tiptap");
    setPlantillaBaseId("");
    setExcelDataDraft(null);
    setWordDataDraft(null);
    editor?.commands.setContent("");
  };

  const openCreate = () => {
    if (readOnly) {
      setError("Sin permisos para crear documentos");
      return;
    }
    setError("");
    setSuccess("");
    resetDraft();
    setCreateOpen(true);
  };

  const openPreview = (t: TemplateRecord) => {
    setPreviewTemplate(t);
    setPreviewOpen(true);
  };

  useEffect(() => {
    if (formatoUi !== "plantilla") return;
    if (!plantillaBaseId) return;
    const stillValid = templates.some(
      (t) => t.id === plantillaBaseId && t.naturaleza === naturalezaDraft && t.categoria === categoriaDraft
    );
    if (!stillValid) setPlantillaBaseId("");
  }, [formatoUi, plantillaBaseId, templates, naturalezaDraft, categoriaDraft]);

  useEffect(() => {
    if (!createOpen) return;
    if (formatoUi !== "plantilla") return;
    if (!plantillaBaseId) return;

    const base = templates.find((t) => t.id === plantillaBaseId);
    if (!base) return;

    setNaturalezaDraft(base.naturaleza);
    setCategoriaDraft(base.categoria);
    setSubtipoMode("suggested");
    setSubtipoDraft(base.subtipo);
    if (!nombreDraft) setNombreDraft(base.nombre);

    setFormatoDraft(base.formato);
    setExcelDataDraft(base.formato === "excel" ? (base.excelData ?? null) : null);
    setWordDataDraft(base.formato === "word" ? (base.wordData ?? null) : null);

    if (base.formato === "tiptap") {
      editor?.commands.setContent(base.contenido ?? "");
    } else {
      editor?.commands.setContent("");
    }
  }, [createOpen, formatoUi, plantillaBaseId, templates, editor, nombreDraft]);

  const handleCreate = async () => {
    if (readOnly) {
      setError("Sin permisos para crear documentos");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (formatoUi === "plantilla" && !plantillaBaseId) {
        throw new Error("Debe seleccionar una plantilla base");
      }
      const contenido = formatoDraft === "tiptap" ? editor?.getJSON() : undefined;
      await createTemplate({
        naturaleza: naturalezaDraft,
        categoria: categoriaDraft,
        subtipo: subtipoDraft,
        nombre: nombreDraft,
        formato: formatoDraft,
        contenido,
        excelData: formatoDraft === "excel" ? excelDataDraft : undefined,
        wordData: formatoDraft === "word" ? wordDataDraft : undefined,
      });

      setSuccess("Template creado");
      setCreateOpen(false);
      resetDraft();
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo crear";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (t: TemplateRecord) => {
    if (readOnly) {
      setError("Sin permisos para eliminar documentos");
      return;
    }
    setError("");
    setSuccess("");

    const ok = window.confirm(`¿Eliminar la plantilla "${t.nombre}"?`);
    if (!ok) return;

    setLoading(true);
    try {
      await deleteTemplate(t.id);
      setSuccess("Template eliminado");
      load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo eliminar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const PreviewContent = ({ content }: { content: any }) => {
    const previewEditor = useEditor({
      extensions: [StarterKit],
      content,
      editable: false,
      editorProps: {
        attributes: {
          class: "prose prose-sm max-w-none p-3 min-h-[120px] border rounded-md bg-slate-50",
        },
      },
    });

    return <EditorContent editor={previewEditor} />;
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="m-0 flex items-center gap-2 text-xl font-semibold text-white">
              <span className="text-2xl">📄</span>
              <span>Documentos</span>
            </h3>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"
              onClick={openCreate}
              disabled={loading || readOnly}
              style={{ display: readOnly ? "none" : undefined }}
            >
              Generar Documento
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

          <div className="mb-5">
            <div className="text-sm font-semibold text-slate-900 mb-2">Dashboards por categoría</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                className={
                  selectedCategoria === "__all__"
                    ? "rounded-xl border border-blue-200 bg-blue-50 p-4 text-left"
                    : "rounded-xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                }
                onClick={() => {
                  setSelectedCategoria("__all__");
                  setSelectedSubtipo("__all__");
                }}
              >
                <div className="text-sm font-semibold text-slate-900">Todas</div>
                <div className="text-xs text-slate-600 mt-1">{templates.length} documento(s)</div>
              </button>

              {CATEGORIAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={
                    selectedCategoria === c
                      ? "rounded-xl border border-blue-200 bg-blue-50 p-4 text-left"
                      : "rounded-xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                  }
                  onClick={() => {
                    setSelectedCategoria(c);
                    setSelectedSubtipo("__all__");
                  }}
                >
                  <div className="text-sm font-semibold text-slate-900">{c}</div>
                  <div className="text-xs text-slate-600 mt-1">{countsByCategoria.get(c) ?? 0} documento(s)</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
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
                placeholder="Buscar por nombre, subtipo o naturaleza"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500" style={{ margin: 0 }}>
              No hay templates creados.
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
                      Categoría: {t.categoria} · Naturaleza: {t.naturaleza} · Subtipo: {t.subtipo} · Formato: {t.formato}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {t.formato === "excel" && t.excelData && (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                        onClick={() => exportToExcel(t.excelData!, `${t.nombre}.xlsx`)}
                      >
                        Exportar Excel
                      </button>
                    )}

                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                      onClick={() => openPreview(t)}
                    >
                      Vista previa
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-60"
                      onClick={() => handleDelete(t)}
                      disabled={loading || readOnly}
                      style={{ display: readOnly ? "none" : undefined }}
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

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h3 className="m-0 text-lg font-semibold text-white">Crear Template</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
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
                    {getSubtiposSugeridos({ naturaleza: naturalezaDraft, categoria: categoriaDraft }).map((s: string) => (
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
                  <label className="text-sm font-medium text-slate-700">Nombre *</label>
                  <input
                    className={inputClassName}
                    type="text"
                    value={nombreDraft}
                    onChange={(e) => setNombreDraft(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Formato *</label>
                  <select
                    className={selectClassName}
                    value={formatoUi}
                    onChange={(e) => {
                      const v = e.target.value as TemplateFormato | "plantilla";
                      setFormatoUi(v);

                      if (v === "plantilla") {
                        setPlantillaBaseId("");
                        return;
                      }

                      setPlantillaBaseId("");
                      setFormatoDraft(v);
                      setExcelDataDraft(null);
                      setWordDataDraft(null);
                      if (v === "tiptap") {
                        editor?.commands.setContent("");
                      }
                    }}
                  >
                    <option value="tiptap">Texto</option>
                    <option value="excel">Excel</option>
                    <option value="word">Word</option>
                    <option value="plantilla">Plantilla</option>
                  </select>
                </div>
              </div>

              {formatoUi === "plantilla" && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Plantilla base *</label>
                  <select
                    className={selectClassName}
                    value={plantillaBaseId}
                    onChange={(e) => setPlantillaBaseId(e.target.value)}
                  >
                    <option value="">Selecciona una plantilla...</option>
                    {plantillasBaseDisponibles.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre} · {t.subtipo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(formatoUi !== "plantilla" || !!plantillaBaseId) && formatoDraft === "tiptap" && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Contenido *</label>
                  <div className="border rounded-md">
                    <EditorContent editor={editor} />
                  </div>
                </div>
              )}

              {(formatoUi !== "plantilla" || !!plantillaBaseId) && formatoDraft === "excel" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Contenido Excel *</label>
                    <div>
                      <input
                        ref={excelFileRef}
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
                        onClick={() => excelFileRef.current?.click()}
                      >
                        Importar .xlsx
                      </button>
                    </div>
                  </div>

                  <ExcelEditor data={excelDataDraft || undefined} onChange={setExcelDataDraft} height={300} />
                </div>
              )}

              {(formatoUi !== "plantilla" || !!plantillaBaseId) && formatoDraft === "word" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Documento Word *</label>
                    <div>
                      <input
                        ref={wordFileRef}
                        type="file"
                        accept=".docx,.doc"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const wordData = await importWordFile(file);
                          setWordDataDraft(wordData);
                          if (!nombreDraft) setNombreDraft(file.name.replace(/\.(docx|doc)$/i, ""));
                          e.target.value = "";
                        }}
                      />
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        onClick={() => wordFileRef.current?.click()}
                      >
                        Importar Word
                      </button>
                    </div>
                  </div>

                  {wordDataDraft ? (
                    <div
                      className="border rounded-md p-4 bg-white max-h-[240px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: wordDataDraft.html }}
                    />
                  ) : (
                    <div className="border rounded-md p-6 bg-slate-50 text-sm text-slate-500">
                      Importa un archivo Word (.docx)
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  onClick={() => setCreateOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                  onClick={handleCreate}
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar Template"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewOpen && previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="m-0 text-lg font-semibold text-white">{previewTemplate.nombre}</h3>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-lg bg-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                  onClick={() => setPreviewOpen(false)}
                >
                  Cerrar
                </button>
              </div>
              <div className="text-sm text-white/80" style={{ marginTop: 6 }}>
                Naturaleza: {previewTemplate.naturaleza} · Subtipo: {previewTemplate.subtipo} · Formato: {previewTemplate.formato}
              </div>
            </div>

            <div className="p-6">
              {previewTemplate.formato === "excel" && previewTemplate.excelData ? (
                <ExcelEditor data={previewTemplate.excelData} readOnly={true} height={420} />
              ) : previewTemplate.formato === "word" && previewTemplate.wordData ? (
                <div
                  className="border rounded-md p-4 bg-white"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.wordData.html }}
                />
              ) : previewTemplate.contenido ? (
                <PreviewContent content={previewTemplate.contenido} />
              ) : (
                <div className="text-sm text-slate-500">Sin contenido</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
