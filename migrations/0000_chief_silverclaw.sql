CREATE TABLE "saved_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"country" varchar(100) NOT NULL,
	"address_type" varchar DEFAULT 'home' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image" varchar(255),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"email" varchar(255),
	"phone_number" varchar(20),
	"email_verified" boolean DEFAULT false,
	"phone_verified" boolean DEFAULT false,
	"role" varchar DEFAULT 'user' NOT NULL,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(6) NOT NULL,
	"type" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attribute_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"subcategory_id" uuid,
	"name" varchar(255) NOT NULL,
	"attributes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"logo_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_brand_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" numeric(5, 0) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_category_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "filter_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"subcategory_id" uuid,
	"filters" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gamers_zone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"category" varchar(255) DEFAULT 'laptops' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_gamers_zone_variant_id" UNIQUE("variant_id")
);
--> statement-breakpoint
CREATE TABLE "new_arrivals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_new_arrivals_variant_id" UNIQUE("variant_id")
);
--> statement-breakpoint
CREATE TABLE "offer_zone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_featured_variant_id" UNIQUE("variant_id")
);
--> statement-breakpoint
CREATE TABLE "product_compatibility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"compatible_with_id" uuid NOT NULL,
	"compatibility_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_product_compatibility" UNIQUE("product_id","compatible_with_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"short_name" varchar(255) NOT NULL,
	"full_name" varchar(500) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"category_id" uuid NOT NULL,
	"subcategory_id" uuid,
	"brand_id" uuid NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"total_stocks" numeric(10, 0) DEFAULT '0' NOT NULL,
	"delivery_mode" varchar DEFAULT 'standard' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"specifications" jsonb DEFAULT '[]'::jsonb,
	"warranty" varchar(100),
	"average_rating" numeric(2, 1) DEFAULT '0.0' NOT NULL,
	"rating_count" numeric(10, 0) DEFAULT '0' NOT NULL,
	"meta_title" varchar(255),
	"meta_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_product_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "promotion_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promotion_id" uuid NOT NULL,
	"entity_type" varchar NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"promo_type" varchar NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"code" varchar(50),
	"min_purchase" numeric(10, 2),
	"max_discount" numeric(10, 2),
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_limit" numeric(10, 0),
	"usage_count" numeric(10, 0) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "related_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"related_product_id" uuid NOT NULL,
	"relation_type" varchar DEFAULT 'similar' NOT NULL,
	"display_order" numeric(5, 0) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_product_relation" UNIQUE("product_id","related_product_id","relation_type")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid,
	"user_id" uuid NOT NULL,
	"rating" numeric(2, 1) NOT NULL,
	"title" varchar(255),
	"comment" text,
	"is_verified_purchase" boolean DEFAULT false NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"helpful_votes" numeric(10, 0) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subcategories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" numeric(5, 0) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_subcategory_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"sku" varchar(100) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb,
	"stock" numeric(10, 0) DEFAULT '0' NOT NULL,
	"low_stock_threshold" numeric(10, 0) DEFAULT '5',
	"is_backorderable" boolean DEFAULT false NOT NULL,
	"mrp" numeric(10, 2) NOT NULL,
	"our_price" numeric(10, 2) NOT NULL,
	"sale_price" numeric(10, 2),
	"is_on_sale" boolean DEFAULT false NOT NULL,
	"product_images" jsonb DEFAULT '[]'::jsonb,
	"weight" numeric(10, 2),
	"weight_unit" varchar(10) DEFAULT 'kg',
	"dimensions" jsonb,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_variant_sku" UNIQUE("sku"),
	CONSTRAINT "uniq_variant_slug" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"imageUrl" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"start_date" date,
	"end_date" date,
	"status" varchar DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"address_id" uuid NOT NULL,
	"coupon_id" uuid,
	"coupon_code" varchar(50),
	"razorpay_order_id" varchar(255),
	"razorpay_payment_id" varchar(255),
	"status" varchar DEFAULT 'pending' NOT NULL,
	"payment_status" varchar DEFAULT 'pending' NOT NULL,
	"payment_method" varchar NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"shipping_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"delivery_mode" varchar DEFAULT 'standard' NOT NULL,
	"order_notes" varchar(1000),
	"tracking_number" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivered_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"referral_code" varchar(10) NOT NULL,
	"referrer_id" uuid,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "ticket_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sender" varchar NOT NULL,
	"message" varchar(2000) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"issue_desc" varchar NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_product_variant" UNIQUE("user_id","product_id","variant_id")
);
--> statement-breakpoint
CREATE TABLE "cart_offer_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"product_id" varchar NOT NULL,
	"range" varchar NOT NULL,
	"our_price" numeric(10, 2) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkout" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"total_price" numeric NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkout_unique_user_product_variant" UNIQUE("user_id","product_id","variant_id")
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"referral_id" uuid,
	"code" varchar(10) NOT NULL,
	"amount" numeric NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "special_coupon_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"coupon_id" uuid NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_coupon" UNIQUE("user_id","coupon_id")
);
--> statement-breakpoint
CREATE TABLE "special_coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"amount" numeric,
	"percentage" numeric,
	"limit" numeric NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "special_coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "saved_addresses" ADD CONSTRAINT "saved_addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_tokens" ADD CONSTRAINT "otp_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribute_templates" ADD CONSTRAINT "attribute_templates_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribute_templates" ADD CONSTRAINT "attribute_templates_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_configs" ADD CONSTRAINT "filter_configs_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "filter_configs" ADD CONSTRAINT "filter_configs_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamers_zone" ADD CONSTRAINT "gamers_zone_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamers_zone" ADD CONSTRAINT "gamers_zone_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "new_arrivals" ADD CONSTRAINT "new_arrivals_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "new_arrivals" ADD CONSTRAINT "new_arrivals_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_zone" ADD CONSTRAINT "offer_zone_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_zone" ADD CONSTRAINT "offer_zone_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_compatibility" ADD CONSTRAINT "product_compatibility_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_compatibility" ADD CONSTRAINT "product_compatibility_compatible_with_id_products_id_fk" FOREIGN KEY ("compatible_with_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_products" ADD CONSTRAINT "related_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "related_products" ADD CONSTRAINT "related_products_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_address_id_saved_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."saved_addresses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_replies" ADD CONSTRAINT "ticket_replies_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_coupon_usage" ADD CONSTRAINT "special_coupon_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_coupon_usage" ADD CONSTRAINT "special_coupon_usage_coupon_id_special_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."special_coupons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_attribute_template_category" ON "attribute_templates" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_attribute_template_subcategory" ON "attribute_templates" USING btree ("subcategory_id");--> statement-breakpoint
CREATE INDEX "idx_brand_name" ON "brands" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_category_name" ON "categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_filter_category" ON "filter_configs" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_filter_subcategory" ON "filter_configs" USING btree ("subcategory_id");--> statement-breakpoint
CREATE INDEX "idx_gamers_zone_product_id" ON "gamers_zone" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_gamers_zone_variant_id" ON "gamers_zone" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_gamers_zone_category" ON "gamers_zone" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_new_arrivals_product_id" ON "new_arrivals" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_new_arrivals_variant_id" ON "new_arrivals" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_featured_product_id" ON "offer_zone" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_featured_variant_id" ON "offer_zone" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_compatibility_product_id" ON "product_compatibility" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_compatibility_with_id" ON "product_compatibility" USING btree ("compatible_with_id");--> statement-breakpoint
CREATE INDEX "idx_product_category" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_product_subcategory" ON "products" USING btree ("subcategory_id");--> statement-breakpoint
CREATE INDEX "idx_product_brand" ON "products" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_product_status" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_product_featured" ON "products" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "idx_promotion_rule_promotion" ON "promotion_rules" USING btree ("promotion_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_rule_entity" ON "promotion_rules" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_promotion_code" ON "promotions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_promotion_active" ON "promotions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_related_product_id" ON "related_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_related_to_product_id" ON "related_products" USING btree ("related_product_id");--> statement-breakpoint
CREATE INDEX "idx_review_product_id" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_review_variant_id" ON "reviews" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_review_user_id" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_subcategory_name" ON "subcategories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_subcategory_category" ON "subcategories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_variant_product_id" ON "variants" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_variant_sku" ON "variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_variant_slug" ON "variants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_order_items_order_id" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_product_id" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_order_items_variant_id" ON "order_items" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_orders_user_id" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_razorpay_order_id" ON "orders" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE INDEX "idx_orders_address_id" ON "orders" USING btree ("address_id");--> statement-breakpoint
CREATE INDEX "idx_orders_user_status" ON "orders" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_orders_coupon_id" ON "orders" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "idx_cart_user_id" ON "cart" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cart_product_id" ON "cart" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_cart_variant_id" ON "cart" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_checkout_user_id" ON "checkout" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_checkout_product_id" ON "checkout" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_checkout_variant_id" ON "checkout" USING btree ("variant_id");