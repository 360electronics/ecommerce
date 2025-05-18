import { products, variants } from "@/db/schema/products/products.schema"
import { db } from "@/db/drizzle"
import { NextResponse } from "next/server"
import { offerZone as  featuredProducts } from "@/db/schema/products/products.schema"
import { eq, sql } from "drizzle-orm"


export async function GET() {
  try {
    // Fetch featured products with product and variant details in a single query
    const featured = await db
      .select({
        productId: featuredProducts.productId,
        variantId: featuredProducts.variantId,
        createdAt: featuredProducts.createdAt,
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
      .from(featuredProducts)
      .innerJoin(variants, eq(featuredProducts.variantId, variants.id))
      .innerJoin(products, eq(featuredProducts.productId, products.id))

    // Fetch all variants for each product to include in the response
    const productIds = [...new Set(featured.map((item) => item.productId))];
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
      .where(sql`${variants.productId} IN ${productIds}`);

    // Map results to VariantSelection, including all variants in product
    const response: any[] = featured.map(({ productId, variantId, product, variant }) => ({
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
    console.error('[GET_FEATURED_PRODUCTS_ERROR]', error);
    return NextResponse.json(
      { message: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();

    // Expecting { variantSelections: [{ productId: string, variantId: string }, ...] }
    const { variantSelections } = body;

    // Validate input
    if (!variantSelections || !Array.isArray(variantSelections)) {
      return NextResponse.json(
        { message: 'Invalid request. Expected array of variant selections' },
        { status: 400 }
      );
    }

    // Validate each selection
    for (const selection of variantSelections) {
      if (!selection.productId || !selection.variantId) {
        return NextResponse.json(
          { message: 'Each selection must include productId and variantId' },
          { status: 400 }
        );
      }

      // Verify variant belongs to product
      const variant = await db
        .select({ id: variants.id })
        .from(variants)
        .where(
          sql`${variants.id} = ${selection.variantId} AND ${variants.productId} = ${selection.productId}`
        );

      if (!variant.length) {
        return NextResponse.json(
          { message: `Invalid variantId ${selection.variantId} for productId ${selection.productId}` },
          { status: 400 }
        );
      }
    }

    // Delete existing featured products
    await db.delete(featuredProducts);

    // Prepare bulk insert values
    const insertValues = variantSelections.map(({ productId, variantId }) => ({
      productId,
      variantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Perform bulk insert
    const result = await db.insert(featuredProducts).values(insertValues);

    return NextResponse.json({
      message: 'Featured products updated successfully',
      count: insertValues.length,
      result,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating featured products:', error);
    return NextResponse.json(
      { message: 'Failed to update featured products' },
      { status: 500 }
    );
  }
}



export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { variantId } = body;

    if (!variantId) {
      return NextResponse.json(
        { message: 'Invalid request. Expected variantId' },
        { status: 400 }
      );
    }

    const result = await db
      .delete(featuredProducts)
      .where(eq(featuredProducts.variantId, variantId));

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: 'No featured product found with given variantId' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Featured product removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing featured product:', error);
    return NextResponse.json(
      { message: 'Failed to remove featured product' },
      { status: 500 }
    );
  }
}