import { relations } from "drizzle-orm/relations";
import { users, authTokens, otpTokens, products, gamersZone, productGroupMappings, productSpecGroups, orders, orderItems, featuredProducts, newArrivals, productReviews, productSpecFields } from "./schema";

export const authTokensRelations = relations(authTokens, ({one}) => ({
	user: one(users, {
		fields: [authTokens.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	authTokens: many(authTokens),
	otpTokens: many(otpTokens),
	orders: many(orders),
	productReviews: many(productReviews),
}));

export const otpTokensRelations = relations(otpTokens, ({one}) => ({
	user: one(users, {
		fields: [otpTokens.userId],
		references: [users.id]
	}),
}));

export const gamersZoneRelations = relations(gamersZone, ({one}) => ({
	product: one(products, {
		fields: [gamersZone.productId],
		references: [products.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	gamersZones: many(gamersZone),
	productGroupMappings: many(productGroupMappings),
	orderItems: many(orderItems),
	featuredProducts: many(featuredProducts),
	newArrivals: many(newArrivals),
	productReviews: many(productReviews),
	productSpecFields: many(productSpecFields),
}));

export const productGroupMappingsRelations = relations(productGroupMappings, ({one}) => ({
	product: one(products, {
		fields: [productGroupMappings.productId],
		references: [products.id]
	}),
	productSpecGroup: one(productSpecGroups, {
		fields: [productGroupMappings.groupId],
		references: [productSpecGroups.id]
	}),
}));

export const productSpecGroupsRelations = relations(productSpecGroups, ({many}) => ({
	productGroupMappings: many(productGroupMappings),
	productSpecFields: many(productSpecFields),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
}));

export const featuredProductsRelations = relations(featuredProducts, ({one}) => ({
	product: one(products, {
		fields: [featuredProducts.productId],
		references: [products.id]
	}),
}));

export const newArrivalsRelations = relations(newArrivals, ({one}) => ({
	product: one(products, {
		fields: [newArrivals.productId],
		references: [products.id]
	}),
}));

export const productReviewsRelations = relations(productReviews, ({one}) => ({
	user: one(users, {
		fields: [productReviews.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [productReviews.productId],
		references: [products.id]
	}),
}));

export const productSpecFieldsRelations = relations(productSpecFields, ({one}) => ({
	product: one(products, {
		fields: [productSpecFields.productId],
		references: [products.id]
	}),
	productSpecGroup: one(productSpecGroups, {
		fields: [productSpecFields.groupId],
		references: [productSpecGroups.id]
	}),
}));