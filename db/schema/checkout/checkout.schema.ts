import {
  pgTable,
  uuid,
  timestamp,
  integer,
  unique,
  index,
  numeric,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "../user/users.schema";
import { products, variants } from "../products/products.schema";
import { sql } from "drizzle-orm";
import { cart_offer_products } from "../cart/cart.schema";

export const checkout = pgTable(
  "checkout",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => variants.id, { onDelete: "cascade" }),
    cartOfferProductId: uuid("cart_offer_product_id").references(
      () => cart_offer_products.id
    ),
    totalPrice: numeric("total_price").notNull(),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    checkoutSessionId: uuid("checkout_session_id")
      .notNull()
      .references(() => checkoutSessions.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("uniq_checkout_item").on(table.checkoutSessionId, table.variantId),
    index("idx_checkout_user_id").on(table.userId),
    index("idx_checkout_product_id").on(table.productId),
    index("idx_checkout_variant_id").on(table.variantId),
  ]
);

export const checkoutSessions = pgTable(
  "checkout_sessions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    status: varchar("status", {
      enum: ["active", "expired", "converted"],
    })
      .notNull()
      .default("active"),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    lockedAt: timestamp("locked_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
     index("uniq_active_checkout_session")
      .on(t.userId)
      .where(sql`status = 'active'`),
    index("idx_checkout_session_user").on(t.userId),
  ]
);
