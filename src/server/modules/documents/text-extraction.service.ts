import mammoth from "mammoth";
import { getDocumentProxy } from "unpdf";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import { r2Client } from "@/lib/storage/r2";
import type {
  ExtractedDocumentText,
  StructuredBlock,
} from "./text-extraction.types";

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

// ─────────────────────────────────────────────────────────────
// PDF Extraction with Structure
// ─────────────────────────────────────────────────────────────

interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName: string;
}

async function extractPdfStructured(
  buffer: Buffer,
): Promise<ExtractedDocumentText> {
  const uint8Array = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(uint8Array);

  const blocks: StructuredBlock[] = [];
  const fontSizes: number[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
      if (!("str" in item) || !item.str.trim()) continue;

      const textItem = item as PdfTextItem;
      const fontSize = Math.abs(textItem.transform[0]) || 12;
      const y = textItem.transform[5];
      const x = textItem.transform[4];

      fontSizes.push(fontSize);

      blocks.push({
        text: textItem.str,
        pageNumber: pageNum,
        fontSize,
        fontName: textItem.fontName || null,
        isBold: /bold/i.test(textItem.fontName || ""),
        isItalic: /italic|oblique/i.test(textItem.fontName || ""),
        x,
        y,
        lineHeight: textItem.height || null,
        blockType: "unknown",
      });
    }
  }

  // Calculate median font size for body text detection
  const sortedSizes = [...fontSizes].sort((a, b) => a - b);
  const medianFontSize = sortedSizes[Math.floor(sortedSizes.length / 2)] || 12;

  // Mark potential headings based on font size
  for (const block of blocks) {
    if (block.fontSize && block.fontSize > medianFontSize * 1.1) {
      block.blockType = "heading";
    } else {
      block.blockType = "text";
    }
  }

  // Reconstruct full text for backward compatibility
  const fullText = reconstructTextFromBlocks(blocks);

  return {
    text: normalizeExtractedText(fullText),
    blocks,
    pageCount: pdf.numPages,
    detectedType: "pdf",
  };
}

function reconstructTextFromBlocks(blocks: StructuredBlock[]): string {
  if (blocks.length === 0) return "";

  const lines: string[] = [];
  let currentLine = "";
  let lastY: number | null = null;
  let lastPage: number | null = null;

  for (const block of blocks) {
    const isNewPage = lastPage !== null && block.pageNumber !== lastPage;
    const isNewLine =
      lastY !== null && block.y !== null && Math.abs(block.y - lastY) > 5;

    if (isNewPage || isNewLine) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = block.text;
    } else {
      currentLine += (currentLine ? " " : "") + block.text;
    }

    lastY = block.y;
    lastPage = block.pageNumber;
  }

  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
// DOCX Extraction with Structure
// ─────────────────────────────────────────────────────────────

async function extractDocxStructured(
  buffer: Buffer,
): Promise<ExtractedDocumentText> {
  // Use convertToHtml to preserve heading structure
  const htmlResult = await mammoth.convertToHtml({ buffer });
  const rawResult = await mammoth.extractRawText({ buffer });

  const blocks = parseHtmlToBlocks(htmlResult.value);

  return {
    text: normalizeExtractedText(rawResult.value ?? ""),
    blocks,
    pageCount: null,
    detectedType: "docx",
  };
}

function parseHtmlToBlocks(html: string): StructuredBlock[] {
  const blocks: StructuredBlock[] = [];

  // Simple regex-based parsing (consider using a proper HTML parser for production)
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
  const listItemRegex = /<li[^>]*>(.*?)<\/li>/gi;

  let match: RegExpExecArray | null;

  // Extract headings
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const text = stripHtmlTags(match[2]);
    if (text.trim()) {
      blocks.push({
        text: text.trim(),
        pageNumber: null,
        fontSize: 18 - level * 2, // Approximate font size from heading level
        fontName: null,
        isBold: true,
        isItalic: false,
        x: null,
        y: null,
        lineHeight: null,
        blockType: "heading",
      });
    }
  }

  // Extract paragraphs
  while ((match = paragraphRegex.exec(html)) !== null) {
    const text = stripHtmlTags(match[1]);
    if (text.trim()) {
      blocks.push({
        text: text.trim(),
        pageNumber: null,
        fontSize: 12,
        fontName: null,
        isBold: false,
        isItalic: false,
        x: null,
        y: null,
        lineHeight: null,
        blockType: "text",
      });
    }
  }

  // Extract list items
  while ((match = listItemRegex.exec(html)) !== null) {
    const text = stripHtmlTags(match[1]);
    if (text.trim()) {
      blocks.push({
        text: text.trim(),
        pageNumber: null,
        fontSize: 12,
        fontName: null,
        isBold: false,
        isItalic: false,
        x: null,
        y: null,
        lineHeight: null,
        blockType: "list-item",
      });
    }
  }

  return blocks;
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

// ─────────────────────────────────────────────────────────────
// TXT Extraction
// ─────────────────────────────────────────────────────────────

function extractTxtStructured(buffer: Buffer): ExtractedDocumentText {
  const text = normalizeExtractedText(buffer.toString("utf-8"));

  // For plain text, create blocks from lines (heading detection happens in chunking)
  const lines = text.split("\n").filter((line) => line.trim());
  const blocks: StructuredBlock[] = lines.map((line) => ({
    text: line.trim(),
    pageNumber: null,
    fontSize: null,
    fontName: null,
    isBold: false,
    isItalic: false,
    x: null,
    y: null,
    lineHeight: null,
    blockType: "unknown" as const,
  }));

  return {
    text,
    blocks,
    pageCount: null,
    detectedType: "txt",
  };
}

// ─────────────────────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────────────────────

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
    return extractPdfStructured(buffer);
  }

  if (input.mimeType === DOCX_MIME_TYPE) {
    return extractDocxStructured(buffer);
  }

  if (TXT_MIME_TYPES.includes(input.mimeType)) {
    return extractTxtStructured(buffer);
  }

  throw new Error("Unsupported document type for extraction");
}
