ALTER TABLE "orders" RENAME COLUMN "cashfree_order_id" TO "gateway_order_id";--> statement-breakpoint
ALTER TABLE "orders" RENAME COLUMN "cashfree_payment_id" TO "payment_id";--> statement-breakpoint
DROP INDEX "idx_orders_razorpay_order_id";--> statement-breakpoint
CREATE INDEX "idx_orders_gateway_order_id" ON "orders" USING btree ("gateway_order_id");