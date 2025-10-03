import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { orders, orderItems, products, variants } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    // Extract userId from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    // Validate userId presence
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Fetch orders with order items, products, and variants
    const userOrders = await db
      .select({
        order: {
          id: orders.id,
          userId: orders.userId,
          addressId: orders.addressId,
          gatewayOrderId: orders.gatewayOrderId,
          paymentId: orders.paymentId,
          status: orders.status,
          paymentStatus: orders.paymentStatus,
          paymentMethod: orders.paymentMethod,
          totalAmount: orders.totalAmount,
          shippingAmount: orders.shippingAmount,
          deliveryMode: orders.deliveryMode,
          orderNotes: orders.orderNotes,
          trackingNumber: orders.trackingNumber,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          deliveredAt: orders.deliveredAt,
        },
        orderItem: {
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          variantId: orderItems.variantId,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
        },
        product: products,
        variant: variants,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(variants, eq(orderItems.variantId, variants.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    if (userOrders.length === 0) {
      console.log("No orders found for user:", userId);
      return NextResponse.json([], { status: 200 }); // Return empty array instead of 404
    }

    // Group order items and their products/variants by order
    const formattedOrders = userOrders.reduce(
      (acc, { order, orderItem, product, variant }) => {
        const existingOrder = acc.find((o) => o.id === order.id);
        const item = orderItem
          ? {
              id: orderItem.id,
              orderId: orderItem.orderId,
              productId: orderItem.productId,
              variantId: orderItem.variantId,
              quantity: orderItem.quantity,
              unitPrice: orderItem.unitPrice,
              product: product
                ? products
                : null,
              variant: variant
                ? variants
                : null,
            }
          : null;

        if (existingOrder) {
          if (item) {
            existingOrder.items.push({
              ...item,
              product: product
                ? (product as Omit<typeof products.$inferSelect, "specifications">)
                : null,
              variant: variant
                ? (variant as typeof variants.$inferSelect)
                : null,
              cartOfferProductId: null
            });
          }
        } else {
          acc.push({
            ...order,
            items: item
              ? [
                  {
                    ...item,
                    cartOfferProductId: null,
                    product: product
                      ? (product as Omit<typeof products.$inferSelect, "specifications">)
                      : null,
                    variant: variant
                      ? (variant as typeof variants.$inferSelect)
                      : null,
                  },
                ]
              : [],
            couponCode: null,
            discountAmount: "",
            couponId: null,
          });
        }
        return acc;
      },
      [] as Array<
        typeof orders.$inferSelect & {
          items: Array<
            typeof orderItems.$inferSelect & {
              product: Omit<typeof products.$inferSelect, "specifications"> | null;
              variant: typeof variants.$inferSelect | null;
            }
          >;
        }
      >
    );

    return NextResponse.json(formattedOrders, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}