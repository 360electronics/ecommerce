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
    const body = await req.json();

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
      paymentStatus = "pending",
      status = "pending",
    } = body;

    if (!userId || !checkoutSessionId || !addressId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* 1️⃣ Load checkout items */
    const items = await db
      .select()
      .from(checkout)
      .where(eq(checkout.checkoutSessionId, checkoutSessionId));

    if (items.length === 0) {
      return NextResponse.json({ error: "Checkout empty" }, { status: 400 });
    }

    /* 2️⃣ CREATE ORDER (ALWAYS) */
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

    /* 3️⃣ Insert order items */
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

    /* 4️⃣ LOCK checkout session (AFTER order exists) */
    await db
      .update(checkoutSessions)
      .set({ lockedAt: new Date(), status: "converted" })
      .where(eq(checkoutSessions.id, checkoutSessionId));

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("ORDER CREATE FAILED", err);
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
