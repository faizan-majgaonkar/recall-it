import { pgTable, text, timestamp, uuid, integer, index } from "drizzle-orm/pg-core";
import { tutorSessions } from "./tutor-sessions";

export const tutorMessages = pgTable(
  "tutor_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    sessionId: uuid("session_id")
      .notNull()
      .references(() => tutorSessions.id, { onDelete: "cascade" }),

    role: text("role").notNull(), // 'user' | 'assistant'
    content: text("content").notNull(),

    // Serialised JSON array of chunk IDs used as sources
    sourceChunkIds: text("source_chunk_ids"),

    orderIndex: integer("order_index").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdIdx: index("tutor_messages_session_id_idx").on(table.sessionId),
  }),
);
