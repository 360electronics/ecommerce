"use client";

import React, { useState, useEffect, Suspense } from "react";
import UserLayout from "@/components/Layouts/UserLayout";
import ProductListing from "@/components/Listing/ProductListing";
import { CompleteProduct, FlattenedProduct } from "@/types/product";
import { fetchOfferZoneProducts } from "@/utils/products.util";

/* -------------------------- Helper: Safe Date Conversion -------------------------- */
const safeToISOString = (dateValue: Date | string | undefined | null): string => {
  if (!dateValue) return new Date().toISOString();
  if (dateValue instanceof Date) return dateValue.toISOString();
  const parsed = new Date(dateValue);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

/* -------------------------- Flatten Function -------------------------- */
const flattenOfferZoneProducts = (offerItems: any[]): FlattenedProduct[] => {
  return offerItems.map((item) => {
    const { product, variant } = item;
    return {
      id: variant?.id || product?.id,
      productId: product?.id,
      name:
        variant?.name ||
        product?.shortName ||
        product?.fullName ||
        "Unnamed Product",
      slug: variant?.slug || product?.slug || "",
      sku: variant?.sku || "",
      mrp: variant?.mrp?.toString() || "0",
      ourPrice: variant?.ourPrice?.toString() || "0",
      stock: variant?.stock?.toString() || "0",
      category: product?.category?.slug || "",
      subcategory: product?.subcategory?.slug || "",
      brand: product?.brand || "",
      averageRating: product?.averageRating?.toString() || "0",
      totalStocks: variant?.stock?.toString() || "0",
      description: product?.description || "",
      createdAt: safeToISOString(variant?.createdAt || product?.createdAt),
      updatedAt: safeToISOString(variant?.updatedAt || product?.updatedAt),
      color: variant?.attributes?.color,
      storage: variant?.attributes?.Storage,
      material: variant?.attributes?.material,
      productParent: product,
      productImages: variant?.productImages || product?.productImages || [],
      tags: Array.isArray(product?.tags)
        ? product.tags
        : typeof product?.tags === "string"
        ? product.tags.split(",").map((t: string) => t.trim())
        : [],
    } as FlattenedProduct;
  });
};

/* -------------------------- Loading Skeleton -------------------------- */
const OfferZoneLoading = () => (
  <UserLayout>
    <div className="mx-auto ">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Filter Sidebar Skeleton (25%) */}
        <div className="w-full md:w-1/4 bg-white p-4 rounded-lg border animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mb-4">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
          <div className="h-10 bg-gray-200 rounded mt-6"></div>
        </div>

        {/* Right: Product Grid Skeleton (75%) */}
        <div className="w-full md:w-3/4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3  gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-4 rounded-lg  animate-pulse border"
              >
                <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </UserLayout>
);

/* -------------------------- Page Content -------------------------- */
function OfferZoneContent({
  initialProducts,
  loading,
  error,
}: {
  initialProducts: FlattenedProduct[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) return <OfferZoneLoading />;

  if (error) {
    return (
      <UserLayout>
        <div className="mx-auto pt-10 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-xl font-medium text-red-600 mb-3">{error}</h3>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="mx-auto pt-4 pb-10">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          🎉 Offer Zone — Exclusive Deals & Discounts
        </h1>
        <ProductListing
          searchQuery=""
          initialProducts={initialProducts}
          category="offer-zone"
        />
      </div>
    </UserLayout>
  );
}

/* -------------------------- Offer Zone Page -------------------------- */
export default function OfferZonePage() {
  const [initialProducts, setInitialProducts] = useState<FlattenedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        setLoading(true);
        const offerZoneData = await fetchOfferZoneProducts();
        const flattened = flattenOfferZoneProducts(offerZoneData);
        setInitialProducts(flattened);
      } catch (err) {
        console.error("Error fetching offer zone products:", err);
        setError("Failed to load offer zone products");
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, []);

  return (
    <Suspense fallback={<OfferZoneLoading />}>
      <OfferZoneContent
        initialProducts={initialProducts}
        loading={loading}
        error={error}
      />
    </Suspense>
  );
}
