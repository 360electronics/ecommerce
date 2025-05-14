ALTER TABLE "special_coupons" ALTER COLUMN "percentage" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "special_coupons" ADD COLUMN "amount" numeric;