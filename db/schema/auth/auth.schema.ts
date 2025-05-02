import { pgTable, serial, varchar, timestamp, text, uuid } from "drizzle-orm/pg-core";
import { users } from "../user/users.schema";
import { sql } from "drizzle-orm";

export const otpTokens = pgTable("otp_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  token: varchar("token", { length: 6 }),
  type: varchar("type", { length: 10 }), // 'email' or 'phone'
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const authTokens = pgTable("auth_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  token: text("token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
