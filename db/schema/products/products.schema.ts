import {
    pgTable,
    serial,
    varchar,
    text,
    numeric,
    boolean,
    integer,
    jsonb,
    timestamp,
    index,
    unique,
  } from 'drizzle-orm/pg-core';
  import { categories } from '../category/categories.schema';
  import { stock } from '../stock/stocks.schema';
  import { relations } from 'drizzle-orm';
import { reviews } from '../review/reviews.schema';
  

  export const products = pgTable(
    'products',
    {
      id: serial('id').primaryKey(),
      name: varchar('name', { length: 255 }).notNull(),
      slug: varchar('slug', { length: 255 }).notNull(), 
      description: text('description').notNull(),
      categoryId: integer('category_id')
        .notNull()
        .references(() => categories.id, {
          onDelete: 'restrict', // Prevent category deletion if products exist
          onUpdate: 'cascade',
        }),
      brandName: varchar('brand_name', { length: 100 }),
      price: numeric('price', { precision: 10, scale: 2 }).notNull(),
      discountedPrice: numeric('discounted_price', { precision: 10, scale: 2 }),
      deliveryMode: varchar('delivery_mode', {
        enum: ['standard', 'express'],
      })
        .notNull()
        .default('standard'),
      productImages: jsonb('product_images').$type<string[]>().notNull().default([]), 
      sku: varchar('sku', { length: 100 }).notNull(), // Made notNull for inventory tracking
      createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
      updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => ({
      skuIdx: index('idx_product_sku').on(table.sku),
      categoryIdx: index('idx_product_category').on(table.categoryId),
      slugIdx: index('idx_product_slug').on(table.slug),
      uniqueSku: unique('uniq_product_sku').on(table.sku),
    })
  );
  
  // Define relations for type-safe joins
  export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, {
      fields: [products.categoryId],
      references: [categories.id],
    }),
    stock: one(stock),
    reviews: many(reviews),
  }));