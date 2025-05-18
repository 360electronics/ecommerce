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
  boolean,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from '../user/users.schema';

// Products table
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: varchar('image_url', { length: 500 }),
    isActive: boolean('is_active').default(true).notNull(),
    displayOrder: numeric('display_order', { precision: 5, scale: 0 }).default('0').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uniq_category_slug').on(table.slug),
    index('idx_category_name').on(table.name),
  ]
);

// Subcategories table - for more specific product types
export const subcategories = pgTable(
  'subcategories',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    imageUrl: varchar('image_url', { length: 500 }),
    isActive: boolean('is_active').default(true).notNull(),
    displayOrder: numeric('display_order', { precision: 5, scale: 0 }).default('0').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uniq_subcategory_slug').on(table.slug),
    index('idx_subcategory_name').on(table.name),
    index('idx_subcategory_category').on(table.categoryId),
  ]
);

// Brands table - for product manufacturers
export const brands = pgTable(
  'brands',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    logoUrl: varchar('logo_url', { length: 500 }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('uniq_brand_slug').on(table.slug),
    index('idx_brand_name').on(table.name),
  ]
);

// Attribute templates for different product types
export const attributeTemplates = pgTable(
  'attribute_templates',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    categoryId: uuid('category_id').references(() => categories.id),
    subcategoryId: uuid('subcategory_id').references(() => subcategories.id),
    name: varchar('name', { length: 255 }).notNull(),
    attributes: jsonb('attributes').$type<{
      name: string;
      type: 'text' | 'number' | 'boolean' | 'select';
      options?: string[];
      unit?: string;
      isFilterable: boolean;
      isRequired: boolean;
      displayOrder: number;
    }[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_attribute_template_category').on(table.categoryId),
    index('idx_attribute_template_subcategory').on(table.subcategoryId),
  ]
);

// Enhanced products table
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    shortName: varchar('short_name', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 500 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    categoryId: uuid('category_id').notNull().references(() => categories.id),
    subcategoryId: uuid('subcategory_id').references(() => subcategories.id),
    brandId: uuid('brand_id').notNull().references(() => brands.id),
    status: varchar('status', {
      enum: ['active', 'inactive', 'coming_soon', 'discontinued'],
    }).notNull().default('active'),
    isFeatured: boolean('is_featured').default(false).notNull(),
    totalStocks: numeric('total_stocks', { precision: 10, scale: 0 }).notNull().default('0'),
    deliveryMode: varchar('delivery_mode', {
      enum: ['standard', 'express', 'same_day', 'pickup'],
    }).notNull().default('standard'),
    tags: jsonb('tags').$type<string[]>().default([]),
    attributes: jsonb('attributes').$type<Record<string, string | number | boolean>>().default({}),
    specifications: jsonb('specifications').$type<{
      groupName: string;
      fields: { fieldName: string; fieldValue: string }[];
    }[]>().default([]),
    warranty: varchar('warranty', { length: 100 }),
    averageRating: numeric('average_rating', { precision: 2, scale: 1 }).default('0.0').notNull(),
    ratingCount: numeric('rating_count', { precision: 10, scale: 0 }).default('0').notNull(),
    metaTitle: varchar('meta_title', { length: 255 }),
    metaDescription: text('meta_description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_product_category').on(table.categoryId),
    index('idx_product_subcategory').on(table.subcategoryId),
    index('idx_product_brand').on(table.brandId),
    unique('uniq_product_slug').on(table.slug),
    index('idx_product_status').on(table.status),
    index('idx_product_featured').on(table.isFeatured),
  ]
);

// Enhanced variants table
export const variants = pgTable(
  'variants',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    attributes: jsonb('attributes').$type<Record<string, string | number | boolean>>().default({}),
    stock: numeric('stock', { precision: 10, scale: 0 }).notNull().default('0'),
    lowStockThreshold: numeric('low_stock_threshold', { precision: 10, scale: 0 }).default('5'),
    isBackorderable: boolean('is_backorderable').default(false).notNull(),
    mrp: numeric('mrp', { precision: 10, scale: 2 }).notNull(),
    ourPrice: numeric('our_price', { precision: 10, scale: 2 }).notNull(),
    salePrice: numeric('sale_price', { precision: 10, scale: 2 }),
    isOnSale: boolean('is_on_sale').default(false).notNull(),
    productImages: jsonb('product_images').$type<{
      url: string;
      alt: string;
      isFeatured: boolean;
      displayOrder: number;
    }[]>().default([]),
    weight: numeric('weight', { precision: 10, scale: 2 }),
    weightUnit: varchar('weight_unit', { length: 10 }).default('kg'),
    dimensions: jsonb('dimensions').$type<{
      length: number;
      width: number;
      height: number;
      unit: string;
    }>(),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_variant_product_id').on(table.productId),
    index('idx_variant_sku').on(table.sku),
    unique('uniq_variant_sku').on(table.sku),
    index('idx_variant_slug').on(table.slug),
    unique('uniq_variant_slug').on(table.slug),
  ]
);

// Related products
export const relatedProducts = pgTable(
  'related_products',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    relatedProductId: uuid('related_product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    relationType: varchar('relation_type', {
      enum: ['similar', 'accessory', 'replacement', 'bundle', 'upsell'],
    }).notNull().default('similar'),
    displayOrder: numeric('display_order', { precision: 5, scale: 0 }).default('0').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_related_product_id').on(table.productId),
    index('idx_related_to_product_id').on(table.relatedProductId),
    unique('uniq_product_relation').on(table.productId, table.relatedProductId, table.relationType),
  ]
);

// Compatibility relationships between products
export const productCompatibility = pgTable(
  'product_compatibility',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    compatibleWithId: uuid('compatible_with_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    compatibilityNote: text('compatibility_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_compatibility_product_id').on(table.productId),
    index('idx_compatibility_with_id').on(table.compatibleWithId),
    unique('uniq_product_compatibility').on(table.productId, table.compatibleWithId),
  ]
);

// Product reviews
export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => variants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    rating: numeric('rating', { precision: 2, scale: 1 }).notNull(),
    title: varchar('title', { length: 255 }),
    comment: text('comment'),
    isVerifiedPurchase: boolean('is_verified_purchase').default(false).notNull(),
    isApproved: boolean('is_approved').default(false).notNull(),
    helpfulVotes: numeric('helpful_votes', { precision: 10, scale: 0 }).default('0').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_review_product_id').on(table.productId),
    index('idx_review_variant_id').on(table.variantId),
    index('idx_review_user_id').on(table.userId),
  ]
);

// Product filters configuration
export const filterConfigs = pgTable(
  'filter_configs',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    categoryId: uuid('category_id').references(() => categories.id),
    subcategoryId: uuid('subcategory_id').references(() => subcategories.id),
    filters: jsonb('filters').$type<{
      attributeName: string;
      displayName: string;
      filterType: 'range' | 'select' | 'checkbox' | 'radio';
      options?: string[];
      rangeMin?: number;
      rangeMax?: number;
      unit?: string;
      displayOrder: number;
    }[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_filter_category').on(table.categoryId),
    index('idx_filter_subcategory').on(table.subcategoryId),
  ]
);

// Special offers and discounts
export const promotions = pgTable(
  'promotions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    promoType: varchar('promo_type', {
      enum: ['percentage', 'fixed_amount', 'buy_x_get_y', 'bundle'],
    }).notNull(),
    value: numeric('value', { precision: 10, scale: 2 }).notNull(),
    code: varchar('code', { length: 50 }),
    minPurchase: numeric('min_purchase', { precision: 10, scale: 2 }),
    maxDiscount: numeric('max_discount', { precision: 10, scale: 2 }),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    usageLimit: numeric('usage_limit', { precision: 10, scale: 0 }),
    usageCount: numeric('usage_count', { precision: 10, scale: 0 }).default('0').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_promotion_code').on(table.code),
    index('idx_promotion_active').on(table.isActive),
  ]
);

// Junction table for promotions and products/categories
export const promotionRules = pgTable(
  'promotion_rules',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    promotionId: uuid('promotion_id').notNull().references(() => promotions.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', {
      enum: ['product', 'variant', 'category', 'subcategory', 'brand'],
    }).notNull(),
    entityId: uuid('entity_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_promotion_rule_promotion').on(table.promotionId),
    index('idx_promotion_rule_entity').on(table.entityType, table.entityId),
  ]
);
export const offerZone = pgTable(
  'offer_zone',
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

