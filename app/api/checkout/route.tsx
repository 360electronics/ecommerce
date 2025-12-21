import { db } from "@/db/drizzle";
import { cart_offer_products, checkout, products, variants } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const checkouts = await db
      .select({
        id: checkout.id,
        userId: checkout.userId,
        productId: checkout.productId,
        variantId: checkout.variantId,
        cartOfferProductId: checkout.cartOfferProductId,
        quantity: checkout.quantity,
        totalPrice: checkout.totalPrice,
        createdAt: checkout.createdAt,
        updatedAt: checkout.updatedAt,
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
      .innerJoin(variants, eq(checkout.variantId, variants.id))
      .leftJoin(products, eq(checkout.productId, products.id))
      .leftJoin(
        cart_offer_products,
        eq(checkout.cartOfferProductId, cart_offer_products.id)
      )
      .where(eq(checkout.userId, userId));

    const sanitizedItems = checkouts
      .filter((item) => item.product !== null)
      .map((item) => ({
        ...item,
        quantity:
          Number.isNaN(Number(item.quantity)) || item.quantity <= 0
            ? 1
            : Number(item.quantity),
        totalPrice: Number(item.totalPrice) || 0,
        variant: {
          ...item.variant,
          mrp: String(item.variant.mrp),
          ourPrice: String(item.variant.ourPrice),
          stock: String(item.variant.stock),
        },
        product: item.product
          ? {
              ...item.product,
              totalStocks: String(item.product.totalStocks ?? ""),
              averageRating: String(item.product.averageRating ?? ""),
              ratingCount: String(item.product.ratingCount ?? ""),
            }
          : undefined,
        offerProduct:
          item.offerProduct && item.offerProduct.id
            ? {
                ...item.offerProduct,
                ourPrice: String(item.offerProduct.ourPrice),
              }
            : undefined,
        offerProductPrice: item.offerProduct && item.offerProduct.ourPrice,
      }));

    return NextResponse.json(sanitizedItems, { status: 200 });
  } catch (error) {
    console.error("Error fetching checkouts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: any = null;

    // ✅ SAFE JSON PARSE
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid or empty request body" },
        { status: 400 }
      );
    }

    const {
      userId,
      productId,
      variantId,
      cartOfferProductId,
      totalPrice,
      quantity,
      offerProductPrice,
    } = body ?? {};

    if (!userId || !productId || !variantId || !quantity || !totalPrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [newCheckout] = await db
      .insert(checkout)
      .values({
        userId,
        productId,
        variantId,
        cartOfferProductId,
        totalPrice,
        quantity,
      })
      .returning();

    // Schedule deletion after 1 hour
    after(async () => {
      const oneHour = 60 * 60 * 1000;
      setTimeout(async () => {
        await db
          .delete(checkout)
          .where(
            and(eq(checkout.id, newCheckout.id), eq(checkout.userId, userId))
          );
        console.log(`Cleaned up checkout item ${newCheckout.id}`);
      }, oneHour);
    });

    return NextResponse.json(newCheckout, { status: 201 });
  } catch (error) {
    console.error("Error creating checkout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!id || !userId) {
      return NextResponse.json(
        { error: "Checkout ID and User ID are required" },
        { status: 400 }
      );
    }

    const [deletedCheckout] = await db
      .delete(checkout)
      .where(and(eq(checkout.id, id), eq(checkout.userId, userId)))
      .returning();

    if (!deletedCheckout) {
      return NextResponse.json(
        { error: "Checkout not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Checkout deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting checkout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
