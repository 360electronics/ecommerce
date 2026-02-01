"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductListing from "@/components/Listing/ProductListing";

/* ---------------- TYPES ---------------- */
interface FlattenedProduct {
  id: string;
  productId: string;
  name: string;
  slug: string;
  mrp: string;
  ourPrice: string;
  totalStocks: string;
  averageRating: string;
  brand: { id: string; name: string } | null;
  category: string;
  subcategory?: string;
  productImages: { url: string; alt?: string }[];
  attributes: Record<string, any>;
  tags: string[];
  status: "active" | "inactive" | "coming_soon" | "discontinued";
  createdAt: string;
  updatedAt: string;
}

interface FilterOptions {
  brands: string[];
  colors: string[];
  storageOptions: string[];
  attributes: Record<string, string[]>;
  priceRange: { min: number; max: number };
}

/* ---------------- API ---------------- */
async function fetchSearchProducts(
  params: URLSearchParams,
  signal?: AbortSignal
) {
  const res = await fetch(`/api/search/products?${params.toString()}`, {
    cache: "no-store",
    signal,
  });

  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

/* ---------------- LOADER ---------------- */
const SearchLoading = () => (
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

/* ---------------- CORE ---------------- */
function SearchContent({ query }: { query: string }) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") || 1);

  const [products, setProducts] = useState<FlattenedProduct[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(
    null
  );
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(24);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    // 🔑 use FULL search params (filters + page + query)
    const params = new URLSearchParams(searchParams.toString());

    fetchSearchProducts(params, controller.signal)
      .then((res) => {
        const mapped = res.data.map((row: any) => ({
          id: row.id,
          productId: row.id,
          variantId: row.variant_id,

          name: row.full_name,
          slug: row.slug,
          mrp: String(row.mrp),
          ourPrice: String(row.our_price),
          totalStocks: String(row.stock),
          averageRating: String(row.average_rating),

          brand: row.brand_id
            ? { id: row.brand_id, name: row.brand_name }
            : null,

          category: row.category_name ?? "",
          subcategory: row.subcategory_name ?? "",
          attributes: row.attributes ?? {},

          productImages: row.image
            ? [{ url: row.image, alt: row.short_name }]
            : [],

          tags: [],
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));

        setProducts(mapped);
        setTotalCount(res.totalCount ?? 0);
        setPageSize(res.pageSize ?? 24);
        setFilterOptions(res.filterOptions ?? null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error(err);
          setError("Failed to load search results");
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [searchParams]); // 🔥 THIS is the key

  return (
    <>
      {loading ? (
              <SearchLoading />
            ) : (
              <ProductListing
                products={products}
                totalCount={totalCount}
                pageSize={24}
                currentPage={page}
                filterOptions={filterOptions}
                loading={loading}
              />
            )}
    </>
  );
}

/* ---------------- WRAPPER ---------------- */
function SearchPageInner() {
  const params = useSearchParams();
  const query = params.get("q") || "";
  return <SearchContent query={query} />;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchPageInner />
    </Suspense>
  );
}
