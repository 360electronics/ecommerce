ALTER TABLE "checkout" DROP CONSTRAINT "unique_user_product_variant";--> statement-breakpoint
ALTER TABLE "checkout" ADD COLUMN "total_price" numeric NOT NULL;--> statement-breakpoint
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_unique_user_product_variant" UNIQUE("user_id","product_id","variant_id");