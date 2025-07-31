import { db } from '@/db/drizzle';
import { cart, cart_offer_products, products, variants } from '@/db/schema';
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
        },
        offerProductPrice: cart_offer_products.ourPrice,
      })
      .from(cart)
      .innerJoin(variants, eq(cart.variantId, variants.id))
      .innerJoin(products, eq(cart.productId, products.id))
      .leftJoin(cart_offer_products, eq(cart.cartOfferProductId, cart_offer_products.id))
      .where(eq(cart.userId, userId));

    const sanitizedItems = cartItems.map((item) => ({
      ...item,
      quantity: Number.isNaN(Number(item.quantity)) || item.quantity <= 0 ? 1 : item.quantity,
      offerProductPrice: item.cartOfferProductId ? item.offerProductPrice ?? '0' : undefined,
      offerProduct: item.cartOfferProductId ? item.offerProduct : undefined,
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

export async function PATCH(req: NextRequest) {
  try {
    const { userId, cartItemId, cartOfferProductId, offerPrice } = await req.json();

    if (!userId || !cartItemId || !cartOfferProductId || !offerPrice) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    const offerProductExists = await db
      .select({ id: cart_offer_products.id })
      .from(cart_offer_products)
      .where(eq(cart_offer_products.id, cartOfferProductId))
      .limit(1);

    if (offerProductExists.length === 0) {
      return NextResponse.json(
        { error: 'Offer product not found' },
        { status: 404 }
      );
    }

    const updatedCartItem = await db
      .update(cart)
      .set({
        cartOfferProductId,
        updatedAt: new Date(),
      })
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
    console.error('Error in PATCH /api/cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE_OFFER(req: NextRequest) {
  try {
    const { userId, cartItemId } = await req.json();

    if (!userId || !cartItemId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const updatedCartItem = await db
      .update(cart)
      .set({
        cartOfferProductId: null,
        updatedAt: new Date(),
      })
      .where(and(eq(cart.id, cartItemId), eq(cart.userId, userId)))
      .returning();

    if (updatedCartItem.length === 0) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Offer product removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE_OFFER /api/cart/offer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}