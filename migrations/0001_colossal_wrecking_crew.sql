ALTER TABLE "attribute_templates" DROP CONSTRAINT "attribute_templates_subcategory_id_subcategories_id_fk";
--> statement-breakpoint
ALTER TABLE "attribute_templates" DROP CONSTRAINT "attribute_templates_category_id_categories_id_fk";
--> statement-breakpoint
DROP INDEX "idx_attribute_template_category";--> statement-breakpoint
DROP INDEX "idx_attribute_template_subcategory";--> statement-breakpoint
ALTER TABLE "attribute_templates" ALTER COLUMN "category_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "attribute_templates" ALTER COLUMN "attributes" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "attribute_templates" ADD CONSTRAINT "attribute_templates_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribute_templates" DROP COLUMN "subcategory_id";