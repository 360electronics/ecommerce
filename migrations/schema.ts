import { pgTable, uuid, text, jsonb, timestamp, foreignKey, varchar, boolean, serial, integer, unique, index, numeric, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const banners = pgTable("banners", {
	id: uuid().primaryKey().notNull(),
	title: text().notNull(),
	type: text().notNull(),
	imageUrls: jsonb("image_urls").notNull(),
	startDate: text("start_date"),
	endDate: text("end_date"),
	status: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const savedAddresses = pgTable("saved_addresses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	fullName: varchar("full_name", { length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	addressLine1: varchar("address_line1", { length: 255 }).notNull(),
	addressLine2: varchar("address_line2", { length: 255 }),
	city: varchar({ length: 100 }).notNull(),
	state: varchar({ length: 100 }).notNull(),
	postalCode: varchar("postal_code", { length: 20 }).notNull(),
	country: varchar({ length: 100 }).notNull(),
	addressType: varchar("address_type").default('home').notNull(),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	gst: varchar({ length: 100 }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "saved_addresses_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const goals = pgTable("goals", {
	id: serial().primaryKey().notNull(),
	amount: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	image: varchar({ length: 255 }),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	email: varchar({ length: 255 }),
	phoneNumber: varchar("phone_number", { length: 20 }),
	emailVerified: boolean("email_verified").default(false),
	phoneVerified: boolean("phone_verified").default(false),
	role: varchar().default('user').notNull(),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_phone_number_unique").on(table.phoneNumber),
]);

export const authTokens = pgTable("auth_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "auth_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const otpTokens = pgTable("otp_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: varchar({ length: 6 }).notNull(),
	type: varchar().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "otp_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	imageUrl: varchar("image_url", { length: 500 }),
	isActive: boolean("is_active").default(true).notNull(),
	displayOrder: numeric("display_order", { precision: 5, scale:  0 }).default('0').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_category_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("uniq_category_slug").on(table.slug),
]);

export const attributeTemplates = pgTable("attribute_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categoryId: uuid("category_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	attributes: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "attribute_templates_category_id_categories_id_fk"
		}).onDelete("cascade"),
]);

export const gamersZone = pgTable("gamers_zone", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id").notNull(),
	category: varchar({ length: 255 }).default('laptops').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_gamers_zone_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_gamers_zone_product_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_gamers_zone_variant_id").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "gamers_zone_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [variants.id],
			name: "gamers_zone_variant_id_variants_id_fk"
		}).onDelete("cascade"),
	unique("uniq_gamers_zone_variant_id").on(table.variantId),
]);

export const variants = pgTable("variants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	sku: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	attributes: jsonb().default({}),
	stock: numeric({ precision: 10, scale:  0 }).default('0').notNull(),
	lowStockThreshold: numeric("low_stock_threshold", { precision: 10, scale:  0 }).default('5'),
	isBackorderable: boolean("is_backorderable").default(false).notNull(),
	mrp: numeric({ precision: 10, scale:  2 }).notNull(),
	ourPrice: numeric("our_price", { precision: 10, scale:  2 }).notNull(),
	salePrice: numeric("sale_price", { precision: 10, scale:  2 }),
	isOnSale: boolean("is_on_sale").default(false).notNull(),
	productImages: jsonb("product_images").default([]),
	weight: numeric({ precision: 10, scale:  2 }),
	weightUnit: varchar("weight_unit", { length: 10 }).default('kg'),
	dimensions: jsonb(),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_variant_product_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_variant_sku").using("btree", table.sku.asc().nullsLast().op("text_ops")),
	index("idx_variant_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "variants_product_id_products_id_fk"
		}).onDelete("cascade"),
	unique("uniq_variant_sku").on(table.sku),
	unique("uniq_variant_slug").on(table.slug),
]);

export const newArrivals = pgTable("new_arrivals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_new_arrivals_product_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_new_arrivals_variant_id").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "new_arrivals_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [variants.id],
			name: "new_arrivals_variant_id_variants_id_fk"
		}).onDelete("cascade"),
	unique("uniq_new_arrivals_variant_id").on(table.variantId),
]);

export const offerZone = pgTable("offer_zone", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_offer_variant_id").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	index("idx_offer_zone_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "offer_zone_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [variants.id],
			name: "offer_zone_variant_id_variants_id_fk"
		}).onDelete("cascade"),
	unique("uniq_offer_variant_id").on(table.variantId),
]);

export const subcategories = pgTable("subcategories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categoryId: uuid("category_id").notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	imageUrl: varchar("image_url", { length: 500 }),
	isActive: boolean("is_active").default(true).notNull(),
	displayOrder: numeric("display_order", { precision: 5, scale:  0 }).default('0').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_subcategory_category").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("idx_subcategory_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "subcategories_category_id_categories_id_fk"
		}).onDelete("cascade"),
	unique("uniq_subcategory_slug").on(table.slug),
]);

export const brands = pgTable("brands", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	logoUrl: varchar("logo_url", { length: 500 }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_brand_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	unique("uniq_brand_slug").on(table.slug),
]);

export const relatedProducts = pgTable("related_products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	relatedProductId: uuid("related_product_id").notNull(),
	relationType: varchar("relation_type").default('similar').notNull(),
	displayOrder: numeric("display_order", { precision: 5, scale:  0 }).default('0').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_related_product_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_related_to_product_id").using("btree", table.relatedProductId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "related_products_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.relatedProductId],
			foreignColumns: [products.id],
			name: "related_products_related_product_id_products_id_fk"
		}).onDelete("cascade"),
	unique("uniq_product_relation").on(table.productId, table.relatedProductId, table.relationType),
]);

export const reviews = pgTable("reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id"),
	userId: uuid("user_id").notNull(),
	rating: numeric({ precision: 2, scale:  1 }).notNull(),
	title: varchar({ length: 255 }),
	comment: text(),
	images: jsonb().default([]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_review_product_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_review_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_review_variant_id").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "reviews_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [variants.id],
			name: "reviews_variant_id_variants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "reviews_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const cartOfferProducts = pgTable("cart_offer_products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	productId: varchar("product_id").notNull(),
	range: varchar().notNull(),
	ourPrice: numeric("our_price", { precision: 10, scale:  2 }).notNull(),
	quantity: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const wishlists = pgTable("wishlists", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "wishlists_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "wishlists_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [variants.id],
			name: "wishlists_variant_id_variants_id_fk"
		}).onDelete("cascade"),
]);

export const referrals = pgTable("referrals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	referralCode: varchar("referral_code", { length: 10 }).notNull(),
	referrerId: uuid("referrer_id"),
	status: varchar().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "referrals_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.referrerId],
			foreignColumns: [users.id],
			name: "referrals_referrer_id_users_id_fk"
		}).onDelete("set null"),
	unique("referrals_referral_code_unique").on(table.referralCode),
]);

export const tickets = pgTable("tickets", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: varchar({ length: 255 }).notNull(),
	issueDesc: varchar("issue_desc").notNull(),
	status: varchar().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "tickets_user_id_users_id_fk"
		}),
]);

export const ticketReplies = pgTable("ticket_replies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	ticketId: uuid("ticket_id").notNull(),
	sender: varchar().notNull(),
	message: varchar({ length: 2000 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.ticketId],
			foreignColumns: [tickets.id],
			name: "ticket_replies_ticket_id_tickets_id_fk"
		}),
]);

export const cart = pgTable("cart", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id").notNull(),
	cartOfferProductId: uuid("cart_offer_product_id"),
	quantity: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_cart_product_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_cart_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_cart_variant_id").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "cart_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "cart_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [variants.id],
			name: "cart_variant_id_variants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.cartOfferProductId],
			foreignColumns: [cartOfferProducts.id],
			name: "cart_cart_offer_product_id_cart_offer_products_id_fk"
		}),
	unique("unique_user_product_variant").on(table.userId, table.productId, table.variantId),
]);

export const coupons = pgTable("coupons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	referralId: uuid("referral_id"),
	code: varchar({ length: 10 }).notNull(),
	amount: numeric().notNull(),
	isUsed: boolean("is_used").default(false).notNull(),
	expiryDate: timestamp("expiry_date", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "coupons_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.referralId],
			foreignColumns: [referrals.id],
			name: "coupons_referral_id_referrals_id_fk"
		}).onDelete("set null"),
	unique("coupons_code_unique").on(table.code),
]);

export const specialCouponUsage = pgTable("special_coupon_usage", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	couponId: uuid("coupon_id").notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "special_coupon_usage_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.couponId],
			foreignColumns: [specialCoupons.id],
			name: "special_coupon_usage_coupon_id_special_coupons_id_fk"
		}).onDelete("cascade"),
	unique("unique_user_coupon").on(table.userId, table.couponId),
]);

export const specialCoupons = pgTable("special_coupons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	code: varchar({ length: 10 }).notNull(),
	amount: numeric(),
	percentage: numeric(),
	limit: numeric().notNull(),
	expiryDate: timestamp("expiry_date", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	minOrderAmount: numeric("min_order_amount").default('0'),
}, (table) => [
	unique("special_coupons_code_unique").on(table.code),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	shortName: varchar("short_name", { length: 255 }).notNull(),
	fullName: varchar("full_name", { length: 500 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	categoryId: uuid("category_id").notNull(),
	subcategoryId: uuid("subcategory_id"),
	brandId: uuid("brand_id").notNull(),
	status: varchar().default('active').notNull(),
	isFeatured: boolean("is_featured").default(false).notNull(),
	totalStocks: numeric("total_stocks", { precision: 10, scale:  0 }).default('0').notNull(),
	deliveryMode: varchar("delivery_mode").default('standard').notNull(),
	tags: jsonb().default([]),
	attributes: jsonb().default({}),
	specifications: jsonb().default([]),
	warranty: varchar({ length: 100 }),
	averageRating: numeric("average_rating", { precision: 2, scale:  1 }).default('0.0').notNull(),
	ratingCount: numeric("rating_count", { precision: 10, scale:  0 }).default('0').notNull(),
	ratingDistribution: jsonb("rating_distribution").default([]),
	metaTitle: varchar("meta_title", { length: 255 }),
	metaDescription: text("meta_description"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// TODO: failed to parse database type 'tsvector'
	searchVector: unknown("search_vector"),
}, (table) => [
	index("idx_product_brand").using("btree", table.brandId.asc().nullsLast().op("uuid_ops")),
	index("idx_product_category").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("idx_product_featured").using("btree", table.isFeatured.asc().nullsLast().op("bool_ops")),
	index("idx_product_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_product_subcategory").using("btree", table.subcategoryId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_categories_id_fk"
		}),
	foreignKey({
			columns: [table.subcategoryId],
			foreignColumns: [subcategories.id],
			name: "products_subcategory_id_subcategories_id_fk"
		}),
	foreignKey({
			columns: [table.brandId],
			foreignColumns: [brands.id],
			name: "products_brand_id_brands_id_fk"
		}),
	unique("uniq_product_slug").on(table.slug),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	addressId: uuid("address_id").notNull(),
	couponId: uuid("coupon_id"),
	couponCode: varchar("coupon_code", { length: 50 }),
	gatewayOrderId: varchar("gateway_order_id", { length: 255 }),
	paymentId: varchar("payment_id", { length: 255 }),
	status: varchar().default('pending').notNull(),
	paymentStatus: varchar("payment_status").default('pending').notNull(),
	paymentMethod: varchar("payment_method").notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	discountAmount: numeric("discount_amount", { precision: 10, scale:  2 }).default('0.00').notNull(),
	shippingAmount: numeric("shipping_amount", { precision: 10, scale:  2 }).default('0.00').notNull(),
	deliveryMode: varchar("delivery_mode").default('standard').notNull(),
	orderNotes: varchar("order_notes", { length: 1000 }),
	trackingNumber: varchar("tracking_number", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deliveredAt: timestamp("delivered_at", { withTimezone: true, mode: 'string' }),
	checkoutSessionId: uuid("checkout_session_id").notNull(),
}, (table) => [
	index("idx_orders_address_id").using("btree", table.addressId.asc().nullsLast().op("uuid_ops")),
	index("idx_orders_coupon_id").using("btree", table.couponId.asc().nullsLast().op("uuid_ops")),
	index("idx_orders_gateway_order_id").using("btree", table.gatewayOrderId.asc().nullsLast().op("text_ops")),
	index("idx_orders_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_orders_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_orders_user_status").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.addressId],
			foreignColumns: [savedAddresses.id],
			name: "orders_address_id_saved_addresses_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.checkoutSessionId],
			foreignColumns: [checkoutSessions.id],
			name: "orders_checkout_session_id_checkout_sessions_id_fk"
		}).onDelete("cascade"),
]);

export const checkout = pgTable("checkout", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id").notNull(),
	cartOfferProductId: uuid("cart_offer_product_id"),
	totalPrice: numeric("total_price").notNull(),
	quantity: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	checkoutSessionId: uuid("checkout_session_id").notNull(),
}, (table) => [
	index("idx_checkout_product_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_checkout_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_checkout_variant_id").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "checkout_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "checkout_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [variants.id],
			name: "checkout_variant_id_variants_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.cartOfferProductId],
			foreignColumns: [cartOfferProducts.id],
			name: "checkout_cart_offer_product_id_cart_offer_products_id_fk"
		}),
	foreignKey({
			columns: [table.checkoutSessionId],
			foreignColumns: [checkoutSessions.id],
			name: "checkout_checkout_session_id_checkout_sessions_id_fk"
		}).onDelete("cascade"),
	unique("uniq_checkout_item").on(table.variantId, table.checkoutSessionId),
]);

export const stores = pgTable("stores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	address: text(),
	city: text(),
	state: text(),
	pincode: text(),
	phone: text(),
	email: text(),
	lat: doublePrecision(),
	lng: doublePrecision(),
	tags: jsonb(),
	openingHours: jsonb("opening_hours"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	productId: uuid("product_id").notNull(),
	variantId: uuid("variant_id").notNull(),
	cartOfferProductId: uuid("cart_offer_product_id"),
	quantity: integer().notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
}, (table) => [
	index("idx_order_items_order_id").using("btree", table.orderId.asc().nullsLast().op("uuid_ops")),
	index("idx_order_items_product_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_order_items_variant_id").using("btree", table.variantId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.variantId],
			foreignColumns: [variants.id],
			name: "order_items_variant_id_variants_id_fk"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.cartOfferProductId],
			foreignColumns: [cartOfferProducts.id],
			name: "order_items_cart_offer_product_id_cart_offer_products_id_fk"
		}),
]);

export const checkoutSessions = pgTable("checkout_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	status: varchar().default('active').notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	lockedAt: timestamp("locked_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_checkout_session_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "checkout_sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("uniq_active_session").on(table.userId, table.status),
]);
