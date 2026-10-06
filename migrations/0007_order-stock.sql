ALTER TABLE "orders" ADD COLUMN "stock_reserved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "stock_issue" varchar;--> statement-breakpoint
ALTER TABLE "variants" ADD CONSTRAINT "variants_stock_non_negative" CHECK ("variants"."stock" >= 0 OR "variants"."is_backorderable");