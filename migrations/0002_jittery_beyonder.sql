ALTER TABLE "orders" RENAME COLUMN "razorpay_order_id" TO "cashfree_order_id";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "razorpay_payment_id" TO "cashfree_payment_id";--> statement-breakpoint
DROP INDEX "idx_orders_razorpay_order_id";--> statement-breakpoint
CREATE INDEX "idx_orders_razorpay_order_id" ON "orders" USING btree ("cashfree_order_id");