import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import { r2Client } from "@/lib/storage/r2";
import type { ExtractedDocumentText } from "./text-extraction.types";

const PDF_MIME_TYPE = "application/pdf";
const DOCX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const TXT_MIME_TYPES = ["text/plain"];

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

function normalizeExtractedText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdfText(buffer: Buffer): Promise<ExtractedDocumentText> {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(uint8Array);
  const { text } = await extractText(pdf, { mergePages: true });

  return {
    text: normalizeExtractedText(text ?? ""),
    pageCount: typeof pdf.numPages === "number" ? pdf.numPages : null,
    detectedType: "pdf",
  };
}

async function extractDocxText(buffer: Buffer): Promise<ExtractedDocumentText> {
  const result = await mammoth.extractRawText({ buffer });

  return {
    text: normalizeExtractedText(result.value ?? ""),
    pageCount: null,
    detectedType: "docx",
  };
}

async function extractTxtText(buffer: Buffer): Promise<ExtractedDocumentText> {
  return {
    text: normalizeExtractedText(buffer.toString("utf-8")),
    pageCount: null,
    detectedType: "txt",
  };
}

export async function extractDocumentTextFromR2(input: {
  bucket?: string;
  key: string;
  mimeType: string;
}): Promise<ExtractedDocumentText> {
  const response = await r2Client.send(
    new GetObjectCommand({
      Bucket: input.bucket ?? env.R2_BUCKET_NAME,
      Key: input.key,
    }),
  );

  if (!response.Body) {
    throw new Error("Failed to read uploaded file from storage");
  }

  const buffer = await streamToBuffer(response.Body as NodeJS.ReadableStream);

  if (input.mimeType === PDF_MIME_TYPE) {
    return extractPdfText(buffer);
  }

  if (input.mimeType === DOCX_MIME_TYPE) {
    return extractDocxText(buffer);
  }

  if (TXT_MIME_TYPES.includes(input.mimeType)) {
    return extractTxtText(buffer);
  }

  throw new Error("Unsupported document type for extraction");
}
