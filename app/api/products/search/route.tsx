// app/api/products/search/route.ts

import { NextResponse } from "next/server";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { products, variants } from "@/db/schema";
import { db } from "@/db/drizzle";

interface QuickSuggestion {
  id: string;
  title: string;
  slug: string;
  image?: string | null;
  price?: string | null;
  description: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const limitStr = searchParams.get("limit");
    const type = searchParams.get("type");

    const limit = Math.min(parseInt(limitStr || "8", 10), 20);

    // ==================== QUICK SUGGESTIONS (type=quick) ====================
    if (type === "quick" && q && q.length >= 2) {
      const query = q.toLowerCase();

      const results = await db
        .select({
          id: products.id,
          title: sql<string>`COALESCE(${products.shortName}, ${products.fullName})`.as("title"),
          description: products.description,
          slug: products.slug,
          variantSlug: variants.slug,
          price: variants.ourPrice,
          image: sql<string | null>`
            (SELECT (product_images->0->>'url')
             FROM variants v2
             WHERE v2.product_id = ${products.id}
               AND v2.is_default = true
             LIMIT 1)
          `.as("image"),
          // For ranking: higher score = better match
          score: sql<number>`
            GREATEST(
              similarity(lower(${products.shortName}), ${query}),
              similarity(lower(${products.fullName}), ${query})
            )
          `.as("score"),
        })
        .from(products)
        .leftJoin(
          variants,
          and(eq(products.id, variants.productId), eq(variants.isDefault, true))
        )
        .where(
          or(
            // 1. Prefix match (fastest + most relevant)
            ilike(products.shortName, `${query}%`),
            ilike(products.fullName, `${query}%`),

            // 2. Fuzzy match anywhere (trigram similarity)
            sql`similarity(lower(${products.shortName}), ${query}) > 0.3`,
            sql`similarity(lower(${products.fullName}), ${query}) > 0.3`
          )
        )
        .orderBy(sql`score DESC`) // Best matches first
        .limit(limit + 5)
        .execute();

      // Dedupe by ID and format
      const seen = new Set<string>();
      const suggestions: QuickSuggestion[] = [];

      for (const row of results) {
        if (!row.id || seen.has(row.id)) continue;
        seen.add(row.id);

        suggestions.push({
          id: row.id,
          title: row.title || "Untitled Product",
          slug: row.slug,
          image: row.image || null,
          price: row.price ? Number(row.price).toFixed(2) : null,
          description:
            row.description
              ? row.description.substring(0, 120).trim() + (row.description.length > 120 ? "..." : "")
              : "No description",
        });

        if (suggestions.length >= limit) break;
      }

      return NextResponse.json(
        { data: suggestions },
        {
          headers: {
            "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120",
            "CDN-Cache-Control": "public, s-maxage=600",
            "Vercel-CDN-Cache-Control": "public, s-maxage=600",
          },
        }
      );
    }

    // ==================== FALLBACK: Full search (no type=quick) ====================
    // Keep your existing full search logic here...
    // (with category, brand filters, etc.)

    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error("Quick search error:", error);
    return NextResponse.json({ data: [] });
  }
}