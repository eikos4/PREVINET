import { jsPDF } from "jspdf";
import { db } from "../../offline/db";
import type { Worker } from "../workers/worker.service";
import type { TemplateRecord } from "./templates.service";

export type TemplateSignedPdfRecord = {
  id: string;
  templateId: string;
  workerId: string;
  token: string;
  fileName: string;
  mimeType: "application/pdf";
  pdf: Blob;
  createdAt: Date;
};

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

export function buildSignedTemplatePdfFileName(params: {
  templateName: string;
  templateTipo: string;
  workerName: string;
  workerRut: string;
  firmadoEn: Date;
  token: string;
}) {
  const d = new Date(params.firmadoEn);
  const pad = (n: number) => String(n).padStart(2, "0");
  const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;

  const safeName = toSafeFilePart(params.workerName || "trabajador");
  const safeRut = (params.workerRut || "").trim().replace(/\s+/g, "").replace(/[^0-9kK\-]/g, "");
  const safeTpl = toSafeFilePart(params.templateName || "documento");
  const safeTipo = toSafeFilePart(params.templateTipo || "DOC");
  const safeToken = (params.token || "").trim().replace(/[^a-zA-Z0-9\-]/g, "");

  return `FIRMADO_${safeTipo}_${safeTpl}_${safeName}_${safeRut}_${ts}_${safeToken}.pdf`;
}

async function generateQrPngDataUrl(url: string): Promise<string> {
  const QRCode = (await import("qrcode")) as unknown as {
    toDataURL: (text: string, options?: any) => Promise<string>;
  };

  return await QRCode.toDataURL(url, {
    margin: 1,
    width: 140,
  });
}

export async function generateSignedTemplatePdf(params: {
  template: TemplateRecord;
  worker: Worker;
  signatureDataUrl: string;
  token: string;
  qrUrl: string;
  signedAt: Date;
}) {
  const { template, worker, signatureDataUrl, token, qrUrl, signedAt } = params;

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const marginX = 14;
  let y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(template.nombre || "Documento", marginX, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Naturaleza: ${template.naturaleza} · Subtipo: ${template.subtipo} · Formato: ${template.formato}`, marginX, y);
  y += 8;

  const line = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(value || "-", 180 - (marginX + 30)), marginX + 30, y);
    y += 6;
  };

  line("Trabajador", worker.nombre);
  line("RUT", worker.rut);
  line("Fecha/Hora", new Date(signedAt).toLocaleString("es-CL"));
  line("Token", token);

  y += 2;
  doc.setDrawColor(200);
  doc.line(marginX, y, 196, y);
  y += 8;

  // Contenido
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
    for (let r = 0; r < Math.min(rows.length, 25); r++) {
      const row = rows[r] || [];
      const cells = row.slice(0, 12).map((c) => String(c ?? "").trim()).filter(Boolean);
      if (cells.length) previewLines.push(cells.join(" | "));
    }
    bodyText = sanitizePdfText(previewLines.join("\n"));
  }

  const wrapped = doc.splitTextToSize(bodyText || "(Sin contenido)", 180);
  for (const lineText of wrapped) {
    if (y > 250) {
      doc.addPage();
      y = 16;
    }
    doc.text(lineText, marginX, y);
    y += 5;
  }

  // Firma + QR en última página
  if (y > 210) {
    doc.addPage();
    y = 16;
  }

  y += 6;
  doc.setDrawColor(160);
  doc.rect(marginX, y, 120, 40);
  try {
    doc.addImage(signatureDataUrl, "PNG", marginX + 2, y + 2, 116, 36);
  } catch {
    doc.setFont("helvetica", "normal");
    doc.text("(No se pudo incrustar la firma)", marginX + 3, y + 12);
  }

  try {
    const qrDataUrl = await generateQrPngDataUrl(qrUrl);
    doc.addImage(qrDataUrl, "PNG", 150, y, 40, 40);
  } catch {
    // ignore
  }

  return doc.output("blob");
}

export async function saveSignedTemplatePdf(params: {
  template: TemplateRecord;
  worker: Worker;
  signatureDataUrl: string;
}): Promise<TemplateSignedPdfRecord> {
  const token = crypto.randomUUID();
  const signedAt = new Date();
  const qrUrl = `${window.location.origin}/trabajador/${params.worker.id}`;

  const pdf = await generateSignedTemplatePdf({
    template: params.template,
    worker: params.worker,
    signatureDataUrl: params.signatureDataUrl,
    token,
    qrUrl,
    signedAt,
  });

  const fileName = buildSignedTemplatePdfFileName({
    templateName: params.template.nombre,
    templateTipo: params.template.subtipo,
    workerName: params.worker.nombre,
    workerRut: params.worker.rut,
    firmadoEn: signedAt,
    token,
  });

  const id = `${params.template.id}_${params.worker.id}_${token}`;

  const record: TemplateSignedPdfRecord = {
    id,
    templateId: params.template.id,
    workerId: params.worker.id,
    token,
    fileName,
    mimeType: "application/pdf",
    pdf,
    createdAt: new Date(),
  };

  await db.table("templateSignedPdfs").put(record);
  return record;
}

export async function listSignedTemplatePdfsForWorker(workerId: string): Promise<TemplateSignedPdfRecord[]> {
  return (await db.table("templateSignedPdfs").where("workerId").equals(workerId).toArray()) as TemplateSignedPdfRecord[];
}

export async function getSignedTemplatePdfByKey(params: {
  templateId: string;
  workerId: string;
  token: string;
}): Promise<TemplateSignedPdfRecord | undefined> {
  const all = (await db.table("templateSignedPdfs").where("workerId").equals(params.workerId).toArray()) as TemplateSignedPdfRecord[];
  return all.find((r) => r.templateId === params.templateId && r.token === params.token);
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
