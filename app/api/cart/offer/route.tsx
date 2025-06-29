import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { cart, cart_offer_products, products, variants } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  try {
    const { userId, cartItemId, cartOfferProductId } = await req.json();

    // Validate input
    if (!userId || !cartItemId || !cartOfferProductId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate offer product
    const [offerProduct] = await db
      .select({
        id: cart_offer_products.id,
        productName: cart_offer_products.productName,
        productImage: cart_offer_products.productImage,
        ourPrice: cart_offer_products.ourPrice,
        quantity: cart_offer_products.quantity,
      })
      .from(cart_offer_products)
      .where(eq(cart_offer_products.id, cartOfferProductId))
      .limit(1);
    if (!offerProduct) {
      return NextResponse.json({ error: "Offer product not found" }, { status: 404 });
    }

    // Check if cart already has an offer product
    const [existingOfferItem] = await db
      .select()
      .from(cart)
      .where(and(eq(cart.userId, userId), eq(cart.cartOfferProductId, cartOfferProductId)))
      .limit(1);
    if (existingOfferItem) {
      return NextResponse.json({ error: "An offer product is already linked to the cart" }, { status: 400 });
    }

    // Validate cart item is a regular product (no existing cartOfferProductId)
    const [cartItem] = await db
      .select()
      .from(cart)
      .where(and(eq(cart.userId, userId), eq(cart.id, cartItemId), isNull(cart.cartOfferProductId)))
      .limit(1);
    if (!cartItem) {
      return NextResponse.json({ error: "Cart item not found or already linked to an offer product" }, { status: 404 });
    }

    // Update cart item with offer product
    const [updatedItem] = await db
      .update(cart)
      .set({ cartOfferProductId, updatedAt: new Date() })
      .where(and(eq(cart.userId, userId), eq(cart.id, cartItemId)))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 });
    }

    // Fetch updated cart item with product, variant, and offer product details
    const [fullCartItem] = await db
      .select({
        id: cart.id,
        userId: cart.userId,
        productId: cart.productId,
        variantId: cart.variantId,
        cartOfferProductId: cart.cartOfferProductId,
        quantity: cart.quantity,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        product: products,
        variant: variants,
        offerProduct: {
          id: cart_offer_products.id,
          productName: cart_offer_products.productName,
          productImage: cart_offer_products.productImage,
          ourPrice: cart_offer_products.ourPrice,
          quantity: cart_offer_products.quantity,
        },
      })
      .from(cart)
      .leftJoin(products, eq(cart.productId, products.id))
      .leftJoin(variants, eq(cart.variantId, variants.id))
      .leftJoin(cart_offer_products, eq(cart.cartOfferProductId, cart_offer_products.id))
      .where(eq(cart.id, cartItemId))
      .limit(1);

    return NextResponse.json(fullCartItem, { status: 200 });
  } catch (error) {
    console.error("Error adding offer product to cart:", error);
    return NextResponse.json({ error: "Failed to add offer product to cart" }, { status: 500 });
  }
}