// app/api/users/wishlist/route.ts
import { db } from '@/db/drizzle';
import { wishlists, products, variants } from '@/db/schema';
import { NextResponse } from 'next/server';
import { and, eq, inArray } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const wishlist = await db
      .select({
        productId: wishlists.productId,
        variantId: wishlists.variantId,
        createdAt: wishlists.createdAt,
        product: {
          shortName: products.shortName,
          brand: products.brand,
          category: products.category,
          description: products.description,
          averageRating: products.averageRating,
          ratingCount: products.ratingCount,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
        },
        variant: {
          name: variants.name,
          sku: variants.sku,
          slug: variants.slug,
          color: variants.color,
          material: variants.material,
          dimensions: variants.dimensions,
          weight: variants.weight,
          storage: variants.storage,
          stock: variants.stock,
          mrp: variants.mrp,
          ourPrice: variants.ourPrice,
          productImages: variants.productImages,
        },
      })
      .from(wishlists)
      .innerJoin(variants, eq(wishlists.variantId, variants.id))
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, userId));

    // Fetch all variants for each product, only if productIds is non-empty
    const productIds = [...new Set(wishlist.map((item) => item.productId))];
    let allVariants: any[] = [];
    if (productIds.length > 0) {
      allVariants = await db
        .select({
          id: variants.id,
          productId: variants.productId,
          name: variants.name,
          sku: variants.sku,
          slug: variants.slug,
          color: variants.color,
          material: variants.material,
          dimensions: variants.dimensions,
          weight: variants.weight,
          storage: variants.storage,
          stock: variants.stock,
          mrp: variants.mrp,
          ourPrice: variants.ourPrice,
          productImages: variants.productImages,
        })
        .from(variants)
        .where(inArray(variants.productId, productIds));
    }

    // Map to VariantSelection
    const response: any[] = wishlist.map(({ productId, variantId, product, variant }) => ({
      productId,
      variantId,
      product: {
        ...product,
        variants: allVariants
          .filter((v) => v.productId === productId)
          .map((v) => ({
            ...v,
            productImages: v.productImages || [],
          })),
      },
      variant: {
        ...variant,
        productImages: variant.productImages || [],
      },
    }));

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[GET_WISHLIST_ERROR]', {
      message: error instanceof Error ? error.message : 'Unknown error',
      userId: new URL(req.url).searchParams.get('userId'),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, productId, variantId } = body;

    if (!userId || !productId || !variantId) {
      return NextResponse.json(
        { error: 'User ID, Product ID, and Variant ID are required' },
        { status: 400 }
      );
    }

    // Validate variant belongs to product
    const variantCheck = await db
      .select({ id: variants.id })
      .from(variants)
      .where(and(eq(variants.id, variantId), eq(variants.productId, productId)));

    if (!variantCheck.length) {
      return NextResponse.json(
        { error: 'Invalid variant for the specified product' },
        { status: 400 }
      );
    }

    // Check if the item already exists in the wishlist
    const existing = await db
      .select()
      .from(wishlists)
      .where(
        and(
          eq(wishlists.userId, userId),
          eq(wishlists.productId, productId),
          eq(wishlists.variantId, variantId)
        )
      );

    if (existing.length > 0) {
      return NextResponse.json({ message: 'Variant already in wishlist' }, { status: 200 });
    }

    // Insert new wishlist item
    const [newItem] = await db
      .insert(wishlists)
      .values({ userId, productId, variantId })
      .returning();

    // Fetch product and variant details for response
    const [wishlistItem] = await db
      .select({
        productId: wishlists.productId,
        variantId: wishlists.variantId,
        product: {
          id: products.id,
          shortName: products.shortName,
          brand: products.brand,
          category: products.category,
          description: products.description,
          status: products.status,
          subProductStatus: products.subProductStatus,
          deliveryMode: products.deliveryMode,
          tags: products.tags,
          totalStocks: products.totalStocks,
          averageRating: products.averageRating,
          ratingCount: products.ratingCount,
          createdAt: products.createdAt,
          updatedAt: products.updatedAt,
          specifications: products.specifications,
        },
        variant: {
          id: variants.id,
          productId: variants.productId,
          name: variants.name,
          sku: variants.sku,
          slug: variants.slug,
          color: variants.color,
          material: variants.material,
          dimensions: variants.dimensions,
          weight: variants.weight,
          storage: variants.storage,
          stock: variants.stock,
          mrp: variants.mrp,
          ourPrice: variants.ourPrice,
          productImages: variants.productImages,
        },
      })
      .from(wishlists)
      .innerJoin(variants, eq(wishlists.variantId, variants.id))
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.id, newItem.id));

    const allVariants = await db
      .select({
        id: variants.id,
        productId: variants.productId,
        name: variants.name,
        sku: variants.sku,
        slug: variants.slug,
        color: variants.color,
        material: variants.material,
        dimensions: variants.dimensions,
        weight: variants.weight,
        storage: variants.storage,
        stock: variants.stock,
        mrp: variants.mrp,
        ourPrice: variants.ourPrice,
        productImages: variants.productImages,
      })
      .from(variants)
      .where(eq(variants.productId, productId));

    const response: any = {
      productId,
      variantId,
      product: {
        ...wishlistItem.product,
        variants: allVariants.map((v) => ({
          ...v,
          productImages: v.productImages || [],
        })),
      },
      variant: {
        ...wishlistItem.variant,
        productImages: wishlistItem.variant.productImages || [],
      },
    };

    return NextResponse.json(
      { message: 'Variant added to wishlist', item: response },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST_WISHLIST_ERROR]', error);
    return NextResponse.json({ error: 'Failed to add variant to wishlist' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    const productId = url.searchParams.get('productId');
    const variantId = url.searchParams.get('variantId');

    if (!userId || !productId || !variantId) {
      return NextResponse.json(
        { error: 'User ID, Product ID, and Variant ID are required' },
        { status: 400 }
      );
    }

    // Delete the wishlist item
    const deletedItems = await db
      .delete(wishlists)
      .where(
        and(
          eq(wishlists.userId, userId),
          eq(wishlists.productId, productId),
          eq(wishlists.variantId, variantId)
        )
      )
      .returning();

    if (deletedItems.length === 0) {
      return NextResponse.json({ message: 'Wishlist item not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Wishlist item removed successfully' }, { status: 200 });
  } catch (error) {
    console.error('[DELETE_WISHLIST_ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete wishlist item' }, { status: 500 });
  }
}