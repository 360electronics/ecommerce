import { db } from "@/db/drizzle";
import { orders, orderItems, variants, products, savedAddresses, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { OrderEmailData } from "./nodemailer";

export async function getOrderEmailData(orderId: string): Promise<OrderEmailData | null> {
  // Fetch order with user and address
  const [orderRow] = await db
    .select({
      order: orders,
      user: users,
      address: savedAddresses,
    })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.userId))
    .leftJoin(savedAddresses, eq(savedAddresses.id, orders.addressId))
    .where(eq(orders.id, orderId));

  if (!orderRow) return null;

  // Fetch order items with product and variant names
  const itemRows = await db
    .select({
      item: orderItems,
      variant: variants,
      product: products,
    })
    .from(orderItems)
    .leftJoin(variants, eq(variants.id, orderItems.variantId))
    .leftJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, orderId));

  const { order, user, address } = orderRow;

  if (!address || !user?.email) return null;

  return {
    orderId: order.id,
    customerName:
      user.firstName
        ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
        : address.fullName,
    customerEmail: user.email,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    totalAmount: order.totalAmount,
    discountAmount: order.discountAmount,
    shippingAmount: order.shippingAmount,
    address: {
      fullName: address.fullName,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      phoneNumber: address.phoneNumber,
    },
    items: itemRows.map((r) => ({
      productName: r.product?.shortName ?? "Product",
      variantName: r.variant?.name ?? "",
      quantity: r.item.quantity,
      unitPrice: r.item.unitPrice,
    })),
  };
}
