CREATE TABLE "checkout_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"locked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uniq_active_session" UNIQUE("user_id","status")
);
--> statement-breakpoint
ALTER TABLE "checkout" DROP CONSTRAINT "checkout_unique_user_product_variant";--> statement-breakpoint
ALTER TABLE "checkout" ADD COLUMN "checkout_session_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "checkout_sessions" ADD CONSTRAINT "checkout_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_checkout_session_user" ON "checkout_sessions" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "checkout" ADD CONSTRAINT "checkout_checkout_session_id_checkout_sessions_id_fk" FOREIGN KEY ("checkout_session_id") REFERENCES "public"."checkout_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkout" ADD CONSTRAINT "uniq_checkout_item" UNIQUE("checkout_session_id","variant_id");