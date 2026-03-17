import type { BuiltChunk, ParsedSection } from "./chunking.types";
import type {
  ExtractedDocumentText,
  StructuredBlock,
} from "./text-extraction.types";

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const MIN_CHUNK_TOKENS = 150;
const TARGET_CHUNK_TOKENS = 550;
const MAX_CHUNK_TOKENS = 800;
const OVERLAP_TOKENS = 100;

const MIN_HEADING_LENGTH = 2;
const MAX_HEADING_LENGTH = 120;
const HEADING_SCORE_THRESHOLD = 5;

// ─────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────

function estimateTokenCount(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words * 1.3));
}

function normalizeText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitIntoParagraphs(text: string): string[] {
  return normalizeText(text)
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function takeOverlapText(text: string, targetTokens: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const targetWords = Math.max(1, Math.floor(targetTokens / 1.3));
  return words.slice(-targetWords).join(" ");
}

// ─────────────────────────────────────────────────────────────
// Noise Removal
// ─────────────────────────────────────────────────────────────

function removeDocumentNoise(blocks: StructuredBlock[]): StructuredBlock[] {
  if (blocks.length === 0) return blocks;

  // ─────────────────────────────────────────────────────────────
  // 1. Detect repeated text across pages (headers/footers)
  // ─────────────────────────────────────────────────────────────
  const textByPage = new Map<string, Set<number>>();

  for (const block of blocks) {
    const normalized = block.text.trim().toLowerCase();
    if (normalized.length < 2 || normalized.length > 150) continue;

    if (!textByPage.has(normalized)) {
      textByPage.set(normalized, new Set());
    }
    if (block.pageNumber !== null) {
      textByPage.get(normalized)!.add(block.pageNumber);
    }
  }

  // Text appearing on 3+ pages is likely repeated header/footer
  const repeatedTextPatterns = new Set<string>();
  for (const [text, pages] of textByPage) {
    if (pages.size >= 3) {
      repeatedTextPatterns.add(text);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Detect author/title headers (often at top of pages)
  // ─────────────────────────────────────────────────────────────
  // Pattern: "PageNumber AuthorNames" or "AuthorNames PageNumber"
  // Example: "24 M. Ghosh and A. Thirugnanam"

  const authorHeaderPattern =
    /^\d+\s+[A-Z]\.\s*[A-Za-z]+(\s+and\s+[A-Z]\.\s*[A-Za-z]+)*$/;
  const reverseAuthorPattern =
    /^[A-Z]\.\s*[A-Za-z]+(\s+and\s+[A-Z]\.\s*[A-Za-z]+)*\s+\d+$/;

  // Also detect standalone page numbers
  const pageNumberPatterns = [
    /^(?:page\s*)?\d+$/i, // "24" or "Page 24"
    /^\d+\s*of\s*\d+$/i, // "24 of 100"
    /^[-–—]\s*\d+\s*[-–—]$/, // "- 24 -"
    /^\[\s*\d+\s*\]$/, // "[24]"
  ];

  // ─────────────────────────────────────────────────────────────
  // 3. Detect by position (top/bottom of page)
  // ─────────────────────────────────────────────────────────────
  // Group blocks by page and identify likely header/footer positions

  const blocksByPage = new Map<number, StructuredBlock[]>();
  for (const block of blocks) {
    if (block.pageNumber === null) continue;
    if (!blocksByPage.has(block.pageNumber)) {
      blocksByPage.set(block.pageNumber, []);
    }
    blocksByPage.get(block.pageNumber)!.push(block);
  }

  // For each page, find the Y positions of top and bottom blocks
  const likelyHeaderFooterBlocks = new Set<StructuredBlock>();

  for (const [pageNum, pageBlocks] of blocksByPage) {
    if (pageBlocks.length < 3) continue;

    // Sort by Y position (assuming higher Y = lower on page for most PDFs)
    const sortedByY = [...pageBlocks]
      .filter((b) => b.y !== null)
      .sort((a, b) => (b.y ?? 0) - (a.y ?? 0));

    if (sortedByY.length < 3) continue;

    // Check top block (first in sorted = highest Y in some PDFs, or lowest)
    // PDF Y coordinates vary by library, so check both ends
    const topCandidate = sortedByY[sortedByY.length - 1];
    const bottomCandidate = sortedByY[0];

    for (const candidate of [topCandidate, bottomCandidate]) {
      const text = candidate.text.trim();

      // Short text at page extremes is likely header/footer
      if (text.length < 60 && text.split(/\s+/).length <= 8) {
        // Check if it matches author header or page number pattern
        if (
          authorHeaderPattern.test(text) ||
          reverseAuthorPattern.test(text) ||
          pageNumberPatterns.some((p) => p.test(text))
        ) {
          likelyHeaderFooterBlocks.add(candidate);
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Filter out noise blocks
  // ─────────────────────────────────────────────────────────────

  return blocks.filter((block) => {
    const text = block.text.trim();
    const normalized = text.toLowerCase();

    // Remove if identified as header/footer by position
    if (likelyHeaderFooterBlocks.has(block)) return false;

    // Remove if repeated across many pages
    if (repeatedTextPatterns.has(normalized)) return false;

    // Remove standalone page numbers
    if (pageNumberPatterns.some((p) => p.test(text))) return false;

    // Remove author-style headers
    if (authorHeaderPattern.test(text) || reverseAuthorPattern.test(text))
      return false;

    // Remove very short text that looks like page markers
    if (text.length <= 5 && /^\d+$/.test(text)) return false;

    return true;
  });
}

// ─────────────────────────────────────────────────────────────
// Heading Detection (Multi-Signal Scoring)
// ─────────────────────────────────────────────────────────────

interface HeadingCandidate {
  block: StructuredBlock;
  index: number;
  score: number;
  level: number;
}

function computeHeadingScore(
  block: StructuredBlock,
  nextBlock: StructuredBlock | null,
  medianFontSize: number | null,
): { score: number; level: number } {
  const text = block.text.trim();

  if (text.length < MIN_HEADING_LENGTH || text.length > MAX_HEADING_LENGTH) {
    return { score: 0, level: 0 };
  }

  let score = 0;
  let level = 3; // Default to mid-level

  // Signal 1: Explicit markdown headings
  const markdownMatch = text.match(/^(#{1,6})\s+/);
  if (markdownMatch) {
    score += 6;
    level = markdownMatch[1].length;
  }

  // Signal 2: Numbered section patterns (1, 1.1, 2.3.4, etc.)
  const numberedMatch = text.match(/^(\d+(?:\.\d+)*)[\).:]?\s+[A-Za-z]/);
  if (numberedMatch) {
    score += 5;
    const depth = numberedMatch[1].split(".").length;
    level = Math.min(depth, 4);
  }

  // Signal 3: Roman numeral patterns
  if (/^[IVXLC]+\.\s+[A-Za-z]/i.test(text)) {
    score += 4;
    level = 1;
  }

  // Signal 4: Chapter/Section/Appendix keywords
  if (/^(chapter|section|appendix|part)\s+\w+/i.test(text)) {
    score += 4;
    level = 1;
  }

  // Signal 5: Font size larger than body text (from structured extraction)
  if (
    medianFontSize !== null &&
    block.fontSize !== null &&
    block.fontSize > medianFontSize * 1.15
  ) {
    score += 4;
    // Larger fonts = higher level headings
    const sizeRatio = block.fontSize / medianFontSize;
    if (sizeRatio > 1.5) level = 1;
    else if (sizeRatio > 1.3) level = 2;
  }

  // Signal 6: Bold text (from structured extraction)
  if (block.isBold) {
    score += 3;
  }

  // Signal 7: Block already marked as heading during extraction
  if (block.blockType === "heading") {
    score += 3;
  }

  // Signal 8: ALL CAPS short text
  if (/^[A-Z0-9\s\-/:()&,]+$/.test(text) && text.split(/\s+/).length <= 10) {
    score += 2;
  }

  // Signal 9: Starts with capital, no terminal punctuation
  if (/^[A-Z]/.test(text) && !/[.!?]$/.test(text)) {
    score += 2;
  }

  // Signal 10: Short length
  if (text.split(/\s+/).length <= 8) {
    score += 1;
  }

  // Signal 11: Next block is longer (body text follows)
  if (nextBlock && nextBlock.text.length > text.length + 30) {
    score += 2;
  }

  return { score, level };
}

function detectHeadings(
  blocks: StructuredBlock[],
): Map<number, HeadingCandidate> {
  const headings = new Map<number, HeadingCandidate>();

  // Calculate median font size for comparison
  const fontSizes = blocks
    .map((b) => b.fontSize)
    .filter((s): s is number => s !== null);
  const sortedSizes = [...fontSizes].sort((a, b) => a - b);
  const medianFontSize =
    sortedSizes.length > 0
      ? sortedSizes[Math.floor(sortedSizes.length / 2)]
      : null;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const nextBlock = blocks[i + 1] ?? null;

    const { score, level } = computeHeadingScore(
      block,
      nextBlock,
      medianFontSize,
    );

    if (score >= HEADING_SCORE_THRESHOLD) {
      headings.set(i, { block, index: i, score, level });
    }
  }

  return headings;
}

// ─────────────────────────────────────────────────────────────
// Section Tree Building
// ─────────────────────────────────────────────────────────────

function buildSectionTree(
  blocks: StructuredBlock[],
  headings: Map<number, HeadingCandidate>,
): ParsedSection[] {
  if (blocks.length === 0) {
    return [];
  }

  // If no reliable headings found, return single section
  if (headings.size < 2) {
    return [
      {
        title: "Document",
        path: "Document",
        level: 0,
        paragraphs: blocks.map((b) => b.text),
        pageStart: blocks[0]?.pageNumber ?? null,
        pageEnd: blocks[blocks.length - 1]?.pageNumber ?? null,
        children: [],
      },
    ];
  }

  const sections: ParsedSection[] = [];
  const sectionStack: ParsedSection[] = [];

  let currentParagraphs: string[] = [];
  let currentPageStart: number | null = null;
  let currentPageEnd: number | null = null;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const heading = headings.get(i);

    if (heading) {
      // Finalize previous section's content
      if (sectionStack.length > 0) {
        const current = sectionStack[sectionStack.length - 1];
        current.paragraphs.push(...currentParagraphs);
        if (currentPageEnd !== null) {
          current.pageEnd = currentPageEnd;
        }
      } else if (currentParagraphs.length > 0) {
        // Content before first heading
        sections.push({
          title: "Preamble",
          path: "Preamble",
          level: 0,
          paragraphs: currentParagraphs,
          pageStart: currentPageStart,
          pageEnd: currentPageEnd,
          children: [],
        });
      }

      currentParagraphs = [];
      currentPageStart = block.pageNumber;
      currentPageEnd = block.pageNumber;

      // Create new section
      const newSection: ParsedSection = {
        title: block.text.replace(/^#+\s*/, "").trim(),
        path: block.text.replace(/^#+\s*/, "").trim(),
        level: heading.level,
        paragraphs: [],
        pageStart: block.pageNumber,
        pageEnd: block.pageNumber,
        children: [],
      };

      // Find correct parent based on heading level
      while (
        sectionStack.length > 0 &&
        sectionStack[sectionStack.length - 1].level >= heading.level
      ) {
        sectionStack.pop();
      }

      if (sectionStack.length > 0) {
        const parent = sectionStack[sectionStack.length - 1];
        parent.children.push(newSection);
        newSection.path = `${parent.path} > ${newSection.title}`;
      } else {
        sections.push(newSection);
      }

      sectionStack.push(newSection);
    } else {
      // Regular content block
      if (block.text.trim()) {
        currentParagraphs.push(block.text.trim());
        if (currentPageStart === null) {
          currentPageStart = block.pageNumber;
        }
        currentPageEnd = block.pageNumber;
      }
    }
  }

  // Finalize last section
  if (sectionStack.length > 0 && currentParagraphs.length > 0) {
    const current = sectionStack[sectionStack.length - 1];
    current.paragraphs.push(...currentParagraphs);
    if (currentPageEnd !== null) {
      current.pageEnd = currentPageEnd;
    }
  }

  return sections;
}

// ─────────────────────────────────────────────────────────────
// Flatten Sections for Chunking
// ─────────────────────────────────────────────────────────────

interface FlatSection {
  title: string | null;
  path: string | null;
  level: number;
  text: string;
  pageStart: number | null;
  pageEnd: number | null;
  tokenCount: number;
}

function flattenSectionsForChunking(sections: ParsedSection[]): FlatSection[] {
  const flat: FlatSection[] = [];

  function traverse(section: ParsedSection) {
    const sectionText = section.paragraphs.join("\n\n").trim();
    const tokenCount = estimateTokenCount(sectionText);

    // If section has children and is large, prefer chunking children separately
    if (section.children.length > 0) {
      // Only include parent's direct content if it has meaningful text
      if (sectionText && tokenCount >= MIN_CHUNK_TOKENS) {
        flat.push({
          title: section.title,
          path: section.path,
          level: section.level,
          text: sectionText,
          pageStart: section.pageStart,
          pageEnd: section.pageEnd,
          tokenCount,
        });
      }

      // Process children
      for (const child of section.children) {
        traverse(child);
      }
    } else {
      // Leaf section - include all content
      if (sectionText) {
        flat.push({
          title: section.title,
          path: section.path,
          level: section.level,
          text: sectionText,
          pageStart: section.pageStart,
          pageEnd: section.pageEnd,
          tokenCount,
        });
      }
    }
  }

  for (const section of sections) {
    traverse(section);
  }

  return flat;
}

// ─────────────────────────────────────────────────────────────
// Chunk Building
// ─────────────────────────────────────────────────────────────

interface ChunkDraft {
  sectionTitle: string | null;
  sectionPath: string | null;
  level: number;
  text: string;
  tokenCount: number;
  pageStart: number | null;
  pageEnd: number | null;
  isFullSection: boolean;
  overlapFromPrevious: number | null;
}

function buildChunksFromSection(section: FlatSection): ChunkDraft[] {
  const { text, tokenCount, title, path, level, pageStart, pageEnd } = section;

  // Section is within acceptable range - keep as single chunk
  if (tokenCount <= MAX_CHUNK_TOKENS) {
    return [
      {
        sectionTitle: title,
        sectionPath: path,
        level,
        text,
        tokenCount,
        pageStart,
        pageEnd,
        isFullSection: true,
        overlapFromPrevious: null,
      },
    ];
  }

  // Section too large - split by paragraphs
  const paragraphs = splitIntoParagraphs(text);
  const chunks: ChunkDraft[] = [];

  let currentText = "";
  let previousFinalizedText: string | null = null;

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue;

    const candidateText = currentText
      ? `${currentText}\n\n${paragraph}`
      : paragraph;
    const candidateTokens = estimateTokenCount(candidateText);

    if (candidateTokens <= MAX_CHUNK_TOKENS) {
      currentText = candidateText;
      continue;
    }

    // Finalize current chunk
    if (currentText) {
      chunks.push({
        sectionTitle: title,
        sectionPath: path,
        level,
        text: currentText,
        tokenCount: estimateTokenCount(currentText),
        pageStart,
        pageEnd,
        isFullSection: false,
        overlapFromPrevious: previousFinalizedText
          ? estimateTokenCount(
              takeOverlapText(previousFinalizedText, OVERLAP_TOKENS),
            )
          : null,
      });

      previousFinalizedText = currentText;
      const overlap = takeOverlapText(currentText, OVERLAP_TOKENS);
      currentText = overlap ? `${overlap}\n\n${paragraph}` : paragraph;

      if (estimateTokenCount(currentText) <= MAX_CHUNK_TOKENS) {
        continue;
      }
    } else {
      currentText = paragraph;
    }

    // Try sentence-level splitting
    const sentenceChunks = splitBySentences(
      currentText,
      title,
      path,
      level,
      pageStart,
      pageEnd,
      previousFinalizedText,
    );

    if (sentenceChunks.length > 0) {
      chunks.push(...sentenceChunks);
      previousFinalizedText = sentenceChunks[sentenceChunks.length - 1].text;
      currentText = "";
    } else {
      // Hard split as final fallback
      const hardChunks = hardSplitText(
        currentText,
        title,
        path,
        level,
        pageStart,
        pageEnd,
        previousFinalizedText,
      );
      chunks.push(...hardChunks);
      previousFinalizedText = hardChunks[hardChunks.length - 1]?.text ?? null;
      currentText = "";
    }
  }

  // Finalize remaining text
  if (currentText.trim()) {
    const finalTokens = estimateTokenCount(currentText);
    if (finalTokens <= MAX_CHUNK_TOKENS) {
      chunks.push({
        sectionTitle: title,
        sectionPath: path,
        level,
        text: currentText.trim(),
        tokenCount: finalTokens,
        pageStart,
        pageEnd,
        isFullSection: false,
        overlapFromPrevious: previousFinalizedText
          ? estimateTokenCount(
              takeOverlapText(previousFinalizedText, OVERLAP_TOKENS),
            )
          : null,
      });
    } else {
      chunks.push(
        ...hardSplitText(
          currentText,
          title,
          path,
          level,
          pageStart,
          pageEnd,
          previousFinalizedText,
        ),
      );
    }
  }

  return chunks;
}

function splitBySentences(
  text: string,
  title: string | null,
  path: string | null,
  level: number,
  pageStart: number | null,
  pageEnd: number | null,
  previousFinalizedText: string | null,
): ChunkDraft[] {
  const sentences = splitIntoSentences(text);
  if (sentences.length <= 1) return [];

  const chunks: ChunkDraft[] = [];
  let currentText = "";
  let prevText = previousFinalizedText;

  for (const sentence of sentences) {
    const candidate = currentText ? `${currentText} ${sentence}` : sentence;

    if (estimateTokenCount(candidate) <= MAX_CHUNK_TOKENS) {
      currentText = candidate;
      continue;
    }

    if (currentText) {
      chunks.push({
        sectionTitle: title,
        sectionPath: path,
        level,
        text: currentText,
        tokenCount: estimateTokenCount(currentText),
        pageStart,
        pageEnd,
        isFullSection: false,
        overlapFromPrevious: prevText
          ? estimateTokenCount(takeOverlapText(prevText, OVERLAP_TOKENS))
          : null,
      });

      prevText = currentText;
      const overlap = takeOverlapText(currentText, OVERLAP_TOKENS);
      currentText = overlap ? `${overlap} ${sentence}` : sentence;
    } else {
      currentText = sentence;
    }
  }

  if (currentText.trim()) {
    chunks.push({
      sectionTitle: title,
      sectionPath: path,
      level,
      text: currentText.trim(),
      tokenCount: estimateTokenCount(currentText),
      pageStart,
      pageEnd,
      isFullSection: false,
      overlapFromPrevious: prevText
        ? estimateTokenCount(takeOverlapText(prevText, OVERLAP_TOKENS))
        : null,
    });
  }

  // Verify all chunks are within limits
  const oversized = chunks.some((c) => c.tokenCount > MAX_CHUNK_TOKENS);
  return oversized ? [] : chunks;
}

function hardSplitText(
  text: string,
  title: string | null,
  path: string | null,
  level: number,
  pageStart: number | null,
  pageEnd: number | null,
  previousFinalizedText: string | null,
): ChunkDraft[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordsPerChunk = Math.max(1, Math.floor(MAX_CHUNK_TOKENS / 1.3));
  const overlapWords = Math.max(1, Math.floor(OVERLAP_TOKENS / 1.3));

  const chunks: ChunkDraft[] = [];
  let start = 0;
  let prevText = previousFinalizedText;

  while (start < words.length) {
    const end = Math.min(words.length, start + wordsPerChunk);
    const chunkText = words.slice(start, end).join(" ");

    chunks.push({
      sectionTitle: title,
      sectionPath: path,
      level,
      text: chunkText,
      tokenCount: estimateTokenCount(chunkText),
      pageStart,
      pageEnd,
      isFullSection: false,
      overlapFromPrevious: prevText
        ? estimateTokenCount(takeOverlapText(prevText, OVERLAP_TOKENS))
        : null,
    });

    if (end >= words.length) break;

    prevText = chunkText;
    start = Math.max(end - overlapWords, start + 1);
  }

  return chunks;
}

// ─────────────────────────────────────────────────────────────
// Merge Small Adjacent Sections
// ─────────────────────────────────────────────────────────────

function mergeSmallSections(sections: FlatSection[]): FlatSection[] {
  if (sections.length <= 1) return sections;

  const merged: FlatSection[] = [];
  let pending: FlatSection | null = null;

  for (const section of sections) {
    if (!pending) {
      if (section.tokenCount < MIN_CHUNK_TOKENS) {
        pending = section;
      } else {
        merged.push(section);
      }
      continue;
    }

    // Try to merge pending with current if:
    // 1. Same or adjacent heading level
    // 2. Combined size is acceptable
    const levelDiff = Math.abs(pending.level - section.level);
    const combinedTokens = pending.tokenCount + section.tokenCount;

    if (levelDiff <= 1 && combinedTokens <= TARGET_CHUNK_TOKENS) {
      pending = {
        title: pending.title,
        path: pending.path,
        level: Math.min(pending.level, section.level),
        text: `${pending.text}\n\n${section.text}`,
        pageStart: pending.pageStart,
        pageEnd: section.pageEnd,
        tokenCount: combinedTokens,
      };
    } else {
      // Can't merge - push pending and continue
      merged.push(pending);
      pending = section.tokenCount < MIN_CHUNK_TOKENS ? section : null;
      if (!pending) {
        merged.push(section);
      }
    }
  }

  if (pending) {
    merged.push(pending);
  }

  return merged;
}

// ─────────────────────────────────────────────────────────────
// Main Entry Points
// ─────────────────────────────────────────────────────────────

export function buildDocumentChunks(
  document: ExtractedDocumentText,
): BuiltChunk[] {
  const { blocks } = document;

  // Step 1: Remove noise
  const cleanBlocks = removeDocumentNoise(blocks);

  // Step 2: Detect headings
  const headings = detectHeadings(cleanBlocks);

  // Step 3: Build section tree
  const sectionTree = buildSectionTree(cleanBlocks, headings);

  // Step 4: Flatten for chunking (prefer smallest meaningful unit)
  let flatSections = flattenSectionsForChunking(sectionTree);

  // Step 5: Merge small adjacent sections
  flatSections = mergeSmallSections(flatSections);

  // Step 6: Build chunks from each section
  const allChunks: ChunkDraft[] = [];
  for (const section of flatSections) {
    allChunks.push(...buildChunksFromSection(section));
  }

  // Step 7: Assign final indices and return
  return allChunks.map((chunk, index) => ({
    chunkIndex: index,
    sectionTitle: chunk.sectionTitle,
    sectionPath: chunk.sectionPath,
    headingLevel: chunk.level,
    pageStart: chunk.pageStart,
    pageEnd: chunk.pageEnd,
    text: chunk.text,
    tokenCount: chunk.tokenCount,
    isFullSection: chunk.isFullSection,
    overlapFromPrevious: chunk.overlapFromPrevious,
  }));
}

// Backward-compatible entry point using just text
export function buildDocumentChunksFromText(text: string): BuiltChunk[] {
  // Create synthetic blocks for text-only input
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

  const syntheticDocument: ExtractedDocumentText = {
    text,
    blocks,
    pageCount: null,
    detectedType: "txt",
  };

  return buildDocumentChunks(syntheticDocument);
}
