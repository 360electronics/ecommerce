import { pgTable, serial, integer, index, timestamp } from 'drizzle-orm/pg-core';
import { products } from '../products/products.schema';
import { relations } from 'drizzle-orm';

/**
 * Stock table for inventory management
 */
export const stock = pgTable(
  'stock',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, {
        onDelete: 'cascade', // Delete stock if product is deleted
        onUpdate: 'cascade',
      }),
    quantity: integer('quantity').notNull().default(0), // Added default
    lowStockThreshold: integer('low_stock_threshold').notNull().default(5), // Added for alerts
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index('idx_stock_product').on(table.productId),
  })
);

export const stockRelations = relations(stock, ({ one }) => ({
  product: one(products, {
    fields: [stock.productId],
    references: [products.id],
  }),
}));