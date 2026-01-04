import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { orders, orderItems, products, variants } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/* ---------------------------------------------
   RESPONSE TYPES (IMPORTANT)
--------------------------------------------- */

type OrderItemResponse = {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  quantity: number;
  unitPrice: string;
  cartOfferProductId: string | null;
  product: Omit<
    typeof products.$inferSelect,
    "specifications"
  > | null;
  variant: typeof variants.$inferSelect | null;
};

type OrderResponse = {
  id: string;
  userId: string;
  addressId: string;
  gatewayOrderId: string | null;
  paymentId: string | null;
  status: typeof orders.$inferSelect["status"];
  paymentStatus: typeof orders.$inferSelect["paymentStatus"];
  paymentMethod: typeof orders.$inferSelect["paymentMethod"];
  totalAmount: string;
  shippingAmount: string;
  deliveryMode: typeof orders.$inferSelect["deliveryMode"];
  orderNotes: string | null;
  trackingNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  deliveredAt: Date | null;
  couponCode: string | null;
  discountAmount: string;
  couponId: string | null;
  items: OrderItemResponse[];
};

/* ---------------------------------------------
   GET ORDERS
--------------------------------------------- */

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const rows = await db
      .select({
        order: orders,
        item: orderItems,
        product: products,
        variant: variants,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(variants, eq(orderItems.variantId, variants.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    if (rows.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const orderMap = new Map<string, OrderResponse>();

    for (const row of rows) {
      const { order, item, product, variant } = row;

      if (!orderMap.has(order.id)) {
        orderMap.set(order.id, {
          id: order.id,
          userId: order.userId,
          addressId: order.addressId,
          gatewayOrderId: order.gatewayOrderId,
          paymentId: order.paymentId,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          totalAmount: order.totalAmount,
          shippingAmount: order.shippingAmount,
          deliveryMode: order.deliveryMode,
          orderNotes: order.orderNotes,
          trackingNumber: order.trackingNumber,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          deliveredAt: order.deliveredAt,
          couponCode: order.couponCode ?? null,
          discountAmount: order.discountAmount ?? "0.00",
          couponId: order.couponId ?? null,
          items: [],
        });
      }

      if (item) {
        orderMap.get(order.id)!.items.push({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          cartOfferProductId: null,
          product: product
            ? (product as Omit<
                typeof products.$inferSelect,
                "specifications"
              >)
            : null,
          variant: variant
            ? (variant as typeof variants.$inferSelect)
            : null,
        });
      }
    }

    return NextResponse.json(
      Array.from(orderMap.values()),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
