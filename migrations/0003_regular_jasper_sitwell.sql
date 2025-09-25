CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"pincode" text,
	"phone" text,
	"email" text,
	"lat" double precision,
	"lng" double precision,
	"tags" jsonb,
	"opening_hours" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
