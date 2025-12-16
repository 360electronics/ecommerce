import { NextResponse } from "next/server";
import { products, categories, subcategories, brands, variants } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db/drizzle";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brandSlug = searchParams.get("brand");
    const categorySlug = searchParams.get("category");

    if (!brandSlug) {
      return NextResponse.json(
        { error: "Missing required 'brand' parameter" },
        { status: 400 }
      );
    }

    // ✅ Build dynamic filter conditions
    const conditions: any[] = [eq(brands.slug, brandSlug)];
    if (categorySlug) {
      conditions.push(eq(categories.slug, categorySlug));
    }

    // ✅ Build the base query
    const rows = await db
      .select({
        product: products,
        category: categories,
        subcategory: subcategories,
        brand: brands,
        variant: variants,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id))
      .leftJoin(brands, eq(products.brandId, brands.id))
      .leftJoin(variants, eq(products.id, variants.productId))
      .where(and(...conditions)); // ✅ Works correctly

    // ✅ Group variants by product
    const grouped = rows.reduce((acc, row) => {
      const id = row.product.id;
      if (!acc[id]) {
        acc[id] = {
          ...row.product,
          category: row.category,
          subcategory: row.subcategory,
          brand: row.brand,
          variants: [],
        };
      }
      if (row.variant) {
        acc[id].variants.push(row.variant);
      }
      return acc;
    }, {} as Record<string, any>);

    const result = Object.values(grouped);

    // console.log(
    //   `✅ Brand Products API → ${brandSlug} (${categorySlug || "all"}) → ${result.length} products`
    // );

    return NextResponse.json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("❌ Error fetching brand products:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}