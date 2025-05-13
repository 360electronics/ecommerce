import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  numeric,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { savedAddresses, users } from "../user/users.schema";
import { sql } from "drizzle-orm";
import { products, variants } from "../products/products.schema";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  addressId: uuid("address_id")
    .notNull()
    .references(() => savedAddresses.id, { onDelete: "restrict" }),
  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),
  status: varchar("status", {
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled", "returned"],
  })
    .default("pending")
    .notNull(),
  paymentStatus: varchar("payment_status", {
    enum: ["pending", "paid", "failed", "refunded"],
  })
    .default("pending")
    .notNull(),
  paymentMethod: varchar("payment_method", {
    enum: ["cod", "razorpay"],
  })
    .default("razorpay")
    .notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  shippingAmount: numeric("shipping_amount", { precision: 10, scale: 2 }).notNull().default("0.00"),
  deliveryMode: varchar("delivery_mode", {
    enum: ["standard", "express"],
  }).notNull().default("standard"),
  orderNotes: varchar("order_notes", { length: 1000 }),
  trackingNumber: varchar("tracking_number", { length: 255 }), // Added for shipping
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
}, (table) => [
  index("idx_orders_user_id").on(table.userId),
  index("idx_orders_status").on(table.status),
  index("idx_orders_razorpay_order_id").on(table.razorpayOrderId),
  index("idx_orders_address_id").on(table.addressId), // Added index
]);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  variantId: uuid("variant_id")
    .notNull()
    .references(() => variants.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
}, (table) => [
  index("idx_order_items_order_id").on(table.orderId),
  index("idx_order_items_product_id").on(table.productId),
  index("idx_order_items_variant_id").on(table.variantId),
]);