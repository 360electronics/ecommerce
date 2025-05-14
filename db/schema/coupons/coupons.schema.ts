
import { pgTable, uuid, timestamp, varchar, numeric, boolean, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "../user/users.schema";
import { referrals } from "../referrals/referrals.schema";

export const specialCoupons = pgTable("special_coupons", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 10 }).unique().notNull(),
  amount: numeric("amount"),
  percentage: numeric("percentage"),
  limit: numeric("limit").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const specialCouponUsage = pgTable("special_coupon_usage", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  couponId: uuid("coupon_id").notNull().references(() => specialCoupons.id, { onDelete: "cascade" }),
  usedAt: timestamp("used_at").defaultNow().notNull(),
}, (table) => ([unique("unique_user_coupon").on(table.userId, table.couponId),
]));

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