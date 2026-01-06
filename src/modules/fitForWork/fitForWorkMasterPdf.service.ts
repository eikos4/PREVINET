import { jsPDF } from "jspdf";
import type { FitForWork } from "./fitForWork.service";

/**
 * Genera un PDF "maestro" del Fit-for-Work cuando el Prevencionista lo crea.
 * Este PDF no incluye firmas, solo el contenido original.
 */
export async function generateMasterFitForWorkPdf(fitForWork: FitForWork): Promise<Blob> {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const marginX = 14;
    let y = 18;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("EVALUACIÓN FIT-FOR-WORK", marginX, y);
    y += 12;

    // Metadata
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Creado: ${new Date(fitForWork.creadoEn).toLocaleString("es-CL")}`, marginX, y);
    y += 6;
    doc.text(`ID: ${fitForWork.id}`, marginX, y);
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

    line("Fecha", fitForWork.fecha);
    line("Turno", fitForWork.turno);
    line("Obra/Faena", fitForWork.obra);

    y += 5;
    doc.setDrawColor(200);
    doc.line(marginX, y, 196, y);
    y += 10;

    // Questions
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Preguntas de Evaluación", marginX, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    if (fitForWork.questions && fitForWork.questions.length > 0) {
        fitForWork.questions.forEach((q, idx) => {
            const wrapped = doc.splitTextToSize(`${idx + 1}. ${q.question}`, 180 - marginX);
            doc.text(wrapped, marginX + 5, y);
            y += 6 + (wrapped.length - 1) * 5;
        });
    } else {
        doc.setTextColor(150);
        doc.text("Sin preguntas definidas", marginX + 5, y);
        doc.setTextColor(0);
        y += 6;
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

    if (fitForWork.asignados && fitForWork.asignados.length > 0) {
        fitForWork.asignados.forEach((assignment, idx) => {
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
    doc.text("Este es el documento maestro del Fit-for-Work.", marginX, y);
    y += 5;
    doc.text("Los PDFs firmados se generan cuando cada trabajador completa la evaluación.", marginX, y);

    return doc.output("blob");
}

export function buildMasterFitForWorkPdfFileName(fitForWork: FitForWork): string {
    const safeFecha = (fitForWork.fecha || "")
        .trim()
        .replace(/\//g, "-")
        .replace(/[^a-zA-Z0-9_\-]/g, "");

    const safeTurno = (fitForWork.turno || "turno")
        .trim()
        .replace(/\s+/g, "_");

    const d = new Date(fitForWork.creadoEn);
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;

    return `FIT_MASTER_${safeFecha}_${safeTurno}_${ts}.pdf`;
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
