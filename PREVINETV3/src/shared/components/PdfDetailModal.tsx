import { useEffect, useMemo } from "react";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  fileName: string;
  createdAt?: Date;
  token?: string;
  blob: Blob | null;
  onClose: () => void;
  onDownload?: () => void;
};

export default function PdfDetailModal({
  open,
  title,
  subtitle,
  fileName,
  createdAt,
  token,
  blob,
  onClose,
  onDownload,
}: Props) {
  const url = useMemo(() => {
    if (!open || !blob) return null;
    return URL.createObjectURL(blob);
  }, [open, blob]);

  useEffect(() => {
    if (!url) return;
    return () => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // noop
      }
    };
  }, [url]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)", padding: "1rem" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-lg border border-gray-200 w-full"
        style={{ maxWidth: 980, maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="text-lg font-semibold text-gray-900">{title}</div>
          {subtitle && (
            <div className="text-sm text-gray-500" style={{ marginTop: 4 }}>
              {subtitle}
            </div>
          )}
        </div>

        <div className="px-6 py-4" style={{ overflow: "auto", maxHeight: "calc(92vh - 140px)" }}>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Archivo</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">{fileName}</div>

              {createdAt && (
                <div className="mt-2">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</div>
                  <div className="mt-1 text-sm text-gray-900">{new Date(createdAt).toLocaleString("es-CL")}</div>
                </div>
              )}

              {token && (
                <div className="mt-2">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Token</div>
                  <div className="mt-1 text-sm text-gray-900" style={{ wordBreak: "break-all" }}>
                    {token}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden bg-white" style={{ height: 520 }}>
              {url ? (
                <iframe title={fileName} src={url} className="w-full h-full" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">No hay PDF</div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          {onDownload && (
            <button type="button" className="btn-secondary" onClick={onDownload}>
              Descargar
            </button>
          )}
          <button type="button" className="btn-primary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
