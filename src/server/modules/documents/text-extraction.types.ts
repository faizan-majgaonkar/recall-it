export type ExtractedDocumentText = {
  text: string;
  pageCount: number | null;
  detectedType: "pdf" | "docx" | "txt";
};
