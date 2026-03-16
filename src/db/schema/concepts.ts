import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { documents } from "./documents";

export const concepts = pgTable(
  "concepts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    summary: text("summary"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    documentIdIdx: index("concepts_document_id_idx").on(table.documentId),
    normalizedNameIdx: index("concepts_normalized_name_idx").on(
      table.documentId,
      table.normalizedName,
    ),
  }),
);
