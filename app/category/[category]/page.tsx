"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ProductListing from "@/components/Listing/ProductListing";

/* ---------------- TYPES ---------------- */
interface FlattenedProduct {
  id: string; // PRODUCT ID
  variantId?: string; // VARIANT ID

  sku?: string;
  attributes: Record<string, any>;
  variantSlug: string;

  productId: string;
  name: string;
  slug: string;
  description?: string;

  mrp: string;
  ourPrice: string;
  totalStocks: string;
  averageRating: string;

  brand: {
    id: string;
    name: string;
  } | null;

  category: string;
  subcategory?: string;

  productImages: {
    url: string;
    alt?: string;
  }[];

  tags: string[];
  status: "active" | "inactive" | "coming_soon" | "discontinued";
  createdAt: string;
  updatedAt: string;
}

/* ---------------- SAFE DEFAULT FILTER OPTIONS ---------------- */

const EMPTY_FILTER_OPTIONS = {
  brands: [],
  colors: [],
  storageOptions: [],
  attributes: {},
  priceRange: {
    min: 0,
    max: 0,
  },
};

/* ---------------- API ---------------- */
async function fetchCategoryProductsApi(
  params: URLSearchParams,
  signal: AbortSignal,
) {
  const res = await fetch(`/api/products/category?${params.toString()}`, {
    cache: "no-store",
    signal,
  });

  if (!res.ok) throw new Error("Failed to load category products");
  return res.json();
}

/* ---------------- MAPPER ---------------- */

function mapRowToFlattened(row: any): FlattenedProduct {
  const now = new Date().toISOString();

  return {
    id: row.id, // ✅ PRODUCT ID (stable)
    productId: row.id,
    variantId: row.variant_id, // ✅ VARIANT ID (explicit)

    sku: row.sku,
    attributes: row.attributes ?? {},

    name: row.full_name,
    slug: row.slug,
    variantSlug: row.variant_slug ,
    description: row.description ?? "",

    mrp: String(row.mrp ?? "0"),
    ourPrice: String(row.our_price ?? "0"),
    totalStocks: String(row.stock ?? "0"),
    averageRating: String(row.average_rating ?? "0"),

    brand: row.brand_id ? { id: row.brand_id, name: row.brand_name } : null,

    category: row.category ?? "",
    subcategory: row.subcategory ?? "",

    productImages: row.image ? [{ url: row.image, alt: row.short_name }] : [],

    tags: [],
    status: "active",

    createdAt: row.created_at ? new Date(row.created_at).toISOString() : now,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : now,
  };
}

/* ---------------- LOADER ---------------- */

const CategoryLoading = () => (
  <div className="mx-auto">
    <div className="flex flex-col md:flex-row gap-8">
      <div className="hidden md:block w-full md:w-1/4 bg-white p-4 rounded-lg border animate-pulse">
        <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="mb-4">
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
        <div className="h-10 bg-gray-200 rounded mt-6"></div>
      </div>
      <div className="block md:hidden w-full bg-white p-4 rounded-lg border animate-pulse">
        <div className="flex gap-2 justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="w-full md:w-3/4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white p-4 rounded-lg animate-pulse border"
            >
              <div className="w-full h-36 md:h-48 bg-gray-200 rounded mb-4"></div>
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ---------------- CONTENT ---------------- */

function CategoryContent({
  category,
  subcategory,
}: {
  category: string;
  subcategory?: string;
}) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") || 1);

  const [products, setProducts] = useState<FlattenedProduct[]>([]);
  const [filterOptions, setFilterOptions] = useState(EMPTY_FILTER_OPTIONS);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);

        // USE FULL URL PARAMS
        const params = new URLSearchParams(searchParams.toString());

        // ensure category & subcategory always exist
        params.set("category", category);
        if (subcategory) params.set("subcategory", subcategory);

        const res = await fetchCategoryProductsApi(params, controller.signal);

        if (controller.signal.aborted) return;

        setProducts(res.data.map(mapRowToFlattened));
        setTotalCount(res.totalCount ?? 0);
        setFilterOptions(res.filterOptions ?? EMPTY_FILTER_OPTIONS);

        // console.log("Filter options: ", category, ":", res.filterOptions);
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Category fetch error:", err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, [searchParams, category, subcategory]); // KEY CHANGE

  return (
    <>
      {loading ? (
        <CategoryLoading />
      ) : (
        <ProductListing
          products={products}
          totalCount={totalCount}
          pageSize={24}
          currentPage={page}
          filterOptions={filterOptions}
          category={category}
          loading={loading}
        />
      )}
    </>
  );
}

/* ---------------- PAGE ---------------- */

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const category = params.category as string;
  const subcategory = searchParams.get("subcategory") || undefined;

  return (
    <Suspense fallback={<CategoryLoading />}>
      <CategoryContent category={category} subcategory={subcategory} />
    </Suspense>
  );
}
