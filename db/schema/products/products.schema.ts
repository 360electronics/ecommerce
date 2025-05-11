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

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 255 }).notNull(),
    brand: varchar('brand', { length: 255 }).notNull(),
    color: varchar('color', { length: 255 }),
    mrp: numeric('mrp', { precision: 10, scale: 2 }).notNull(),
    ourPrice: numeric('our_price', { precision: 10, scale: 2 }),
    storage: varchar('storage'),
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
    productImages: jsonb('product_images').$type<string[]>().notNull().default([]),
    sku: varchar('sku', { length: 100 }).notNull(),
    weight: varchar('weight', { length: 100 }),
    dimensions: varchar('dimensions', { length: 100 }),
    material: varchar('material', { length: 100 }),
    tags: varchar('tags',{ length: 255 }).notNull(),
    averageRating: numeric('average_rating', { precision: 2, scale: 1 }).default('0.0').notNull(),
    ratingCount: numeric('rating_count', { precision: 10, scale: 0 }).default('0').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_product_sku').on(table.sku),
    index('idx_product_slug').on(table.slug),
    unique('uniq_product_sku').on(table.sku),
  ]
);

export const productSpecGroups = pgTable(
  'product_spec_groups',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    groupName: varchar('group_name', { length: 255 }).notNull(),
  },
  (table) => [
    unique('uniq_group_name').on(table.groupName),
  ]
);

export const productGroupMappings = pgTable(
  'product_group_mappings',
  {
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    groupId: uuid('group_id').references(() => productSpecGroups.id, { onDelete: 'cascade' }).notNull(),
  },
  (table) => [
    unique('uniq_product_group').on(table.productId, table.groupId),
    index('idx_product_group_product_id').on(table.productId),
    index('idx_product_group_group_id').on(table.groupId),
  ]
);

export const productSpecFields = pgTable('product_spec_fields', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  groupId: uuid('group_id').references(() => productSpecGroups.id, { onDelete: 'cascade' }).notNull(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  fieldName: varchar('field_name', { length: 255 }).notNull(),
  fieldValue: text('field_value').notNull(),
});

export const featuredProducts = pgTable('featured_products', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
  (table) => [
    index('idx_featured_product_id').on(table.productId),
  ]
);

export const newArrivals = pgTable('new_arrivals', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
  (table) => [
    index('idx_new_arrivals_products_id').on(table.productId),
  ]
);



export const gamersZone = pgTable('gamers_zone', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),

  productId: uuid('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),

  category: text('category').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
},
  (table) => [
    index('idx_gamers_zone_product_id').on(table.productId),
    index('idx_gamers_zone_category').on(table.category),
  ]
);


export const productReviews = pgTable('product_reviews', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  rating: numeric('rating', { precision: 2, scale: 1 }).notNull(),
  reviewText: text('review_text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
},
  (table) => [
    index('idx_review_product_id').on(table.productId),
  ]
);
