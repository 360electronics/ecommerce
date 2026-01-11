import { relations } from "drizzle-orm/relations";
import { users, savedAddresses, authTokens, otpTokens, categories, attributeTemplates, products, gamersZone, variants, newArrivals, offerZone, subcategories, relatedProducts, reviews, wishlists, referrals, tickets, ticketReplies, cart, cartOfferProducts, coupons, specialCouponUsage, specialCoupons, brands, orders, checkoutSessions, checkout, orderItems } from "./schema";

export const savedAddressesRelations = relations(savedAddresses, ({one, many}) => ({
	user: one(users, {
		fields: [savedAddresses.userId],
		references: [users.id]
	}),
	orders: many(orders),
}));

export const usersRelations = relations(users, ({many}) => ({
	savedAddresses: many(savedAddresses),
	authTokens: many(authTokens),
	otpTokens: many(otpTokens),
	reviews: many(reviews),
	wishlists: many(wishlists),
	referrals_userId: many(referrals, {
		relationName: "referrals_userId_users_id"
	}),
	referrals_referrerId: many(referrals, {
		relationName: "referrals_referrerId_users_id"
	}),
	tickets: many(tickets),
	carts: many(cart),
	coupons: many(coupons),
	specialCouponUsages: many(specialCouponUsage),
	orders: many(orders),
	checkouts: many(checkout),
	checkoutSessions: many(checkoutSessions),
}));

export const authTokensRelations = relations(authTokens, ({one}) => ({
	user: one(users, {
		fields: [authTokens.userId],
		references: [users.id]
	}),
}));

export const otpTokensRelations = relations(otpTokens, ({one}) => ({
	user: one(users, {
		fields: [otpTokens.userId],
		references: [users.id]
	}),
}));

export const attributeTemplatesRelations = relations(attributeTemplates, ({one}) => ({
	category: one(categories, {
		fields: [attributeTemplates.categoryId],
		references: [categories.id]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	attributeTemplates: many(attributeTemplates),
	subcategories: many(subcategories),
	products: many(products),
}));

export const gamersZoneRelations = relations(gamersZone, ({one}) => ({
	product: one(products, {
		fields: [gamersZone.productId],
		references: [products.id]
	}),
	variant: one(variants, {
		fields: [gamersZone.variantId],
		references: [variants.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	gamersZones: many(gamersZone),
	variants: many(variants),
	newArrivals: many(newArrivals),
	offerZones: many(offerZone),
	relatedProducts_productId: many(relatedProducts, {
		relationName: "relatedProducts_productId_products_id"
	}),
	relatedProducts_relatedProductId: many(relatedProducts, {
		relationName: "relatedProducts_relatedProductId_products_id"
	}),
	reviews: many(reviews),
	wishlists: many(wishlists),
	carts: many(cart),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	subcategory: one(subcategories, {
		fields: [products.subcategoryId],
		references: [subcategories.id]
	}),
	brand: one(brands, {
		fields: [products.brandId],
		references: [brands.id]
	}),
	checkouts: many(checkout),
	orderItems: many(orderItems),
}));

export const variantsRelations = relations(variants, ({one, many}) => ({
	gamersZones: many(gamersZone),
	product: one(products, {
		fields: [variants.productId],
		references: [products.id]
	}),
	newArrivals: many(newArrivals),
	offerZones: many(offerZone),
	reviews: many(reviews),
	wishlists: many(wishlists),
	carts: many(cart),
	checkouts: many(checkout),
	orderItems: many(orderItems),
}));

export const newArrivalsRelations = relations(newArrivals, ({one}) => ({
	product: one(products, {
		fields: [newArrivals.productId],
		references: [products.id]
	}),
	variant: one(variants, {
		fields: [newArrivals.variantId],
		references: [variants.id]
	}),
}));

export const offerZoneRelations = relations(offerZone, ({one}) => ({
	product: one(products, {
		fields: [offerZone.productId],
		references: [products.id]
	}),
	variant: one(variants, {
		fields: [offerZone.variantId],
		references: [variants.id]
	}),
}));

export const subcategoriesRelations = relations(subcategories, ({one, many}) => ({
	category: one(categories, {
		fields: [subcategories.categoryId],
		references: [categories.id]
	}),
	products: many(products),
}));

export const relatedProductsRelations = relations(relatedProducts, ({one}) => ({
	product_productId: one(products, {
		fields: [relatedProducts.productId],
		references: [products.id],
		relationName: "relatedProducts_productId_products_id"
	}),
	product_relatedProductId: one(products, {
		fields: [relatedProducts.relatedProductId],
		references: [products.id],
		relationName: "relatedProducts_relatedProductId_products_id"
	}),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	product: one(products, {
		fields: [reviews.productId],
		references: [products.id]
	}),
	variant: one(variants, {
		fields: [reviews.variantId],
		references: [variants.id]
	}),
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
}));

export const wishlistsRelations = relations(wishlists, ({one}) => ({
	user: one(users, {
		fields: [wishlists.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [wishlists.productId],
		references: [products.id]
	}),
	variant: one(variants, {
		fields: [wishlists.variantId],
		references: [variants.id]
	}),
}));

export const referralsRelations = relations(referrals, ({one, many}) => ({
	user_userId: one(users, {
		fields: [referrals.userId],
		references: [users.id],
		relationName: "referrals_userId_users_id"
	}),
	user_referrerId: one(users, {
		fields: [referrals.referrerId],
		references: [users.id],
		relationName: "referrals_referrerId_users_id"
	}),
	coupons: many(coupons),
}));

export const ticketsRelations = relations(tickets, ({one, many}) => ({
	user: one(users, {
		fields: [tickets.userId],
		references: [users.id]
	}),
	ticketReplies: many(ticketReplies),
}));

export const ticketRepliesRelations = relations(ticketReplies, ({one}) => ({
	ticket: one(tickets, {
		fields: [ticketReplies.ticketId],
		references: [tickets.id]
	}),
}));

export const cartRelations = relations(cart, ({one}) => ({
	user: one(users, {
		fields: [cart.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [cart.productId],
		references: [products.id]
	}),
	variant: one(variants, {
		fields: [cart.variantId],
		references: [variants.id]
	}),
	cartOfferProduct: one(cartOfferProducts, {
		fields: [cart.cartOfferProductId],
		references: [cartOfferProducts.id]
	}),
}));

export const cartOfferProductsRelations = relations(cartOfferProducts, ({many}) => ({
	carts: many(cart),
	checkouts: many(checkout),
	orderItems: many(orderItems),
}));

export const couponsRelations = relations(coupons, ({one}) => ({
	user: one(users, {
		fields: [coupons.userId],
		references: [users.id]
	}),
	referral: one(referrals, {
		fields: [coupons.referralId],
		references: [referrals.id]
	}),
}));

export const specialCouponUsageRelations = relations(specialCouponUsage, ({one}) => ({
	user: one(users, {
		fields: [specialCouponUsage.userId],
		references: [users.id]
	}),
	specialCoupon: one(specialCoupons, {
		fields: [specialCouponUsage.couponId],
		references: [specialCoupons.id]
	}),
}));

export const specialCouponsRelations = relations(specialCoupons, ({many}) => ({
	specialCouponUsages: many(specialCouponUsage),
}));

export const brandsRelations = relations(brands, ({many}) => ({
	products: many(products),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	savedAddress: one(savedAddresses, {
		fields: [orders.addressId],
		references: [savedAddresses.id]
	}),
	checkoutSession: one(checkoutSessions, {
		fields: [orders.checkoutSessionId],
		references: [checkoutSessions.id]
	}),
	orderItems: many(orderItems),
}));

export const checkoutSessionsRelations = relations(checkoutSessions, ({one, many}) => ({
	orders: many(orders),
	checkouts: many(checkout),
	user: one(users, {
		fields: [checkoutSessions.userId],
		references: [users.id]
	}),
}));

export const checkoutRelations = relations(checkout, ({one}) => ({
	user: one(users, {
		fields: [checkout.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [checkout.productId],
		references: [products.id]
	}),
	variant: one(variants, {
		fields: [checkout.variantId],
		references: [variants.id]
	}),
	cartOfferProduct: one(cartOfferProducts, {
		fields: [checkout.cartOfferProductId],
		references: [cartOfferProducts.id]
	}),
	checkoutSession: one(checkoutSessions, {
		fields: [checkout.checkoutSessionId],
		references: [checkoutSessions.id]
	}),
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
	variant: one(variants, {
		fields: [orderItems.variantId],
		references: [variants.id]
	}),
	cartOfferProduct: one(cartOfferProducts, {
		fields: [orderItems.cartOfferProductId],
		references: [cartOfferProducts.id]
	}),
}));