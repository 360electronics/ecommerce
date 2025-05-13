ALTER TABLE "product_group_mappings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_spec_fields" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_spec_groups" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "product_group_mappings" CASCADE;--> statement-breakpoint
DROP TABLE "product_spec_fields" CASCADE;--> statement-breakpoint
DROP TABLE "product_spec_groups" CASCADE;--> statement-breakpoint
DROP INDEX "idx_new_arrivals_products_id";--> statement-breakpoint
ALTER TABLE "gamers_zone" ALTER COLUMN "category" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "gamers_zone" ALTER COLUMN "category" SET DEFAULT 'laptops';--> statement-breakpoint
ALTER TABLE "featured_products" ADD COLUMN "variant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "gamers_zone" ADD COLUMN "variant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "new_arrivals" ADD COLUMN "variant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD COLUMN "variant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "featured_products" ADD CONSTRAINT "featured_products_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gamers_zone" ADD CONSTRAINT "gamers_zone_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "new_arrivals" ADD CONSTRAINT "new_arrivals_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_variant_id_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_featured_variant_id" ON "featured_products" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_gamers_zone_variant_id" ON "gamers_zone" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_new_arrivals_product_id" ON "new_arrivals" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_new_arrivals_variant_id" ON "new_arrivals" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_review_variant_id" ON "product_reviews" USING btree ("variant_id");--> statement-breakpoint
CREATE INDEX "idx_review_user_id" ON "product_reviews" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "featured_products" ADD CONSTRAINT "uniq_featured_variant_id" UNIQUE("variant_id");--> statement-breakpoint
ALTER TABLE "gamers_zone" ADD CONSTRAINT "uniq_gamers_zone_variant_id" UNIQUE("variant_id");--> statement-breakpoint
ALTER TABLE "new_arrivals" ADD CONSTRAINT "uniq_new_arrivals_variant_id" UNIQUE("variant_id");