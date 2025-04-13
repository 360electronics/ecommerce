import { pgTable, serial, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { users } from "../user/users.schema";

export const otpTokens = pgTable("otp_tokens", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  token: varchar("token", { length: 6 }),
  type: varchar("type", { length: 10 }), // 'email' or 'phone'
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const authTokens = pgTable("auth_tokens", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  token: text("token"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
