export interface ParsedSection {
  title: string | null;
  path: string | null;
  level: number;
  paragraphs: string[];
  pageStart: number | null;
  pageEnd: number | null;
  children: ParsedSection[];
}

export interface BuiltChunk {
  chunkIndex: number;
  sectionTitle: string | null;
  sectionPath: string | null;
  headingLevel: number | null;
  pageStart: number | null;
  pageEnd: number | null;
  text: string;
  tokenCount: number;
  isFullSection: boolean;
  overlapFromPrevious: number | null;
}
