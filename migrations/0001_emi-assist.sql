CREATE TABLE "emi_assist_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(15) NOT NULL,
	"email" varchar(150),
	"pan" varchar(20),
	"product_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"bank_preference" varchar(50),
	"status" varchar(30) DEFAULT 'pending',
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "checkout" DROP CONSTRAINT "uniq_checkout_item";--> statement-breakpoint
ALTER TABLE "checkout_sessions" DROP CONSTRAINT "uniq_active_session";--> statement-breakpoint
DROP INDEX "idx_category_name";--> statement-breakpoint
DROP INDEX "idx_gamers_zone_category";--> statement-breakpoint
DROP INDEX "idx_gamers_zone_product_id";--> statement-breakpoint
DROP INDEX "idx_gamers_zone_variant_id";--> statement-breakpoint
DROP INDEX "idx_variant_product_id";--> statement-breakpoint
DROP INDEX "idx_variant_sku";--> statement-breakpoint
DROP INDEX "idx_variant_slug";--> statement-breakpoint
DROP INDEX "idx_new_arrivals_product_id";--> statement-breakpoint
DROP INDEX "idx_new_arrivals_variant_id";--> statement-breakpoint
DROP INDEX "idx_offer_variant_id";--> statement-breakpoint
DROP INDEX "idx_offer_zone_id";--> statement-breakpoint
DROP INDEX "idx_subcategory_category";--> statement-breakpoint
DROP INDEX "idx_subcategory_name";--> statement-breakpoint
DROP INDEX "idx_brand_name";--> statement-breakpoint
DROP INDEX "idx_related_product_id";--> statement-breakpoint
DROP INDEX "idx_related_to_product_id";--> statement-breakpoint
DROP INDEX "idx_review_product_id";--> statement-breakpoint
DROP INDEX "idx_review_user_id";--> statement-breakpoint
DROP INDEX "idx_review_variant_id";--> statement-breakpoint
DROP INDEX "idx_cart_product_id";--> statement-breakpoint
DROP INDEX "idx_cart_user_id";--> statement-breakpoint
DROP INDEX "idx_cart_variant_id";--> statement-breakpoint
DROP INDEX "idx_product_brand";--> statement-breakpoint
DROP INDEX "idx_product_category";--> statement-breakpoint
DROP INDEX "idx_product_featured";--> statement-breakpoint
DROP INDEX "idx_product_status";--> statement-breakpoint
DROP INDEX "idx_product_subcategory";--> statement-breakpoint
DROP INDEX "idx_orders_address_id";--> statement-breakpoint
DROP INDEX "idx_orders_coupon_id";--> statement-breakpoint
DROP INDEX "idx_orders_gateway_order_id";--> statement-breakpoint
DROP INDEX "idx_orders_status";--> statement-breakpoint
DROP INDEX "idx_orders_user_id";--> statement-breakpoint
DROP INDEX "idx_orders_user_status";--> statement-breakpoint
DROP INDEX "idx_checkout_product_id";--> statement-breakpoint
DROP INDEX "idx_checkout_user_id";--> statement-breakpoint
DROP INDEX "idx_checkout_variant_id";--> statement-breakpoint
DROP INDEX "idx_order_items_order_id";--> statement-breakpoint
DROP INDEX "idx_order_items_product_id";--> statement-breakpoint
DROP INDEX "idx_order_items_variant_id";--> statement-breakpoint
DROP INDEX "idx_checkout_session_user";--> statement-breakpoint
CREATE INDEX "uniq_active_checkout_session" ON "checkout_sessions" USING btree ("user_id") WHERE status = 'active';--> statement-breakpoint
CREATE INDEX "idx_category_name" ON "categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_gamers_zone_category" ON "gamers_zone" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_gamers_zone_product_id" ON "gamers_zone" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_gamers_zone_variant_id" ON "gamers_zone" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_variant_product_id" ON "variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_variant_sku" ON "variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_variant_slug" ON "variants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_new_arrivals_product_id" ON "new_arrivals" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_new_arrivals_variant_id" ON "new_arrivals" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_offer_variant_id" ON "offer_zone" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_offer_zone_id" ON "offer_zone" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_subcategory_category" ON "subcategories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_subcategory_name" ON "subcategories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_brand_name" ON "brands" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_related_product_id" ON "related_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_related_to_product_id" ON "related_products" USING btree ("related_product_id");--> statement-breakpoint
CREATE INDEX "idx_review_product_id" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_review_user_id" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_review_variant_id" ON "reviews" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_cart_product_id" ON "cart" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_cart_user_id" ON "cart" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cart_variant_id" ON "cart" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_product_brand" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_product_category" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_product_featured" ON "products" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "idx_product_status" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_product_subcategory" ON "products" USING btree ("subcategory_id");--> statement-breakpoint
CREATE INDEX "idx_orders_address_id" ON "orders" USING btree ("address_id");--> statement-breakpoint
CREATE INDEX "idx_orders_coupon_id" ON "orders" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "idx_orders_gateway_order_id" ON "orders" USING btree ("gateway_order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_user_status" ON "orders" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_checkout_product_id" ON "checkout" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_checkout_user_id" ON "checkout" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_checkout_variant_id" ON "checkout" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_product_id" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_variant_id" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_checkout_session_user" ON "checkout_sessions" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "checkout" ADD CONSTRAINT "uniq_checkout_item" UNIQUE("checkout_session_id","variant_id");