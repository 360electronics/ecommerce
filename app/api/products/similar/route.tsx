// app/api/products/similar/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { products, variants } from '@/db/schema';
import { and, between, eq, ne } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const variantId = searchParams.get('variantId');
  if (!variantId) {
    return NextResponse.json({ error: 'Missing variantId' }, { status: 400 });
  }

  try {
    // 1. Find base variant + product
    const [variant] = await db
      .select({
        id: variants.id,
        ourPrice: variants.ourPrice,
        productId: variants.productId,
      })
      .from(variants)
      .where(eq(variants.id, variantId));

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    const [product] = await db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        brandId: products.brandId,
      })
      .from(products)
      .where(eq(products.id, variant.productId));

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Price range
    const basePrice = Number(variant.ourPrice);
    const minPrice = basePrice * 0.8;
    const maxPrice = basePrice * 1.2;

    // 3. Find similar variants (same category, price range, exclude self)
    const similar = await db
      .select({
        variantId: variants.id,
        productId: variants.productId,
        name: variants.name,
        slug: variants.slug,
        ourPrice: variants.ourPrice,
        mrp: variants.mrp,
        isOnSale: variants.isOnSale,
        averageRating: products.averageRating,
        productImages: variants.productImages,
        productName: products.shortName,
        productSlug: products.slug,
      })
      .from(variants)
      .innerJoin(products, eq(variants.productId, products.id))
      .where(
        and(
          eq(products.categoryId, product.categoryId),
          between(
            variants.ourPrice,
            minPrice.toString(),
            maxPrice.toString()
          ),
          ne(variants.id, variantId)
        )
      )
      .limit(15);

    return NextResponse.json(similar);
  } catch (err) {
    console.error('Error fetching similar products:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
