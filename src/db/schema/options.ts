import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { questions } from "./questions";

export const options = pgTable(
  "options",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),

    optionKey: text("option_key").notNull(),
    text: text("text").notNull(),
    isCorrect: boolean("is_correct").notNull(),

    explanation: text("explanation").notNull(),
    distractorRationale: text("distractor_rationale"),

    orderIndex: integer("order_index").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    questionIdIdx: index("question_options_question_id_idx").on(
      table.questionId,
    ),
    orderIndexIdx: index("question_options_order_index_idx").on(
      table.questionId,
      table.orderIndex,
    ),
  }),
);
