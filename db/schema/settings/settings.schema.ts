import { pgTable, varchar, jsonb, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "../user/users.schema";

// Key/value store for admin-editable configuration (e.g. key "checkout").
export const storeSettings = pgTable("store_settings", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
