import { useEffect, useMemo, useState } from "react";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import type { Worker } from "../workers/worker.service";
import ExcelEditor from "../../shared/components/ExcelEditor";

import SignatureModal from "../irl/SignatureModal";

import type { TemplateRecord } from "./templates.service";
import { listTemplates } from "./templates.service";

import {
  downloadBlobAsFile,
  listSignedTemplatePdfsForWorker,
  saveSignedTemplatePdf,
  type TemplateSignedPdfRecord,
} from "./templateSignedPdf.service";

import PdfDetailModal from "../../shared/components/PdfDetailModal";

export default function TemplateSigner({ worker, title }: { worker: Worker; title: string }) {
  const selectClassName =
    "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-600/10";

  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [signed, setSigned] = useState<TemplateSignedPdfRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [signOpen, setSignOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<TemplateSignedPdfRecord | null>(null);

  useEffect(() => {
    listTemplates().then(setTemplates);
    listSignedTemplatePdfsForWorker(worker.id).then(setSigned);
  }, [worker.id]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  const previewEditor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: selectedTemplate?.contenido || "",
    editable: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none p-3 min-h-[120px] border rounded-md bg-slate-50",
      },
    },
  });

  useEffect(() => {
    if (!previewEditor) return;
    previewEditor.commands.setContent(selectedTemplate?.contenido || "");
  }, [previewEditor, selectedTemplateId]);

  const reloadSigned = () => {
    listSignedTemplatePdfsForWorker(worker.id).then((list) =>
      setSigned(
        list.slice().sort((a, b) => {
          try {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          } catch {
            return 0;
          }
        })
      )
    );
  };

  const handleConfirmSign = async (signatureDataUrl: string) => {
    if (!selectedTemplate) return;

    setError("");
    setLoading(true);
    try {
      await saveSignedTemplatePdf({
        template: selectedTemplate,
        worker,
        signatureDataUrl,
      });
      setSignOpen(false);
      reloadSigned();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo firmar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2 m-0">
          <span className="text-2xl">✍️</span>
          <span>{title}</span>
        </h3>
      </div>

      <div className="p-6 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-slate-700">Seleccionar documento</label>
          <select
            className={selectClassName}
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            <option value="">Seleccionar plantilla...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} ({t.naturaleza} · {t.subtipo})
              </option>
            ))}
          </select>
        </div>

        {selectedTemplate && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-900">Vista previa</div>
            {selectedTemplate.formato === "excel" && selectedTemplate.excelData ? (
              <ExcelEditor data={selectedTemplate.excelData} readOnly={true} height={360} />
            ) : selectedTemplate.formato === "word" && selectedTemplate.wordData ? (
              <div
                className="border rounded-md p-4 bg-white max-h-[360px] overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: selectedTemplate.wordData.html }}
              />
            ) : (
              <EditorContent editor={previewEditor} />
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn-primary"
            disabled={!selectedTemplateId || loading}
            onClick={() => setSignOpen(true)}
          >
            {loading ? "Firmando..." : "Firmar"}
          </button>
        </div>

        <div className="pt-2">
          <div className="text-sm font-semibold text-slate-900">Documentos firmados</div>
          {signed.length === 0 ? (
            <p className="text-sm text-slate-500" style={{ margin: "0.5rem 0 0 0" }}>
              No hay documentos firmados.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {signed.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="text-sm">
                    <div className="font-semibold text-slate-900">{r.fileName}</div>
                    <div className="text-xs text-slate-600">{new Date(r.createdAt).toLocaleString("es-CL")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setDetailRecord(r);
                        setDetailOpen(true);
                      }}
                      style={{ padding: "0.35rem 0.6rem", fontSize: "0.85rem" }}
                    >
                      Ver detalle
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => downloadBlobAsFile(r.pdf, r.fileName)}
                      style={{ padding: "0.35rem 0.6rem", fontSize: "0.85rem" }}
                    >
                      Descargar PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SignatureModal
        open={signOpen}
        title="Firmar Documento"
        subtitle={
          selectedTemplate ? `${selectedTemplate.nombre} · ${selectedTemplate.naturaleza} · ${selectedTemplate.subtipo}` : undefined
        }
        onCancel={() => {
          if (loading) return;
          setSignOpen(false);
        }}
        onConfirm={handleConfirmSign}
      />

      <PdfDetailModal
        open={detailOpen}
        title="Detalle de documento firmado"
        subtitle={detailRecord ? `Plantilla: ${detailRecord.templateId} · Trabajador: ${worker.nombre}` : undefined}
        fileName={detailRecord?.fileName || ""}
        createdAt={detailRecord?.createdAt}
        token={detailRecord?.token}
        blob={detailRecord?.pdf || null}
        onClose={() => {
          setDetailOpen(false);
          setDetailRecord(null);
        }}
        onDownload={
          detailRecord
            ? () => {
                downloadBlobAsFile(detailRecord.pdf, detailRecord.fileName);
              }
            : undefined
        }
      />
    </div>
  );
}
