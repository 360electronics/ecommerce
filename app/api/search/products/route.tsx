import { db } from "@/db/drizzle";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

const normalize = (v: string) =>
  v
    .toString()
    .normalize("NFKD")
    .replace(/[\u200E\u200F\u00A0]/g, "")
    .trim()
    .toLowerCase();

const NON_ATTRIBUTE_KEYS = [
  "category",
  "subcategory",
  "q",
  "page",
  "sort",
  "brand",
  "rating",
  "minPrice",
  "maxPrice",
  "inStock",
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q")?.trim();
    const page = Number(searchParams.get("page") || 1);
    const limit = 24;
    const offset = (page - 1) * limit;
    const sort = searchParams.get("sort") || "relevance";

    /* ---------------- FILTERS ---------------- */
    const brands = searchParams.getAll("brand");
    const ratings = searchParams.getAll("rating").map(Number);
    const minPrice = Number(searchParams.get("minPrice") || 0);
    const maxPrice = Number(searchParams.get("maxPrice") || 9999999);
    const inStock = searchParams.get("inStock") === "true";

    // Dynamic attribute filters (Panel, Resolution, etc)
    const attributeFilters: Record<string, string[]> = {};
    searchParams.forEach((_, key) => {
      if (!NON_ATTRIBUTE_KEYS.includes(key)) {
        attributeFilters[key] = searchParams.getAll(key);
      }
    });

    if (!q) {
      return NextResponse.json({
        data: [],
        totalCount: 0,
        page,
        pageSize: limit,
        filterOptions: {
          brands: [],
          colors: [],
          storageOptions: [],
          attributes: {},
          priceRange: { min: 0, max: 0 },
        },
      });
    }

    /* ---------------- WHERE CLAUSE ---------------- */
    const whereClauses = [
      sql`p.status = 'active'`,
      sql`(
        p.search_vector @@ plainto_tsquery('simple', ${q})
        OR p.short_name ILIKE ${"%" + q + "%"}
      )`,
      sql`v.our_price BETWEEN ${minPrice} AND ${maxPrice}`,
    ];

    if (brands.length > 0) {
      whereClauses.push(sql`LOWER(b.name) IN (${sql.join(brands, sql`,`)})`);
    }

    if (ratings.length > 0) {
      whereClauses.push(
        sql`FLOOR(p.average_rating) IN (${sql.join(ratings, sql`,`)})`
      );
    }

    if (inStock) {
      whereClauses.push(sql`v.stock > 0`);
    }

    Object.entries(attributeFilters).forEach(([key, values]) => {
      if (values.length > 0) {
        whereClauses.push(
          sql`LOWER(v.attributes ->> ${key}) IN (${sql.join(
            values.map(normalize),
            sql`,`
          )})`
        );
      }
    });

    const where = sql.join(whereClauses, sql` AND `);

    /* ---------------- COUNT ---------------- */
    const countResult = await db.execute(sql`
      SELECT COUNT(*)::int AS count
      FROM products p
      JOIN variants v ON v.product_id = p.id AND v.is_default = true
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE ${where}
    `);

    const totalCount = countResult.rows[0]?.count ?? 0;

    /* ---------------- FILTER OPTIONS (UNFILTERED PRICE) ---------------- */
    const filterRows = await db.execute(sql`
      SELECT
        b.name AS brand,
        v.attributes,
        v.our_price
      FROM products p
      JOIN variants v ON v.product_id = p.id AND v.is_default = true
      LEFT JOIN brands b ON b.id = p.brand_id
      WHERE
        p.status = 'active'
        AND (
          p.search_vector @@ plainto_tsquery('simple', ${q})
          OR p.short_name ILIKE ${"%" + q + "%"}
        )
    `);

    const brandSet = new Set<string>();
    const attributesMap: Record<string, Set<string>> = {};
    let min = Infinity;
    let max = 0;

    for (const row of filterRows.rows) {
      if (row.brand) brandSet.add(String(row.brand));

      const price = Number(row.our_price);
      if (!isNaN(price)) {
        min = Math.min(min, price);
        max = Math.max(max, price);
      }

      if (row.attributes && typeof row.attributes === "object") {
        Object.entries(row.attributes).forEach(([key, value]) => {
          if (!attributesMap[key]) attributesMap[key] = new Set();
          attributesMap[key].add(String(value));
        });
      }
    }

    const filterOptions = {
      brands: Array.from(brandSet),
      colors: attributesMap.color ? Array.from(attributesMap.color) : [],
      storageOptions: attributesMap.storage
        ? Array.from(attributesMap.storage)
        : [],
      attributes: Object.fromEntries(
        Object.entries(attributesMap).map(([k, v]) => [k, Array.from(v)])
      ),
      priceRange: {
        min: min === Infinity ? 0 : min,
        max,
      },
    };

    let orderBy = sql`
  ts_rank(p.search_vector, plainto_tsquery('simple', ${q})) DESC
`; // default: relevance

    switch (sort) {
      case "price_asc":
        orderBy = sql`v.our_price ASC`;
        break;

      case "price_desc":
        orderBy = sql`v.our_price DESC`;
        break;

      case "rating_desc":
        orderBy = sql`p.average_rating DESC NULLS LAST`;
        break;

      case "newest":
        orderBy = sql`p.created_at DESC`;
        break;

      case "relevance":
      default:
        orderBy = sql`
      ts_rank(p.search_vector, plainto_tsquery('simple', ${q})) DESC
    `;
    }

    /* ---------------- DATA ---------------- */
    const rows = await db.execute(sql`
      SELECT
        p.id,
        p.slug,
        p.full_name,
        p.average_rating,

        b.id AS brand_id,
        b.name AS brand_name,

        v.id AS variant_id,
        v.attributes,
        v.our_price,
        v.mrp,
        v.stock,

        (v.product_images->0->>'url') AS image

      FROM products p
      JOIN variants v ON v.product_id = p.id AND v.is_default = true
      LEFT JOIN brands b ON b.id = p.brand_id

      WHERE ${where}

      ORDER BY ${orderBy}

      LIMIT ${limit}
      OFFSET ${offset}
    `);

    console.log("Data from search products api:", totalCount, page);

    return NextResponse.json({
      data: rows.rows,
      totalCount,
      page,
      pageSize: limit,
      filterOptions,
    });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
