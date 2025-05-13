ALTER TABLE "products" DROP CONSTRAINT "uniq_product_slug";--> statement-breakpoint
DROP INDEX "idx_product_slug";--> statement-breakpoint
ALTER TABLE "variants" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_variant_slug" ON "variants" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "uniq_variant_slug" UNIQUE("slug");