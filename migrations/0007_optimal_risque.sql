ALTER TABLE "products" ADD COLUMN "search_vector" "tsvector";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "checkout_session_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_checkout_session_id_checkout_sessions_id_fk" FOREIGN KEY ("checkout_session_id") REFERENCES "public"."checkout_sessions"("id") ON DELETE cascade ON UPDATE no action;