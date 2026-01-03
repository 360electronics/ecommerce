import { db } from "@/db/drizzle";
import { sql, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page") || 1);
    const limit = 12;
    const offset = (page - 1) * limit;

    /* ---------------- FILTERS ---------------- */
    const brands = searchParams.getAll("brand");
    const minPrice = Number(searchParams.get("minPrice") || 0);
    const maxPrice = Number(searchParams.get("maxPrice") || 9999999);
    const inStock = searchParams.get("inStock") === "true";

    /* ---------------- WHERE ---------------- */
    const whereClauses = [
      sql`p.status = 'active'`,
      sql`v.our_price BETWEEN ${minPrice} AND ${maxPrice}`,
    ];

    if (brands.length) {
      whereClauses.push(
        sql`b.name IN (${sql.join(brands, sql`,`)})`
      );
    }

    if (inStock) {
      whereClauses.push(sql`v.stock > 0`);
    }

    const where = sql.join(whereClauses, sql` AND `);

    /* ---------------- COUNT ---------------- */
    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM offer_zone oz
      JOIN products p ON p.id = oz.product_id
      JOIN variants v ON v.id = oz.variant_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE ${where}
    `);

    const totalCount = countResult.rows[0]?.count ?? 0;

    /* ---------------- FILTER OPTIONS ---------------- */
    const filterRows = await db.execute(sql`
      SELECT
        b.name AS brand,
        v.attributes,
        v.our_price
      FROM offer_zone oz
      JOIN products p ON p.id = oz.product_id
      JOIN variants v ON v.id = oz.variant_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE ${where}
    `);

    const brandSet = new Set<string>();
    const attributesMap: Record<string, Set<string>> = {};
    let min = Infinity;
    let max = 0;

    for (const row of filterRows.rows) {
      if (row.brand) brandSet.add(String(row.brand));

      const price = Number(row.our_price);
      min = Math.min(min, price);
      max = Math.max(max, price);

      if (row.attributes) {
        Object.entries(row.attributes).forEach(([k, v]) => {
          if (!attributesMap[k]) attributesMap[k] = new Set();
          attributesMap[k].add(String(v));
        });
      }
    }

    const filterOptions = {
      brands: Array.from(brandSet),
      attributes: Object.fromEntries(
        Object.entries(attributesMap).map(([k, v]) => [k, [...v]])
      ),
      priceRange: {
        min: min === Infinity ? 0 : min,
        max,
      },
    };

    /* ---------------- DATA ---------------- */
    const rows = await db.execute(sql`
      SELECT
        p.id AS product_id,
        v.id AS variant_id,
        p.slug,
        p.short_name,
        p.average_rating,
        b.id AS brand_id,
        b.name AS brand_name,
        v.our_price,
        v.mrp,
        v.stock,
        v.attributes,
        (v.product_images->0->>'url') AS image
      FROM offer_zone oz
      JOIN products p ON p.id = oz.product_id
      JOIN variants v ON v.id = oz.variant_id
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE ${where}
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    return NextResponse.json({
      data: rows.rows,
      totalCount,
      page,
      pageSize: limit,
      filterOptions,
    });
  } catch (err) {
    console.error("Offer zone error:", err);
    return NextResponse.json(
      { error: "Failed to load offer zone" },
      { status: 500 }
    );
  }
}
