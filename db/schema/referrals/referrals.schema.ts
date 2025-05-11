import { pgTable, varchar, timestamp, boolean, uuid, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "../user/users.schema";


export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referralCode: varchar("referral_code", { length: 10 }).unique().notNull(),
  referrerId: uuid("referrer_id").references(() => users.id, { onDelete: "set null" }),
  status: varchar("status", { enum: ["pending", "completed"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referralId: uuid("referral_id").references(() => referrals.id, { onDelete: "set null" }),
  code: varchar("code", { length: 10 }).unique().notNull(),
  amount: numeric("amount").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});