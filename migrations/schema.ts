import { pgTable, unique, uuid, varchar, boolean, timestamp, foreignKey, text, index, date, numeric, integer, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	image: varchar({ length: 255 }),
	firstName: varchar("first_name", { length: 255 }),
	lastName: varchar("last_name", { length: 255 }),
	email: varchar({ length: 255 }),
	phoneNumber: varchar("phone_number", { length: 20 }),
	emailVerified: boolean("email_verified").default(false),
	phoneVerified: boolean("phone_verified").default(false),
	role: varchar().default('user'),
	lastLogin: timestamp("last_login", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_email_unique").on(table.email),
	unique("users_phone_number_unique").on(table.phoneNumber),
]);

export const authTokens = pgTable("auth_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	token: text(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "auth_tokens_user_id_users_id_fk"
		}),
]);

export const otpTokens = pgTable("otp_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	token: varchar({ length: 6 }),
	type: varchar({ length: 10 }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "otp_tokens_user_id_users_id_fk"
		}),
]);

export const gamersZone = pgTable("gamers_zone", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	category: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_gamers_zone_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_gamers_zone_product_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "gamers_zone_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const productGroupMappings = pgTable("product_group_mappings", {
	productId: uuid("product_id").notNull(),
	groupId: uuid("group_id").notNull(),
}, (table) => [
	index("idx_product_group_group_id").using("btree", table.groupId.asc().nullsLast().op("uuid_ops")),
	index("idx_product_group_product_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_group_mappings_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [productSpecGroups.id],
			name: "product_group_mappings_group_id_product_spec_groups_id_fk"
		}).onDelete("cascade"),
	unique("uniq_product_group").on(table.productId, table.groupId),
]);

export const banners = pgTable("banners", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	imageUrl: varchar({ length: 255 }).notNull(),
	type: varchar({ length: 255 }).notNull(),
	startDate: date("start_date"),
	endDate: date("end_date"),
	status: varchar().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
	razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
	status: varchar().default('pending').notNull(),
	paymentStatus: varchar("payment_status").default('pending').notNull(),
	paymentMethod: varchar("payment_method").default('razorpay').notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	shippingAddress: varchar("shipping_address", { length: 1024 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "orders_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const orderItems = pgTable("order_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orderId: uuid("order_id").notNull(),
	productId: uuid("product_id").notNull(),
	quantity: integer().notNull(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const featuredProducts = pgTable("featured_products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_featured_product_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "featured_products_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const newArrivals = pgTable("new_arrivals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_new_arrivals_products_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "new_arrivals_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const productReviews = pgTable("product_reviews", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id").notNull(),
	userId: uuid("user_id").notNull(),
	rating: numeric({ precision: 2, scale:  1 }).notNull(),
	reviewText: text("review_text"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_review_product_id").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "product_reviews_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_reviews_product_id_products_id_fk"
		}).onDelete("cascade"),
]);

export const productSpecGroups = pgTable("product_spec_groups", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupName: varchar("group_name", { length: 255 }).notNull(),
}, (table) => [
	unique("uniq_group_name").on(table.groupName),
]);

export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 255 }).notNull(),
	mrp: numeric({ precision: 10, scale:  2 }).notNull(),
	ourPrice: numeric("our_price", { precision: 10, scale:  2 }),
	status: varchar().default('active').notNull(),
	subProductStatus: varchar("sub_product_status").default('active').notNull(),
	totalStocks: numeric("total_stocks", { precision: 10, scale:  0 }).default('0').notNull(),
	deliveryMode: varchar("delivery_mode").default('standard').notNull(),
	productImages: jsonb("product_images").default([]).notNull(),
	sku: varchar({ length: 100 }).notNull(),
	averageRating: numeric("average_rating", { precision: 2, scale:  1 }).default('0.0').notNull(),
	ratingCount: numeric("rating_count", { precision: 10, scale:  0 }).default('0').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	brand: varchar({ length: 255 }).notNull(),
	color: varchar({ length: 255 }),
	tags: varchar({ length: 255 }).notNull(),
	storage: varchar(),
	weight: varchar({ length: 100 }),
	dimensions: varchar({ length: 100 }),
	material: varchar({ length: 100 }),
}, (table) => [
	index("idx_product_sku").using("btree", table.sku.asc().nullsLast().op("text_ops")),
	index("idx_product_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	unique("uniq_product_sku").on(table.sku),
]);

export const productSpecFields = pgTable("product_spec_fields", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: uuid("group_id").notNull(),
	fieldName: varchar("field_name", { length: 255 }).notNull(),
	fieldValue: text("field_value").notNull(),
	productId: uuid("product_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "product_spec_fields_product_id_products_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [productSpecGroups.id],
			name: "product_spec_fields_group_id_product_spec_groups_id_fk"
		}).onDelete("cascade"),
]);
