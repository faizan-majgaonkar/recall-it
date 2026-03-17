import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    chunkIndex: integer("chunk_index").notNull(),
    sectionTitle: text("section_title"),
    sectionPath: text("section_path"),
    headingLevel: integer("heading_level"),

    pageStart: integer("page_start"),
    pageEnd: integer("page_end"),

    text: text("text").notNull(),
    tokenCount: integer("token_count"),
    isFullSection: boolean("is_full_section").notNull().default(false),
    overlapFromPrevious: integer("overlap_from_previous"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    documentIdIdx: index("document_chunks_document_id_idx").on(
      table.documentId,
    ),
    chunkIndexIdx: index("document_chunks_chunk_index_idx").on(
      table.documentId,
      table.chunkIndex,
    ),
  }),
);
