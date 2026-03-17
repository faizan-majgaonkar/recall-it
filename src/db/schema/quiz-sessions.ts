import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { questionBanks } from "./question-banks";
import { users } from "./users";

export const quizSessions = pgTable(
  "quiz_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    questionBankId: uuid("question_bank_id")
      .notNull()
      .references(() => questionBanks.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // 'in_progress' | 'completed'
    status: text("status").notNull().default("in_progress"),

    totalQuestions: integer("total_questions").notNull(),

    // Set when status becomes 'completed'
    correctCount: integer("correct_count"),
    score: integer("score"), // percentage 0–100

    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    completedAt: timestamp("completed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    questionBankIdIdx: index("quiz_sessions_question_bank_id_idx").on(
      table.questionBankId,
    ),
    userIdIdx: index("quiz_sessions_user_id_idx").on(table.userId),
  }),
);
