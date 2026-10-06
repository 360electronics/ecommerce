import { pgTable, serial, varchar, timestamp, text, uuid, integer } from "drizzle-orm/pg-core";
import { users } from "../user/users.schema";
import { sql } from "drizzle-orm";

export const otpTokens = pgTable("otp_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 6 }).notNull(),
  type: varchar("type", { enum: ["email", "phone"] }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  // Failed + successful verification attempts; capped to stop brute force
  attempts: integer("attempts").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const authTokens = pgTable("auth_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
