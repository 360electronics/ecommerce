CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"referral_code" varchar(10) NOT NULL,
	"referrer_id" uuid,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "referrals_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_referral_code_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_referred_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_users_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "referral_code";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "referred_by";