import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { questionBanks } from "./question-banks";
import { concepts } from "./concepts";

export const questions = pgTable(
  "questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    questionBankId: uuid("question_bank_id")
      .notNull()
      .references(() => questionBanks.id, { onDelete: "cascade" }),

    primaryConceptId: uuid("primary_concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "restrict" }),

    type: text("type").notNull(),
    difficulty: text("difficulty").notNull(),
    prompt: text("prompt").notNull(),
    correctExplanation: text("correct_explanation").notNull(),

    sourceChunkIds: text("source_chunk_ids").notNull(),
    secondaryConceptIds: text("secondary_concept_ids"),

    orderIndex: integer("order_index").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    questionBankIdIdx: index("questions_question_bank_id_idx").on(
      table.questionBankId,
    ),
    primaryConceptIdIdx: index("questions_primary_concept_id_idx").on(
      table.primaryConceptId,
    ),
    orderIndexIdx: index("questions_order_index_idx").on(
      table.questionBankId,
      table.orderIndex,
    ),
  }),
);
