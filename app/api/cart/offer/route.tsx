import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { cart, cart_offer_products, products, variants } from "@/db/schema";
import { eq, and, isNull, isNotNull } from "drizzle-orm";

export async function PATCH(req: NextRequest) {
  try {
    const { userId, cartItemId, cartOfferProductId } = await req.json();

    // Validate input
    if (!userId || !cartItemId || !cartOfferProductId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate offer product exists
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

    // Check if user already has ANY offer product in their cart
    const [existingOfferItem] = await db
      .select()
      .from(cart)
      .where(and(
        eq(cart.userId, userId), 
        isNotNull(cart.cartOfferProductId)
      ))
      .limit(1);
    
    if (existingOfferItem) {
      return NextResponse.json({ 
        error: "You can only have one offer product in your cart at a time" 
      }, { status: 400 });
    }

    // Validate that the specific cart item exists and belongs to the user
    const [cartItem] = await db
      .select()
      .from(cart)
      .where(and(
        eq(cart.userId, userId), 
        eq(cart.id, cartItemId)
      ))
      .limit(1);
    
    if (!cartItem) {
      return NextResponse.json({ 
        error: "Cart item not found" 
      }, { status: 404 });
    }

    // Check if this specific cart item already has an offer product
    if (cartItem.cartOfferProductId) {
      return NextResponse.json({ 
        error: "This cart item already has an offer product linked" 
      }, { status: 400 });
    }

    // Update the cart item with the offer product
    const [updatedItem] = await db
      .update(cart)
      .set({ 
        cartOfferProductId, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(cart.userId, userId), 
        eq(cart.id, cartItemId)
      ))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ 
        error: "Failed to update cart item" 
      }, { status: 500 });
    }

    // Fetch the complete updated cart item with all related data
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

    if (!fullCartItem) {
      return NextResponse.json({ 
        error: "Failed to fetch updated cart item" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Offer product added successfully",
      cartItem: fullCartItem
    }, { status: 200 });

  } catch (error) {
    console.error("Error adding offer product to cart:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}

// Optional: Add a DELETE method to remove offer products
export async function DELETE(req: NextRequest) {
  try {
    const { userId, cartItemId } = await req.json();

    if (!userId || !cartItemId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Remove offer product from cart item
    const [updatedItem] = await db
      .update(cart)
      .set({ 
        cartOfferProductId: null, 
        updatedAt: new Date() 
      })
      .where(and(
        eq(cart.userId, userId), 
        eq(cart.id, cartItemId)
      ))
      .returning();

    if (!updatedItem) {
      return NextResponse.json({ 
        error: "Failed to remove offer product" 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Offer product removed successfully"
    }, { status: 200 });

  } catch (error) {
    console.error("Error removing offer product:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}