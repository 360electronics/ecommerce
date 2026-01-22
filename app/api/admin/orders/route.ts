import { db } from "@/db/drizzle";
import {
  checkout,
  checkoutSessions,
  orderItems,
  orders,
  savedAddresses,
  users,
  variants,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

interface ErrorResponse {
  message: string;
  error: string;
}

export async function GET() {
  try {
    const rows = await db
      .select({
        orders,
        item: orderItems,
        variant: variants,
        address: savedAddresses,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(variants, eq(variants.id, orderItems.variantId))
      .leftJoin(savedAddresses, eq(savedAddresses.id, orders.addressId));

    const orderMap = new Map<string, any>();

    for (const row of rows) {
      const orderId = row.orders.id;

      if (!orderMap.has(orderId)) {
        orderMap.set(orderId, {
          orders: row.orders,
          savedAddresses: row.address,
          variants: null, // dashboard needs only 1
          items: [],
        });
      }

      if (row.item) {
        orderMap.get(orderId).items.push({
          ...row.item,
          variant: row.variant,
        });

        // pick first variant for dashboard compatibility
        if (!orderMap.get(orderId).variants && row.variant) {
          orderMap.get(orderId).variants = row.variant;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: Array.from(orderMap.values()),
    });
  } catch (err) {
    console.error("[ORDER_GET_ERROR]", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
