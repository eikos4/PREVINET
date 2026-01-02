export type WordImportResult = {
  html: string;
  rawText: string;
  fileName?: string;
};

export async function importWordFile(file: File): Promise<WordImportResult> {
  const mammoth = (await import("mammoth")) as unknown as {
    convertToHtml: (input: { arrayBuffer: ArrayBuffer }, options?: any) => Promise<{ value: string }>;
    extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  };

  const arrayBuffer = await file.arrayBuffer();

  const htmlRes = await mammoth.convertToHtml({ arrayBuffer });
  const rawRes = await mammoth.extractRawText({ arrayBuffer });

  return {
    html: htmlRes.value || "",
    rawText: rawRes.value || "",
    fileName: file.name,
  };
}
