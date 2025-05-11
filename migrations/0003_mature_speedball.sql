ALTER TABLE "banners" ADD COLUMN "start_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "end_date" date NOT NULL;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "status" varchar DEFAULT 'active' NOT NULL;