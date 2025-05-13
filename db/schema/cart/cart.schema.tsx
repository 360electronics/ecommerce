import { pgTable, uuid, timestamp, varchar, integer, unique, index } from 'drizzle-orm/pg-core';
import { users } from '../user/users.schema';
import { products, variants } from '../products/products.schema';
import { sql } from 'drizzle-orm';

export const cart = pgTable(
  "cart",
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
    quantity: integer("quantity").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ([unique("unique_user_product_variant").on(
    table.userId,
    table.productId,
    table.variantId
  ),
  index("idx_cart_user_id").on(table.userId),
  index("idx_cart_product_id").on(table.productId),
  index("idx_cart_variant_id").on(table.variantId),
  ])
);