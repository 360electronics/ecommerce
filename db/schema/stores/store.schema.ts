import { pgTable, text,  jsonb, timestamp, uuid, doublePrecision } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm"; 

export const stores = pgTable("stores", {
  id:  uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  pincode: text("pincode"),
  phone: text("phone"),
  email: text("email"),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  tags: jsonb("tags"),
  opening_hours: jsonb("opening_hours"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
