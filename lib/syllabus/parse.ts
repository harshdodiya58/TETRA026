import mammoth from "mammoth";

export type SourceKind = "pdf" | "docx" | "text";

export type ParsedDocument = {
  kind: SourceKind;
  text: string;
  pages: number | null;
  characters: number;
};

const MAX_BYTES = 12 * 1024 * 1024;

export class ParseError extends Error {}

/**
 * Extract raw text from an uploaded syllabus.
 *
 * PDFs go through unpdf (pdfjs under the hood, serverless-safe). DOCX goes
 * through mammoth. Plain text passes through so a demo can run without a
 * binary file. Anything else is rejected loudly rather than silently producing
 * an empty audit.
 */
export async function parseSyllabus(file: File): Promise<ParsedDocument> {
  if (file.size === 0) throw new ParseError("The uploaded file is empty.");
  if (file.size > MAX_BYTES) {
    throw new ParseError(
      `File is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is ${MAX_BYTES / 1024 / 1024} MB.`,
    );
  }

  const name = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (name.endsWith(".pdf")) return parsePdf(buffer);
  if (name.endsWith(".docx")) return parseDocx(buffer);
  if (name.endsWith(".txt") || name.endsWith(".md")) {
    const text = new TextDecoder().decode(buffer);
    return { kind: "text", text, pages: null, characters: text.length };
  }

  throw new ParseError(
    `Unsupported file type "${file.name}". Upload a PDF, DOCX, or plain-text syllabus.`,
  );
}

async function parsePdf(buffer: ArrayBuffer): Promise<ParsedDocument> {
  // Imported lazily: unpdf pulls in a large pdfjs bundle that should not load
  // for DOCX or text uploads.
  const { extractText, getDocumentProxy } = await import("unpdf");

  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: true });
  const merged = Array.isArray(text) ? text.join("\n") : text;

  if (merged.trim().length === 0) {
    throw new ParseError(
      "No text layer found in this PDF. It is most likely a scan; run OCR before uploading.",
    );
  }

  return {
    kind: "pdf",
    text: merged,
    pages: totalPages,
    characters: merged.length,
  };
}

async function parseDocx(buffer: ArrayBuffer): Promise<ParsedDocument> {
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });

  if (value.trim().length === 0) {
    throw new ParseError("The DOCX file contains no extractable text.");
  }

  return { kind: "docx", text: value, pages: null, characters: value.length };
}
