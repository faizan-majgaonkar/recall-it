import { pgTable, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { concepts } from "./concepts";
import { documentChunks } from "./document-chunks";

export const conceptChunkLinks = pgTable(
  "concept_chunk_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    conceptId: uuid("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),

    chunkId: uuid("chunk_id")
      .notNull()
      .references(() => documentChunks.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    conceptIdIdx: index("concept_chunk_links_concept_id_idx").on(
      table.conceptId,
    ),
    chunkIdIdx: index("concept_chunk_links_chunk_id_idx").on(table.chunkId),
  }),
);
