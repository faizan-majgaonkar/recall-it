export interface StructuredBlock {
  text: string;
  pageNumber: number | null;
  fontSize: number | null;
  fontName: string | null;
  isBold: boolean;
  isItalic: boolean;
  x: number | null;
  y: number | null;
  lineHeight: number | null;
  blockType: "text" | "heading" | "list-item" | "table" | "caption" | "unknown";
}

export interface ExtractedDocumentText {
  text: string; // Keep for backward compatibility
  blocks: StructuredBlock[];
  pageCount: number | null;
  detectedType: "pdf" | "docx" | "txt";
}
