import { NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/drizzle";
import {
  brands,
  categories,
  offerZone,
  products,
  subcategories,
  variants,
} from "@/db/schema";
import { requireAdmin } from "@/lib/server-auth";

const MAX_PAGE_SIZE = 100;

// Table sort keys → SQL columns
const SORT_COLUMNS = {
  fullName: products.fullName,
  variantName: variants.name,
  sku: variants.sku,
  ourPrice: variants.ourPrice,
  category: categories.name,
  brand: brands.name,
  stock: variants.stock,
  averageRating: products.averageRating,
  status: products.status,
  createdAt: products.createdAt,
} as const;

type SortKey = keyof typeof SORT_COLUMNS;

/*
 * GET /api/admin/products?page=1&pageSize=10&q=&category=&sort=fullName&dir=asc
 * One row per variant (matches the admin products table), paginated in SQL and
 * limited to the columns the table renders.
 */
export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.error) return admin.error;

  try {
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Number(params.get("page")) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number(params.get("pageSize")) || 10),
    );
    const q = params.get("q")?.trim();
    const category = params.get("category")?.trim();
    const sortParam = params.get("sort") as SortKey | null;
    const sortColumn = sortParam && sortParam in SORT_COLUMNS ? SORT_COLUMNS[sortParam] : products.createdAt;
    const direction = params.get("dir") === "asc" ? asc : desc;

    const filters: SQL[] = [];
    if (q) {
      const term = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
      filters.push(
        or(
          ilike(products.fullName, term),
          ilike(products.shortName, term),
          ilike(variants.name, term),
          ilike(variants.sku, term),
          ilike(brands.name, term),
        )!,
      );
    }
    if (category && category !== "All") {
      filters.push(eq(categories.name, category));
    }
    const where = filters.length ? and(...filters) : undefined;

    const baseFrom = () =>
      db
        .select({
          productId: products.id,
          variantId: variants.id,
          shortName: products.shortName,
          fullName: products.fullName,
          category: categories.name,
          subcategory: subcategories.name,
          brand: brands.name,
          status: products.status,
          isFeatured: products.isFeatured,
          averageRating: products.averageRating,
          variantName: variants.name,
          sku: variants.sku,
          slug: variants.slug,
          attributes: variants.attributes,
          stock: variants.stock,
          mrp: variants.mrp,
          ourPrice: variants.ourPrice,
          salePrice: variants.salePrice,
          // Only the featured (or first) image, not the whole gallery
          image: sql<{ url: string; alt: string } | null>`(
            SELECT t.img
            FROM jsonb_array_elements(COALESCE(${variants.productImages}, '[]'::jsonb))
              WITH ORDINALITY AS t(img, idx)
            ORDER BY (t.img->>'isFeatured')::boolean DESC NULLS LAST, t.idx
            LIMIT 1
          )`,
          variantCount: sql<number>`(
            SELECT count(*)::int FROM ${variants} v2 WHERE v2.product_id = ${products.id}
          )`,
          isInOfferZone: sql<boolean>`EXISTS (
            SELECT 1 FROM ${offerZone} oz WHERE oz.variant_id = ${variants.id}
          )`,
        })
        .from(variants)
        .innerJoin(products, eq(variants.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(subcategories, eq(products.subcategoryId, subcategories.id))
        .leftJoin(brands, eq(products.brandId, brands.id));

    const [rows, [{ total }], categoryRows, [stats]] = await Promise.all([
      baseFrom()
        .where(where)
        .orderBy(direction(sortColumn), asc(variants.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(variants)
        .innerJoin(products, eq(variants.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(brands, eq(products.brandId, brands.id))
        .where(where),
      db
        .select({ name: categories.name })
        .from(categories)
        .orderBy(asc(categories.name)),
      db
        .select({
          totalProducts: sql<number>`count(*)::int`,
          activeProducts: sql<number>`count(*) FILTER (WHERE ${products.status} = 'active')::int`,
        })
        .from(products),
    ]);

    return NextResponse.json({
      data: rows.map(({ variantCount, ...row }) => ({
        ...row,
        averageRating: Number(row.averageRating),
        stock: Number(row.stock),
        mrp: Number(row.mrp),
        ourPrice: Number(row.ourPrice),
        salePrice: row.salePrice != null ? Number(row.salePrice) : null,
        hasMultipleVariants: variantCount > 1,
      })),
      total,
      page,
      pageSize,
      categories: categoryRows.map((c) => c.name),
      stats,
    });
  } catch (error) {
    console.error("[ADMIN_PRODUCTS_GET_ERROR]", error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
