import { db } from "@/db/drizzle";
import { offerZone, products, variants } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";


export async function GET() {
  try {
    const offers = await db
      .select({
        productId: offerZone.productId,
        variantId: offerZone.variantId,
        createdAt: offerZone.createdAt,
        product: products,
        variant: variants,
      })
      .from(offerZone)
      .innerJoin(variants, eq(offerZone.variantId, variants.id))
      .innerJoin(products, eq(offerZone.productId, products.id));

    // If no offers, return an empty response
    if (offers.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Fetch all variants for each product to include in the response
    const productIds = [...new Set(offers.map((item) => item.productId))];
    const allVariants = await db
      .select({
        id: variants.id,
        productId: variants.productId,
        name: variants.name,
        sku: variants.sku,
        slug: variants.slug,
        stock: variants.stock,
        mrp: variants.mrp,
        ourPrice: variants.ourPrice,
        productImages: variants.productImages,
      })
      .from(variants)
      .where(inArray(variants.productId, productIds)); // Use inArray since productIds is non-empty

    // Map results to VariantSelection, including all variants in product
    const response: any[] = offers.map(({ productId, variantId, product, variant }) => ({
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
    console.error('[GET_OFFER_ZONE_PRODUCTS_ERROR]', error);
    return NextResponse.json(
      { message: 'Failed to fetch offer zone products' },
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

    // Delete existing offer zone products
    await db.delete(offerZone);

    // Prepare bulk insert values
    const insertValues = variantSelections.map(({ productId, variantId }) => ({
      productId,
      variantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Perform bulk insert
    const result = await db.insert(offerZone).values(insertValues);

    return NextResponse.json({
      message: 'Offer zone products updated successfully',
      count: insertValues.length,
      result,
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating offer zone products:', error);
    return NextResponse.json(
      { message: 'Failed to update offer zone products' },
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
      .delete(offerZone)
      .where(eq(offerZone.variantId, variantId));

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: 'No offer zone product found with given variantId' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Offer zone product removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing offer zone product:', error);
    return NextResponse.json(
      { message: 'Failed to remove offer zone product' },
      { status: 500 }
    );
  }
}