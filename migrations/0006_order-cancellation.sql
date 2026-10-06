ALTER TABLE "orders" ADD COLUMN "cancelled_by" varchar;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancellation_reason" varchar(500);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancellation_charge_percent" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancellation_charge" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refund_amount" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refund_status" varchar;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refund_id" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "refunded_at" timestamp with time zone;