import { pgTable, varchar, timestamp, boolean, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  image: varchar("image", { length: 255 }),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  phoneNumber: varchar("phone_number", { length: 20 }).unique(),
  emailVerified: boolean("email_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  role: varchar("role", {
    enum: ["user", "admin", "guest"],
  }).default("user").notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const savedAddresses = pgTable(
  "saved_addresses",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
    addressLine1: varchar("address_line1", { length: 255 }).notNull(),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }).notNull(),
    postalCode: varchar("postal_code", { length: 20 }).notNull(),
    country: varchar("country", { length: 100 }).notNull(),
    gst: varchar("gst", { length: 100 }),
    addressType: varchar("address_type", {
      enum: ["home", "work", "other"],
    }).default("home").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
);
