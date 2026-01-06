import { jsPDF } from "jspdf";
import type { DocumentRecord } from "./documents.service";

/**
 * Genera un PDF "maestro" del documento cuando el Prevencionista lo crea.
 * Este PDF no incluye firmas, solo el contenido original.
 */
export async function generateMasterDocumentPdf(document: DocumentRecord): Promise<Blob> {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const marginX = 14;
    let y = 18;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("DOCUMENTO DE SEGURIDAD", marginX, y);
    y += 12;

    // Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Creado: ${new Date(document.creadoEn).toLocaleString("es-CL")}`, marginX, y);
    y += 6;
    doc.text(`ID: ${document.id}`, marginX, y);
    y += 10;

    // Content
    doc.setTextColor(0);
    doc.setFontSize(11);

    const line = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, marginX, y);
        doc.setFont("helvetica", "normal");
        const textX = marginX + 45;
        const wrapped = doc.splitTextToSize(value || "-", 180 - textX);
        doc.text(wrapped, textX, y);
        y += 7 + (wrapped.length - 1) * 5;
    };

    line("Título", document.titulo);
    line("Obra/Faena", document.obra);
    line("Fecha", document.fecha);
    line("Categoría", document.categoria || "-");
    line("Descripción", document.descripcion || "-");

    if (document.attachment?.fileName) {
        const mime = document.attachment.mimeType || "application/octet-stream";
        line("Archivo Adjunto", `${document.attachment.fileName} (${mime})`);
    }

    y += 5;
    doc.setDrawColor(200);
    doc.line(marginX, y, 196, y);
    y += 10;

    // Workers list
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Trabajadores Asignados", marginX, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    if (document.asignados && document.asignados.length > 0) {
        document.asignados.forEach((assignment, idx) => {
            doc.text(`${idx + 1}. Token: ${shortenToken(assignment.token)}`, marginX + 5, y);
            y += 6;
        });
    } else {
        doc.setTextColor(150);
        doc.text("Sin trabajadores asignados", marginX + 5, y);
        doc.setTextColor(0);
        y += 6;
    }

    y += 10;
    doc.setDrawColor(200);
    doc.line(marginX, y, 196, y);
    y += 8;

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Este es el documento maestro.", marginX, y);
    y += 5;
    doc.text("Los PDFs firmados se generan cuando cada trabajador lee el documento.", marginX, y);

    return doc.output("blob");
}

export function buildMasterDocumentPdfFileName(document: DocumentRecord): string {
    const safeTitulo = (document.titulo || "documento")
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_\-]/g, "");

    const d = new Date(document.creadoEn);
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;

    return `DOC_MASTER_${safeTitulo}_${ts}.pdf`;
}

export function downloadBlobAsFile(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function shortenToken(token: string, head = 8, tail = 6) {
    const t = (token || "").trim();
    if (t.length <= head + tail + 3) return t;
    return `${t.slice(0, head)}…${t.slice(-tail)}`;
}
