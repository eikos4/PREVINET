import { jsPDF } from "jspdf";
import type { IRL } from "./irl.service";

/**
 * Genera un PDF "maestro" del IRL cuando el Prevencionista lo crea.
 * Este PDF no incluye firmas, solo el contenido original.
 */
export async function generateMasterIrlPdf(irl: IRL): Promise<Blob> {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const marginX = 14;
    let y = 18;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("INFORMACIÓN DE RIESGOS LABORALES (IRL)", marginX, y);
    y += 12;

    // Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Creado: ${new Date(irl.creadoEn).toLocaleString("es-CL")}`, marginX, y);
    y += 6;
    doc.text(`ID: ${irl.id}`, marginX, y);
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

    line("Título", irl.titulo);
    line("Obra/Faena", irl.obra);
    line("Fecha", irl.fecha);
    line("Descripción", irl.descripcion || "-");

    if (irl.attachment?.fileName) {
        const mime = irl.attachment.mimeType || "application/octet-stream";
        line("Documento Adjunto", `${irl.attachment.fileName} (${mime})`);
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

    if (irl.asignados && irl.asignados.length > 0) {
        irl.asignados.forEach((assignment, idx) => {
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
    doc.text("Este es el documento maestro del IRL.", marginX, y);
    y += 5;
    doc.text("Los PDFs firmados se generan cuando cada trabajador lee el protocolo.", marginX, y);

    return doc.output("blob");
}

export function buildMasterIrlPdfFileName(irl: IRL): string {
    const safeTitulo = (irl.titulo || "irl")
        .trim()
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_\-]/g, "");

    const d = new Date(irl.creadoEn);
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;

    return `IRL_MASTER_${safeTitulo}_${ts}.pdf`;
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
