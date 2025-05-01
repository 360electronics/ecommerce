CREATE TABLE "featured_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" serial NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "featured_products" ADD CONSTRAINT "featured_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_featured_product_id" ON "featured_products" USING btree ("product_id");