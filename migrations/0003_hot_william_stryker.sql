CREATE TABLE "special_coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(10) NOT NULL,
	"percentage" numeric NOT NULL,
	"limit" numeric NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "special_coupons_code_unique" UNIQUE("code")
);
