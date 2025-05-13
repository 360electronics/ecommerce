import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { cart, products, variants } from "@/db/schema";
import { db } from "@/db/drizzle";

// Type for POST request body
interface AddToCartBody {
  productId: string;
  variantId: string;
  quantity?: number;
}

// Type for PUT request body
// interface UpdateCartBody {
//   quantity: number;
// }

// Helper function to validate UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// GET: Fetch user's cart
export async function GET(req: NextRequest) {
  try {
    // Assume userId is obtained from auth (e.g., session, token)
    const body = await req.json();

    const { user_id } = body;
    const userId = user_id;

    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: "Unauthorized or invalid user ID" }, { status: 401 });
    }

    const cartItems = await db
      .select({
        id: cart.id,
        userId: cart.userId,
        productId: cart.productId,
        variantId: cart.variantId,
        quantity: cart.quantity,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
        product: {
          shortName: products.shortName,
          description: products.description,
          brand: products.brand,
        },
        variant: {
          name: variants.name,
          sku: variants.sku,
          color: variants.color,
          storage: variants.storage,
          ourPrice: variants.ourPrice,
          productImages: variants.productImages,
        },
      })
      .from(cart)
      .innerJoin(products, eq(cart.productId, products.id))
      .innerJoin(variants, eq(cart.variantId, variants.id))
      .where(eq(cart.userId, userId));

    return NextResponse.json({ cartItems }, { status: 200 });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Add item to cart
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: "Unauthorized or invalid user ID" }, { status: 401 });
    }

    const body: AddToCartBody = await req.json();
    const { productId, variantId, quantity = 1 } = body;

    // Validate inputs
    if (!productId || !isValidUUID(productId)) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }
    if (!variantId || !isValidUUID(variantId)) {
      return NextResponse.json({ error: "Invalid variant ID" }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Quantity must be a positive integer" }, { status: 400 });
    }

    // Verify product and variant exist
    const productExists = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    if (productExists.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const variantExists = await db
      .select({ id: variants.id, stock: variants.stock })
      .from(variants)
      .where(and(eq(variants.id, variantId), eq(variants.productId, productId)))
      .limit(1);
    if (variantExists.length === 0) {
      return NextResponse.json({ error: "Variant not found or does not belong to product" }, { status: 404 });
    }

    // Check stock availability
    if (parseInt(variantExists[0].stock) < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    // Check if item already exists in cart
    const existingCartItem = await db
      .select({ id: cart.id, quantity: cart.quantity })
      .from(cart)
      .where(
        and(
          eq(cart.userId, userId),
          eq(cart.productId, productId),
          eq(cart.variantId, variantId)
        )
      )
      .limit(1);

    if (existingCartItem.length > 0) {
      // Update quantity if item exists
      const newQuantity = existingCartItem[0].quantity + quantity;
      if (parseInt(variantExists[0].stock) < newQuantity) {
        return NextResponse.json({ error: "Insufficient stock for updated quantity" }, { status: 400 });
      }

      const updatedCartItem = await db
        .update(cart)
        .set({ quantity: newQuantity, updatedAt: new Date() })
        .where(eq(cart.id, existingCartItem[0].id))
        .returning();

      return NextResponse.json({ cartItem: updatedCartItem[0] }, { status: 200 });
    }

    // Add new item to cart
    const newCartItem = await db
      .insert(cart)
      .values({
        userId,
        productId,
        variantId,
        quantity,
      })
      .returning();

    return NextResponse.json({ cartItem: newCartItem[0] }, { status: 201 });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update cart item quantity
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const { user_id } = body;
    const userId = user_id;
    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: "Unauthorized or invalid user ID" }, { status: 401 });
    }

    const { quantity } = body;

    // Validate inputs
    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Quantity must be a positive integer" }, { status: 400 });
    }

    const cartItemId = new URL(req.url).searchParams.get("cartItemId");
    if (!cartItemId || !isValidUUID(cartItemId)) {
      return NextResponse.json({ error: "Invalid cart item ID" }, { status: 400 });
    }

    // Verify cart item exists and belongs to user
    const cartItem = await db
      .select({
        id: cart.id,
        variantId: cart.variantId,
      })
      .from(cart)
      .where(and(eq(cart.id, cartItemId), eq(cart.userId, userId)))
      .limit(1);

    if (cartItem.length === 0) {
      return NextResponse.json({ error: "Cart item not found or unauthorized" }, { status: 404 });
    }

    // Check stock for the variant
    const variant = await db
      .select({ stock: variants.stock })
      .from(variants)
      .where(eq(variants.id, cartItem[0].variantId))
      .limit(1);

    if (parseInt(variant[0].stock) < quantity) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const updatedCartItem = await db
      .update(cart)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cart.id, cartItemId))
      .returning();

    return NextResponse.json({ cartItem: updatedCartItem[0] }, { status: 200 });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove item from cart
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();

    const { user_id } = body;
    const userId = user_id;
    
    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json({ error: "Unauthorized or invalid user ID" }, { status: 401 });
    }

    const cartItemId = new URL(req.url).searchParams.get("cartItemId");
    if (!cartItemId || !isValidUUID(cartItemId)) {
      return NextResponse.json({ error: "Invalid cart item ID" }, { status: 400 });
    }

    // Verify cart item exists and belongs to user
    const cartItem = await db
      .select({ id: cart.id })
      .from(cart)
      .where(and(eq(cart.id, cartItemId), eq(cart.userId, userId)))
      .limit(1);

    if (cartItem.length === 0) {
      return NextResponse.json({ error: "Cart item not found or unauthorized" }, { status: 404 });
    }

    await db.delete(cart).where(eq(cart.id, cartItemId));

    return NextResponse.json({ message: "Cart item removed" }, { status: 200 });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}