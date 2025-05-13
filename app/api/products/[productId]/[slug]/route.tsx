import { NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { products, variants } from '@/db/schema';
import { FlattenedProduct } from '@/types/product';


type Params = Promise<{ productId: string; slug: string }> ;

// GET handler for /api/products/[productId]/[slug]
export async function GET(
  request: Request,
  { params }: { params: Params } 
) {
  try {
    const { productId, slug } = await params;

    // Validate parameters
    if (!productId || !slug) {
      return NextResponse.json(
        { error: 'Missing productId or slug' },
        { status: 400 }
      );
    }

    // Query the variant with matching productId and slug, including the parent product
    const result = await db
      .select({
        variant: variants,
        product: products,
      })
      .from(variants)
      .innerJoin(products, eq(variants.productId, products.id))
      .where(
        and(
          eq(variants.productId, productId),
          eq(variants.slug, slug)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const { variant, product } = result[0];

    // Fetch all variants for the product to include in productParent.variants
    const allVariants = await db
      .select()
      .from(variants)
      .where(eq(variants.productId, productId));

    // Map to FlattenedProduct
    const flattenedProduct: FlattenedProduct = {
      id: variant.id,
      productId: variant.productId,
      name: variant.name,
      mrp: variant.mrp.toString(),
      ourPrice: variant.ourPrice.toString(),
      color: variant.color || undefined,
      storage: variant.storage || undefined,
      stock: variant.stock.toString(),
      totalStocks: variant.stock.toString(), // Use variant stock for totalStocks
      slug: variant.slug,
      productImages: variant.productImages,
      sku: variant.sku,
      dimensions: variant.dimensions || undefined,
      material: variant.material || undefined,
      weight: variant.weight || undefined,
      createdAt: variant.createdAt.toISOString(),
      updatedAt: variant.updatedAt.toISOString(),
      category: product.category,
      brand: product.brand || undefined,
      averageRating: product.averageRating.toString(),
      tags: product.tags ? product.tags.split(',').map((tag) => tag.trim()) : [],
      description: product.description || null,
      productParent: {
        id: product.id,
        averageRating: product.averageRating.toString(),
        brand: product.brand || undefined,
        category: product.category,
        description: product.description || null,
        shortName: product.shortName,
        status: product.status,
        subProductStatus: product.subProductStatus,
        totalStocks: product.totalStocks.toString(),
        tags: product.tags ? product.tags.split(',').map((tag) => tag.trim()) : [],
        specifications: product.specifications,
        ratingCount: product.ratingCount.toString(),
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
        variants: allVariants.map((v) => ({
          id: v.id,
          productId: v.productId,
          name: v.name,
          mrp: v.mrp.toString(),
          ourPrice: v.ourPrice.toString(),
          color: v.color || undefined,
          storage: v.storage || undefined,
          stock: v.stock.toString(),
          slug: v.slug,
          productImages: v.productImages,
          sku: v.sku,
          dimensions: v.dimensions || undefined,
          material: v.material || undefined,
          weight: v.weight || undefined,
          createdAt: v.createdAt.toISOString(),
          updatedAt: v.updatedAt.toISOString(),
        })),
      },
    };

    return NextResponse.json(flattenedProduct, { status: 200 });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}