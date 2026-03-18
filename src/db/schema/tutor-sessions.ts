import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { documents } from "./documents";
import { users } from "./users";
import { quizSessions } from "./quiz-sessions";

export const tutorSessions = pgTable(
  "tutor_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    quizSessionId: uuid("quiz_session_id").references(() => quizSessions.id, {
      onDelete: "set null",
    }),

    // Serialised JSON array of concept IDs to focus on
    weakConceptIds: text("weak_concept_ids"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    documentIdIdx: index("tutor_sessions_document_id_idx").on(table.documentId),
    userIdIdx: index("tutor_sessions_user_id_idx").on(table.userId),
  }),
);
