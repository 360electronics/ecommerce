import { NextResponse } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { products, variants } from "@/db/schema";
import { requireAdmin } from "@/lib/server-auth";

/*
 * GET /api/admin/products/options
 * Lightweight product + variant list for admin pickers (Offer Zone, New
 * Arrivals, Gamer Zone). Same { data: Product[] } shape as /api/products but
 * only the fields the pickers render — no specs, search vector or full gallery.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  try {
    const rows = await db
      .select({
        productId: products.id,
        shortName: products.shortName,
        fullName: products.fullName,
        // Pickers show a short preview only
        description: sql<string | null>`left(${products.description}, 300)`,
        variantId: variants.id,
        variantName: variants.name,
        sku: variants.sku,
        ourPrice: variants.ourPrice,
        mrp: variants.mrp,
        firstImage: sql<{ url: string; alt: string } | null>`${variants.productImages}->0`,
      })
      .from(products)
      .innerJoin(variants, eq(variants.productId, products.id))
      .orderBy(asc(products.fullName), asc(variants.name));

    const byProduct = new Map<string, any>();
    for (const row of rows) {
      let product = byProduct.get(row.productId);
      if (!product) {
        product = {
          id: row.productId,
          shortName: row.shortName,
          fullName: row.fullName,
          description: row.description,
          variants: [],
        };
        byProduct.set(row.productId, product);
      }
      product.variants.push({
        id: row.variantId,
        productId: row.productId,
        name: row.variantName,
        sku: row.sku,
        ourPrice: row.ourPrice,
        mrp: row.mrp,
        productImages: row.firstImage ? [row.firstImage] : [],
      });
    }

    return NextResponse.json({ data: Array.from(byProduct.values()) });
  } catch (error) {
    console.error("[ADMIN_PRODUCT_OPTIONS_ERROR]", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
