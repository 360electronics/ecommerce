import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  jsonb,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { users } from '../user/users.schema';
import { sql } from 'drizzle-orm';

// Products table
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    shortName: varchar('short_name', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 255 }).notNull(),
    brand: varchar('brand', { length: 255 }).notNull(),
    status: varchar('status', {
      enum: ['active', 'inactive'],
    }).notNull().default('active'),
    subProductStatus: varchar('sub_product_status', {
      enum: ['active', 'inactive'],
    }).notNull().default('active'),
    totalStocks: numeric('total_stocks', { precision: 10, scale: 0 }).notNull().default('0'),
    deliveryMode: varchar('delivery_mode', {
      enum: ['standard', 'express'],
    }).notNull().default('standard'),
    tags: varchar('tags', { length: 255 }), // Nullable, comma-separated string
    specifications: jsonb('specifications').$type<{
      groupName: string;
      fields: { fieldName: string; fieldValue: string }[];
    }[]>().notNull().default([]),
    averageRating: numeric('average_rating', { precision: 2, scale: 1 }).default('0.0').notNull(),
    ratingCount: numeric('rating_count', { precision: 10, scale: 0 }).default('0').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  }
);

// Variants table
export const variants = pgTable(
  'variants',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(), // Added slug field
    color: varchar('color', { length: 255 }).notNull(),
    material: varchar('material', { length: 100 }),
    dimensions: varchar('dimensions', { length: 100 }),
    weight: varchar('weight', { length: 100 }),
    storage: varchar('storage', { length: 100 }),
    stock: numeric('stock', { precision: 10, scale: 0 }).notNull().default('0'),
    mrp: numeric('mrp', { precision: 10, scale: 2 }).notNull(),
    ourPrice: numeric('our_price', { precision: 10, scale: 2 }).notNull(),
    productImages: jsonb('product_images').$type<string[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_variant_product_id').on(table.productId),
    index('idx_variant_sku').on(table.sku),
    unique('uniq_variant_sku').on(table.sku),
    index('idx_variant_slug').on(table.slug), // Index for slug
    unique('uniq_variant_slug').on(table.slug), // Unique constraint for slug
  ]
);

export const featuredProducts = pgTable(
  'featured_products',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    variantId: uuid('variant_id')
      .references(() => variants.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_featured_product_id').on(table.productId),
    index('idx_featured_variant_id').on(table.variantId),
    unique('uniq_featured_variant_id').on(table.variantId), // Prevent duplicate featured variants
  ]
);

export const newArrivals = pgTable(
  'new_arrivals',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    variantId: uuid('variant_id')
      .references(() => variants.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_new_arrivals_product_id').on(table.productId),
    index('idx_new_arrivals_variant_id').on(table.variantId),
    unique('uniq_new_arrivals_variant_id').on(table.variantId), // Prevent duplicate new arrivals
  ]
);

export const gamersZone = pgTable(
  'gamers_zone',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    variantId: uuid('variant_id')
      .references(() => variants.id, { onDelete: 'cascade' })
      .notNull(),
    category: varchar('category', {
      length: 255,
      enum: ['laptops', 'desktops', 'accessories', 'consoles'],
    })
      .notNull()
      .default('laptops'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_gamers_zone_product_id').on(table.productId),
    index('idx_gamers_zone_variant_id').on(table.variantId),
    index('idx_gamers_zone_category').on(table.category),
    unique('uniq_gamers_zone_variant_id').on(table.variantId), // Prevent duplicate gamers zone entries
  ]
);

export const productReviews = pgTable(
  'product_reviews',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid('product_id')
      .references(() => products.id, { onDelete: 'cascade' })
      .notNull(),
    variantId: uuid('variant_id')
      .references(() => variants.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    rating: numeric('rating', { precision: 2, scale: 1 }).notNull(),
    reviewText: text('review_text'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_review_product_id').on(table.productId),
    index('idx_review_variant_id').on(table.variantId),
    index('idx_review_user_id').on(table.userId),
  ]
);