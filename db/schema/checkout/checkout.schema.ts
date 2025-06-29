import { pgTable, uuid, timestamp, integer, unique, index, numeric } from 'drizzle-orm/pg-core';
import { users } from '../user/users.schema';
import { products, variants } from '../products/products.schema';
import { sql } from 'drizzle-orm';
import { cart_offer_products } from '../cart/cart.schema';

export const checkout = pgTable(
  "checkout",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => variants.id, { onDelete: "cascade" }),
    cartOfferProductId: uuid("cart_offer_product_id").references(() => cart_offer_products.id),
    totalPrice: numeric("total_price").notNull(),
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ([unique("checkout_unique_user_product_variant").on(
    table.userId,
    table.productId,
    table.variantId
  ),
  index("idx_checkout_user_id").on(table.userId),
  index("idx_checkout_product_id").on(table.productId),
  index("idx_checkout_variant_id").on(table.variantId),
  ])
);