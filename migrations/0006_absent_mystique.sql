ALTER TABLE "order_items" RENAME COLUMN "price" TO "variant_id";--> statement-breakpoint
ALTER TABLE "cart" DROP CONSTRAINT "unique_user_variant";--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cart" ALTER COLUMN "variant_id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "cart" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cart" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "unit_price" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_mode" varchar DEFAULT 'standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_notes" varchar(1000);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tracking_number" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_product_id" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_variant_id" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_razorpay_order_id" ON "orders" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_address_id" ON "orders" USING btree ("address_id");--> statement-breakpoint
CREATE INDEX "idx_cart_user_id" ON "cart" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cart_product_id" ON "cart" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_cart_variant_id" ON "cart" USING btree ("variant_id");--> statement-breakpoint
ALTER TABLE "cart" DROP COLUMN "selected_color";--> statement-breakpoint
ALTER TABLE "cart" DROP COLUMN "selected_storage";--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "unique_user_product_variant" UNIQUE("user_id","product_id","variant_id");