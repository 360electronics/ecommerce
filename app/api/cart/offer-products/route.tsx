import { CartItem } from '@/components/Cart/CartItem';
import { db } from '@/db/drizzle';
import { cart, cart_offer_products } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/cart/offer-products - Fetch offer products by range
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const range = url.searchParams.get('range');

    if (!range) {
      return NextResponse.json({ error: 'Range is required' }, { status: 400 });
    }

    const offerProducts = await db
      .select()
      .from(cart_offer_products)
      .where(eq(cart_offer_products.range, range));

    return NextResponse.json(offerProducts, { status: 200 });
  } catch (error) {
    console.error('[GET_OFFER_PRODUCTS_ERROR]', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to fetch offer products' }, { status: 500 });
  }
}

// POST /api/cart/offer-products - Add offer product to cart
export async function POST(req: NextRequest) {
  try {
    const { userId, offerProductId, quantity } = await req.json();

    if (!userId || !offerProductId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    const offerProduct = await db
      .select()
      .from(cart_offer_products)
      .where(eq(cart_offer_products.id, offerProductId))
      .limit(1);

    if (offerProduct.length === 0) {
      return NextResponse.json(
        { error: 'Offer product not found' },
        { status: 404 }
      );
    }

    // Check if the user already has an offer product in the cart
    const existingCartItem = await db
      .select()
      .from(cart)
      .where(and(eq(cart.userId, userId), eq(cart.productId, `offer_${offerProductId}`)))
      .limit(1);

    if (existingCartItem.length > 0) {
      return NextResponse.json(
        { error: 'An offer product is already in the cart' },
        { status: 400 }
      );
    }

    // Insert into cart as an offer product
    const newCartItem = await db
      .insert(cart)
      .values({
        userId,
        productId: `offer_${offerProductId}`,
        variantId: `offer_variant_${offerProductId}`,
        quantity,
      })
      .returning();

    // Construct CartItem response
    const cartItem: CartItem = {
      id: newCartItem[0].id,
      userId,
      productId: `offer_${offerProductId}`,
      variantId: `offer_variant_${offerProductId}`,
      quantity: newCartItem[0].quantity,
      createdAt: newCartItem[0].createdAt.toISOString(),
      updatedAt: newCartItem[0].updatedAt.toISOString(),
      isOfferProduct: true,
      product: {
        id: `offer_${offerProductId}`,
        shortName: offerProduct[0].productName,
        description: null,
        category: 'offer',
        brand: 'Offer',
        status: 'active',
        subProductStatus: 'active',
        totalStocks: offerProduct[0].quantity.toString(),
        averageRating: '0',
        ratingCount: '0',
        createdAt: offerProduct[0].createdAt.toISOString(),
        updatedAt: offerProduct[0].updatedAt.toISOString(),
      },
      variant: {
        id: `offer_variant_${offerProductId}`,
        productId: `offer_${offerProductId}`,
        name: offerProduct[0].productName,
        sku: `OFFER-${offerProductId}`,
        slug: `offer-${offerProductId}`,
        color: '',
        material: null,
        dimensions: null,
        weight: null,
        storage: null,
        stock: offerProduct[0].quantity.toString(),
        mrp: offerProduct[0].ourPrice,
        ourPrice: offerProduct[0].ourPrice,
        productImages: [{
          url: offerProduct[0].productImage,
          length: 0,
          alt: '',
          isFeatured: false,
          displayOrder: 0
        }],
        createdAt: offerProduct[0].createdAt.toISOString(),
        updatedAt: offerProduct[0].updatedAt.toISOString(),
      },
    };

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    console.error('[POST_OFFER_PRODUCT_ERROR]', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: 'Failed to add offer product to cart' },
      { status: 500 }
    );
  }
}