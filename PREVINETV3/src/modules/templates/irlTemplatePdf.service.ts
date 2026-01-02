import { jsPDF } from "jspdf";

import type { Worker } from "../workers/worker.service";
import type { TemplateRecord } from "./templates.service";

function sanitizePdfText(input: string): string {
  if (!input) return "";
  const mapped = input
    .replaceAll("☐", "[ ]")
    .replaceAll("☑", "[x]")
    .replaceAll("✅", "OK")
    .replaceAll("⚠️", "!")
    .replaceAll("⛔", "X")
    .replaceAll("🔒", "")
    .replaceAll("📍", "-")
    .replaceAll("🕒", "-")
    .replaceAll("·", "-")
    .replaceAll("°", "o");

  return mapped.replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "");
}

function tiptapJsonToText(doc: any): string {
  try {
    if (!doc) return "";
    if (typeof doc === "string") return doc;

    const out: string[] = [];
    const walk = (node: any) => {
      if (!node) return;
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (node.type === "text" && typeof node.text === "string") {
        out.push(node.text);
      }
      if (node.type === "hardBreak") out.push("\n");
      if (node.type === "paragraph" || node.type === "heading") {
        walk(node.content);
        out.push("\n\n");
        return;
      }
      if (node.type === "bulletList" || node.type === "orderedList") {
        walk(node.content);
        out.push("\n");
        return;
      }
      if (node.type === "listItem") {
        out.push("- ");
        walk(node.content);
        out.push("\n");
        return;
      }
      if (node.content) walk(node.content);
    };

    walk(doc);
    return out.join("").replace(/\n{3,}/g, "\n\n").trim();
  } catch {
    return "";
  }
}

function toSafeFilePart(input: string) {
  return (input || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_\-]/g, "");
}

export function buildIrlTemplatePdfFileName(params: { workerName: string; workerRut: string; templateName: string }) {
  const safeName = toSafeFilePart(params.workerName || "trabajador");
  const safeRut = (params.workerRut || "").trim().replace(/\s+/g, "").replace(/[^0-9kK\-]/g, "");
  const safeTpl = toSafeFilePart(params.templateName || "IRL");
  return `IRL_${safeTpl}_${safeName}_${safeRut}.pdf`;
}

export async function generateIrlPdfFromTemplate(params: { template: TemplateRecord; worker: Worker }) {
  const { template, worker } = params;

  if (!(template.naturaleza === "Entidad del sistema" && template.subtipo === "IRL")) {
    throw new Error("La plantilla seleccionada no es tipo IRL");
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const marginX = 14;
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`IRL - ${template.nombre || "Plantilla"}`, marginX, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  const line = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(value || "-", 180 - (marginX + 32)), marginX + 32, y);
    y += 6;
  };

  line("Trabajador", worker.nombre);
  line("RUT", worker.rut);
  line("Obra/Faena", worker.obra);
  line("Cargo", worker.cargo);
  line("Empresa", `${worker.empresaNombre}${worker.empresaRut ? ` · ${worker.empresaRut}` : ""}`);
  y += 2;

  doc.setDrawColor(200);
  doc.line(marginX, y, 196, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Contenido", marginX, y);
  y += 6;
  doc.setFont("helvetica", "normal");

  let bodyText = "";
  if (template.formato === "tiptap") {
    bodyText = sanitizePdfText(tiptapJsonToText(template.contenido));
  } else if (template.formato === "word") {
    bodyText = sanitizePdfText(template.wordData?.rawText || "");
  } else if (template.formato === "excel") {
    const rows = template.excelData?.data || [];
    const previewLines: string[] = [];
    for (let r = 0; r < Math.min(rows.length, 45); r++) {
      const row = rows[r] || [];
      const cells = row.slice(0, 12).map((c) => String(c ?? "").trim()).filter(Boolean);
      if (cells.length) previewLines.push(cells.join(" | "));
    }
    bodyText = sanitizePdfText(previewLines.join("\n"));
  }

  const wrapped = doc.splitTextToSize(bodyText || "(Sin contenido)", 180);
  for (const lineText of wrapped) {
    if (y > 280) {
      doc.addPage();
      y = 16;
    }
    doc.text(lineText, marginX, y);
    y += 5;
  }

  return doc.output("blob");
}
