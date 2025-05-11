import {
  pgTable,
  uuid,
  timestamp,
  varchar,
  numeric,
  integer,
} from "drizzle-orm/pg-core";
import { users } from "../user/users.schema";
import { sql } from "drizzle-orm";
import { products } from "../products/products.schema";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  razorpayOrderId: varchar("razorpay_order_id", { length: 255 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 255 }),

  status: varchar("status", {
    enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
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

  shippingAddress: varchar("shipping_address", { length: 1024 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),

  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
});

