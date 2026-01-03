"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductListing from "@/components/Listing/ProductListing";

async function fetchOfferZone(params: URLSearchParams, signal?: AbortSignal) {
  const res = await fetch(`/api/offer-zone?${params.toString()}`, {
    cache: "no-store",
    signal,
  });

  if (!res.ok) throw new Error("Offer zone failed");
  return res.json();
}

const OfferZoneLoading = () => (
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

function OfferZoneContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page") || 1);

  const [products, setProducts] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(12);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    const params = new URLSearchParams(searchParams.toString());

    fetchOfferZone(params, controller.signal)
      .then((res) => {
        const mapped = res.data.map((row: any) => ({
          id: row.variant_id,
          productId: row.product_id,
          variantId: row.variant_id,
          name: row.short_name,
          slug: row.slug,
          mrp: String(row.mrp),
          ourPrice: String(row.our_price),
          totalStocks: String(row.stock),
          averageRating: String(row.average_rating),
          brand: row.brand_id
            ? { id: row.brand_id, name: row.brand_name }
            : null,
          productImages: row.image ? [{ url: row.image }] : [],
          status: "active",
        }));

        setProducts(mapped);
        setTotalCount(res.totalCount);
        setPageSize(res.pageSize);
        setFilterOptions(res.filterOptions);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [searchParams]);

  if (loading) return <OfferZoneLoading />;

  return (
    <ProductListing
      category="offer-zone"
      products={products}
      totalCount={totalCount}
      pageSize={pageSize}
      currentPage={page}
      filterOptions={filterOptions}
    />
  );
}

export default function OfferZonePage() {
  return (
    <Suspense fallback={<OfferZoneLoading />}>
      <OfferZoneContent />
    </Suspense>
  );
}
