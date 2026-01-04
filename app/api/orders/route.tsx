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

export async function POST(req: Request) {
  try {
    const {
      userId,
      checkoutSessionId,
      addressId,
      totalAmount,
      discountAmount,
      couponCode,
      shippingAmount,
      deliveryMode,
      paymentMethod,
      paymentStatus,
      status,
    } = await req.json();

    if (!userId || !checkoutSessionId || !addressId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* 1️⃣ If order already exists → return it (IDEMPOTENT) */
    const existing = await db
      .select()
      .from(orders)
      .where(eq(orders.checkoutSessionId, checkoutSessionId))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json(existing[0], { status: 200 });
    }

    /* 2️⃣ Lock checkout session */
    const locked = await db
      .update(checkoutSessions)
      .set({ lockedAt: new Date(), status: "converted" })
      .where(
        and(
          eq(checkoutSessions.id, checkoutSessionId),
          eq(checkoutSessions.userId, userId),
          eq(checkoutSessions.status, "active")
        )
      );

    if (!locked.rowCount) {
      return NextResponse.json(
        { error: "Checkout already converted or expired" },
        { status: 409 }
      );
    }

    /* 3️⃣ Load checkout items */
    const items = await db
      .select()
      .from(checkout)
      .where(eq(checkout.checkoutSessionId, checkoutSessionId));

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Checkout is empty" },
        { status: 400 }
      );
    }

    /* 4️⃣ Create order */
    const [order] = await db
      .insert(orders)
      .values({
        userId,
        checkoutSessionId,
        addressId,
        totalAmount,
        discountAmount,
        couponCode,
        shippingAmount,
        deliveryMode,
        paymentMethod,
        paymentStatus,
        status,
      })
      .returning();

    /* 5️⃣ Insert order items */
    await db.insert(orderItems).values(
      items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.cartOfferProductId ? 1 : item.quantity,
        unitPrice: item.totalPrice,
        cartOfferProductId: item.cartOfferProductId,
      }))
    );

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Order creation failed:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const allOrders = await db
      .select({
        orders: orders,
        orderItems: orderItems,
        variants: variants,
        savedAddresses: savedAddresses,
      })
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(variants, eq(variants.id, orderItems.variantId))
      .leftJoin(savedAddresses, eq(savedAddresses.id, orders.addressId));
    return NextResponse.json({
      success: true,
      data: allOrders,
    });
  } catch (error) {
    console.error("[ORDER_GET_ERROR]", error);
    return NextResponse.json<ErrorResponse>(
      {
        message: "Failed to fetch orders",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
