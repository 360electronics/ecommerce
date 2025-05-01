ALTER TABLE "featured_products" DROP CONSTRAINT "featured_products_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "new_arrivals" DROP CONSTRAINT "new_arrivals_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "product_reviews" DROP CONSTRAINT "product_reviews_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "product_spec_fields" DROP CONSTRAINT "product_spec_fields_group_id_product_spec_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "product_spec_groups" DROP CONSTRAINT "product_spec_groups_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "featured_products" ADD CONSTRAINT "featured_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "new_arrivals" ADD CONSTRAINT "new_arrivals_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_spec_fields" ADD CONSTRAINT "product_spec_fields_group_id_product_spec_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."product_spec_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_spec_groups" ADD CONSTRAINT "product_spec_groups_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;