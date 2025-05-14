CREATE TABLE "special_coupon_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"coupon_id" uuid NOT NULL,
	"used_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_user_coupon" UNIQUE("user_id","coupon_id")
);
--> statement-breakpoint
ALTER TABLE "special_coupon_usage" ADD CONSTRAINT "special_coupon_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "special_coupon_usage" ADD CONSTRAINT "special_coupon_usage_coupon_id_special_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."special_coupons"("id") ON DELETE cascade ON UPDATE no action;