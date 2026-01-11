import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  numeric,
  text,
} from "drizzle-orm/pg-core";

export const emiAssistRequests = pgTable("emi_assist_requests", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 15 }).notNull(),
  email: varchar("email", { length: 150 }),
  pan: varchar("pan", { length: 20 }),

  productId: uuid("product_id").notNull(),
  variantId: uuid("variant_id").notNull(),

  price: numeric("price", { precision: 10, scale: 2 }).notNull(),

  bankPreference: varchar("bank_preference", { length: 50 }),

  status: varchar("status", { length: 30 })
    .default("pending")
    .$type<"pending" | "contacted" | "approved" | "rejected" | "converted">(),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});
