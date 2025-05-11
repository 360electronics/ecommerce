ALTER TABLE "auth_tokens" DROP CONSTRAINT "auth_tokens_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "otp_tokens" DROP CONSTRAINT "otp_tokens_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone_number" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "phone_verified" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_tokens" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_tokens" ALTER COLUMN "token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_tokens" ALTER COLUMN "expires_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_tokens" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "otp_tokens" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "otp_tokens" ALTER COLUMN "token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "otp_tokens" ALTER COLUMN "type" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "otp_tokens" ALTER COLUMN "type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "otp_tokens" ALTER COLUMN "expires_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "otp_tokens" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ALTER COLUMN "is_used" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "coupons" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "referrals" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "referrals" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_tokens" ADD CONSTRAINT "otp_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;