CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image" varchar(255),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"email" varchar(255),
	"phone_number" varchar(20),
	"email_verified" boolean DEFAULT false,
	"phone_verified" boolean DEFAULT false,
	"role" varchar DEFAULT 'user',
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"token" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "otp_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"token" varchar(6),
	"type" varchar(10),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "featured_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gamers_zone" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"category" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "new_arrivals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_group_mappings" (
	"product_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	CONSTRAINT "uniq_product_group" UNIQUE("product_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" numeric(2, 1) NOT NULL,
	"review_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_spec_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"field_name" varchar(255) NOT NULL,
	"field_value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_spec_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_name" varchar(255) NOT NULL,
	CONSTRAINT "uniq_group_name" UNIQUE("group_name")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(255) NOT NULL,
	"brand" varchar(255) NOT NULL,
	"color" varchar(255),
	"mrp" numeric(10, 2) NOT NULL,
	"our_price" numeric(10, 2),
	"status" varchar DEFAULT 'active' NOT NULL,
	"sub_product_status" varchar DEFAULT 'active' NOT NULL,
	"total_stocks" numeric(10, 0) DEFAULT '0' NOT NULL,
	"delivery_mode" varchar DEFAULT 'standard' NOT NULL,
	"product_images" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sku" varchar(100) NOT NULL,
	"tags" varchar(255) NOT NULL,
	"average_rating" numeric(2, 1) DEFAULT '0.0' NOT NULL,
	"rating_count" numeric(10, 0) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_product_sku" UNIQUE("sku")
);
--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_tokens" ADD CONSTRAINT "otp_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "featured_products" ADD CONSTRAINT "featured_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamers_zone" ADD CONSTRAINT "gamers_zone_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "new_arrivals" ADD CONSTRAINT "new_arrivals_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_group_mappings" ADD CONSTRAINT "product_group_mappings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_group_mappings" ADD CONSTRAINT "product_group_mappings_group_id_product_spec_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."product_spec_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_spec_fields" ADD CONSTRAINT "product_spec_fields_group_id_product_spec_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."product_spec_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_spec_fields" ADD CONSTRAINT "product_spec_fields_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_featured_product_id" ON "featured_products" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_gamers_zone_product_id" ON "gamers_zone" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_gamers_zone_category" ON "gamers_zone" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_new_arrivals_products_id" ON "new_arrivals" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_group_product_id" ON "product_group_mappings" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_group_group_id" ON "product_group_mappings" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_review_product_id" ON "product_reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_product_sku" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_product_slug" ON "products" USING btree ("slug");