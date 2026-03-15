import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userSessions = pgTable(
  "user_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    tokenJti: text("token_jti").notNull(),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    ip: text("ip"),
    userAgent: text("user_agent"),
  },
  (table) => ({
    userIdIdx: index("user_sessions_user_id_idx").on(table.userId),
    tokenJtiIdx: index("user_sessions_token_jti_idx").on(table.tokenJti),
    expiresAtIdx: index("user_sessions_expires_at_idx").on(table.expiresAt),
  }),
);
