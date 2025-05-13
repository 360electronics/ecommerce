// app/api/gamers-zone/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { gamersZone, products, variants } from '@/db/schema/products/products.schema';
import { eq, sql } from 'drizzle-orm';


export async function GET() {
  try {
    // Fetch gamers zone entries with product and variant details
    const gamersZoneEntries = await db
      .select({
        productId: gamersZone.productId,
        variantId: gamersZone.variantId,
        category: gamersZone.category,
        createdAt: gamersZone.createdAt,
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
      .from(gamersZone)
      .innerJoin(variants, eq(gamersZone.variantId, variants.id))
      .innerJoin(products, eq(gamersZone.productId, products.id))
      .limit(50); // Limit to prevent large responses

    // Fetch all variants for each product
    const productIds = [...new Set(gamersZoneEntries.map((item) => item.productId))];
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

    // Group entries by category
    const result = gamersZoneEntries.reduce((acc, { productId, variantId, category, product, variant }) => {
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        productId,
        variantId,
        category,
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
      });
      return acc;
    }, {} as Record<string,any[]>);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[GET_GAMERS_ZONE_ERROR]', error);
    return NextResponse.json(
      { message: 'Failed to fetch gamers zone products' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();

    // Expecting { categories: { laptops: [{ productId, variantId }], consoles: [{ productId, variantId }], ... } }
    const { categories } = body;

    // Validate input
    if (!categories || typeof categories !== 'object') {
      return NextResponse.json(
        { message: 'Invalid request. Expected categories object with variant selections' },
        { status: 400 }
      );
    }

    const validCategories = ['laptops', 'consoles', 'accessories', 'steering-chairs'];
    const insertValues: any[] = [];

    // Process each category
    for (const [category, selections] of Object.entries(categories)) {
      // Validate category
      if (!validCategories.includes(category)) {
        continue; // Skip invalid categories
      }

      // Validate selections
      if (!Array.isArray(selections)) {
        continue; // Skip invalid selections
      }

      for (const { productId, variantId } of selections) {
        if (!productId || !variantId) {
          continue; // Skip invalid entries
        }

        // Verify variant belongs to product
        const variant = await db
          .select({ id: variants.id })
          .from(variants)
          .where(sql`${variants.id} = ${variantId} AND ${variants.productId} = ${productId}`);

        if (!variant.length) {
          continue; // Skip invalid variant-product pairs
        }

        insertValues.push({
          productId,
          variantId,
          category,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Delete existing entries
    await db.delete(gamersZone);

    // Perform bulk insert if there are valid entries
    if (insertValues.length > 0) {
      const result = await db.insert(gamersZone).values(insertValues);
      return NextResponse.json({
        message: 'Gamers Zone updated successfully',
        count: insertValues.length,
        result,
      }, { status: 200 });
    } else {
      return NextResponse.json(
        { message: 'No valid entries to insert' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('[POST_GAMERS_ZONE_ERROR]', error);
    return NextResponse.json(
      { message: 'Failed to update gamers zone' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { variantId, category } = body;

    if (!variantId || !category) {
      return NextResponse.json(
        { message: 'Variant ID and category are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['laptops', 'consoles', 'accessories', 'steering-chairs'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { message: 'Invalid category' },
        { status: 400 }
      );
    }

    const result = await db
      .delete(gamersZone)
      .where(
        sql`${gamersZone.variantId} = ${variantId} AND ${gamersZone.category} = ${category}`
      );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: 'No gamers zone entry found for the given variant and category' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: 'Variant removed from gamers zone',
        result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DELETE_GAMERS_ZONE_ERROR]', error);
    return NextResponse.json(
      { message: 'Failed to remove variant from gamers zone' },
      { status: 500 }
    );
  }
}