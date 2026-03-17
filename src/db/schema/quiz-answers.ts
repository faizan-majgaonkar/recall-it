import {
  pgTable,
  timestamp,
  uuid,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { quizSessions } from "./quiz-sessions";
import { questions } from "./questions";
import { options } from "./options";

export const quizAnswers = pgTable(
  "quiz_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    sessionId: uuid("session_id")
      .notNull()
      .references(() => quizSessions.id, { onDelete: "cascade" }),

    questionId: uuid("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "restrict" }),

    selectedOptionId: uuid("selected_option_id")
      .notNull()
      .references(() => options.id, { onDelete: "restrict" }),

    // Denormalized for fast scoring and weak concept queries
    isCorrect: boolean("is_correct").notNull(),

    answeredAt: timestamp("answered_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdIdx: index("quiz_answers_session_id_idx").on(table.sessionId),
    questionIdIdx: index("quiz_answers_question_id_idx").on(table.questionId),
    sessionQuestionIdx: index("quiz_answers_session_question_idx").on(
      table.sessionId,
      table.questionId,
    ),
  }),
);
