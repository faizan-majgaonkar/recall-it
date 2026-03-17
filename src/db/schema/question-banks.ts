import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { documents } from "./documents";
import { users } from "./users";

export const questionBanks = pgTable(
  "question_banks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    questionCount: integer("question_count").notNull(),
    generationStatus: text("generation_status").notNull().default("generated"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    documentIdIdx: index("question_banks_document_id_idx").on(table.documentId),
    userIdIdx: index("question_banks_user_id_idx").on(table.userId),
  }),
);
