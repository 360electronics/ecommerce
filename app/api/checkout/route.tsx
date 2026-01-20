import { db } from "@/db/drizzle";
import {
  checkout,
  checkoutSessions,
  cart_offer_products,
  products,
  variants,
} from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

/* ----------------------------------------------------
   GET /api/checkout?userId=...
---------------------------------------------------- */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const items = await db
      .select({
        id: checkout.id,
        userId: checkout.userId,
        checkoutSessionId: checkout.checkoutSessionId,
        productId: checkout.productId,
        variantId: checkout.variantId,
        cartOfferProductId: checkout.cartOfferProductId,
        quantity: checkout.quantity,
        totalPrice: checkout.totalPrice,
        product: products,
        variant: variants,
        offerProduct: {
          id: cart_offer_products.id,
          productName: cart_offer_products.productName,
          productImage: cart_offer_products.productImage,
          ourPrice: cart_offer_products.ourPrice,
        },
      })
      .from(checkout)
      .innerJoin(
        checkoutSessions,
        eq(checkout.checkoutSessionId, checkoutSessions.id),
      )
      .innerJoin(variants, eq(checkout.variantId, variants.id))
      .leftJoin(products, eq(checkout.productId, products.id))
      .leftJoin(
        cart_offer_products,
        eq(checkout.cartOfferProductId, cart_offer_products.id),
      )
      .where(
        and(eq(checkout.userId, userId), eq(checkoutSessions.status, "active")),
      );

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("Error fetching checkout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ----------------------------------------------------
   POST /api/checkout
---------------------------------------------------- */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      productId,
      variantId,
      quantity,
      totalPrice,
      cartOfferProductId,
    } = body ?? {};

    // ✅ HARD VALIDATION
    if (!userId || !productId || !variantId || !quantity || !totalPrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // 1️⃣ Get active checkout session
    const [session] = await db
      .select()
      .from(checkoutSessions)
      .where(
        and(
          eq(checkoutSessions.userId, userId),
          eq(checkoutSessions.status, "active"),
        ),
      )
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { error: "No active checkout session" },
        { status: 400 },
      );
    }

    // 2️⃣ Insert checkout item (✅ userId INCLUDED)
    const [created] = await db
      .insert(checkout)
      .values({
        userId, // 🔥 THIS FIXES YOUR ERROR
        checkoutSessionId: session.id,
        productId,
        variantId,
        quantity,
        totalPrice,
        cartOfferProductId,
      })
      .onConflictDoNothing() // prevent duplicates per session
      .returning();

    return NextResponse.json(created ?? null, { status: 201 });
  } catch (error) {
    console.error("Error creating checkout item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/* ----------------------------------------------------
   DELETE /api/checkout?id=...&userId=...
---------------------------------------------------- */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json(
        { error: "Checkout ID and User ID are required" },
        { status: 400 },
      );
    }

    await db
      .delete(checkout)
      .where(and(eq(checkout.id, id), eq(checkout.userId, userId)));

    return NextResponse.json(
      { message: "Checkout item removed" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting checkout item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
