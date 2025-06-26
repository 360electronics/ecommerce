import { db } from '@/db/drizzle';
import { cart, products, variants } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';


export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
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
        product: products,
        variant: variants,
      })
      .from(cart)
      .innerJoin(variants, eq(cart.variantId, variants.id))
      .innerJoin(products, eq(cart.productId, products.id))
      .where(eq(cart.userId, userId));

    // Sanitize quantities
    const sanitizedItems = cartItems.map((item) => ({
      ...item,
      quantity: Number.isNaN(Number(item.quantity)) || item.quantity <= 0 ? 1 : item.quantity,
    }));

    return NextResponse.json(sanitizedItems, { status: 200 });
  } catch (error) {
    console.error('[GET_CART_ERROR]', {
      message: error instanceof Error ? error.message : 'Unknown error',
      userId: new URL(req.url).searchParams.get('userId'),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

// POST /api/cart - Add or update item in cart
export async function POST(req: NextRequest) {
  try {
    const { userId, productId, variantId, quantity } = await req.json();

    if (!userId || !productId || !variantId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    const productExists = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);
    const variantExists = await db
      .select({ id: variants.id })
      .from(variants)
      .where(eq(variants.id, variantId))
      .limit(1);

    if (productExists.length === 0 || variantExists.length === 0) {
      return NextResponse.json(
        { error: 'Product or variant not found' },
        { status: 404 }
      );
    }

    const existingCartItem = await db
      .select()
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
      const updatedCartItem = await db
        .update(cart)
        .set({ quantity: existingCartItem[0].quantity + quantity, updatedAt: new Date() })
        .where(
          and(
            eq(cart.userId, userId),
            eq(cart.productId, productId),
            eq(cart.variantId, variantId)
          )
        )
        .returning();

      return NextResponse.json(updatedCartItem[0], { status: 200 });
    } else {
      const newCartItem = await db
        .insert(cart)
        .values({
          userId,
          productId,
          variantId,
          quantity,
        })
        .returning();

      return NextResponse.json(newCartItem[0], { status: 201 });
    }
  } catch (error) {
    console.error('Error in POST /api/cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(req: NextRequest) {
  try {
    const { userId, cartItemId, quantity } = await req.json();

    if (!userId || !cartItemId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    const sanitizedQuantity = Math.max(1, Math.floor(Number(quantity)));

    const updatedCartItem = await db
      .update(cart)
      .set({ quantity: sanitizedQuantity, updatedAt: new Date() })
      .where(and(eq(cart.id, cartItemId), eq(cart.userId, userId)))
      .returning();

    if (updatedCartItem.length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedCartItem[0], { status: 200 });
  } catch (error) {
    console.error('Error in PUT /api/cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
// DELETE /api/cart - Remove item from cart
export async function DELETE(req: NextRequest) {
  try {
    const { userId, productId, variantId } = await req.json();

    if (!userId || !productId || !variantId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const deletedCartItem = await db
      .delete(cart)
      .where(
        and(
          eq(cart.userId, userId),
          eq(cart.productId, productId),
          eq(cart.variantId, variantId)
        )
      )
      .returning();

    if (deletedCartItem.length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Cart item deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}