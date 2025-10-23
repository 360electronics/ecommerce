"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductListing from "@/components/Listing/ProductListing";
import { CompleteProduct, FlattenedProduct } from "@/types/product";
import { fetchSearchProducts } from "@/utils/products.util";

const safeToISOString = (value: Date | string | null | undefined) => {
  if (!value) return new Date().toISOString();
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

const flattenProductVariants = (
  products: CompleteProduct[]
): FlattenedProduct[] => {
  const flattened: FlattenedProduct[] = [];

  products.forEach((product) => {
    // console.log(product.subcategory?.slug === 'ASUS MOTHERBOARD')
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      product.variants.forEach((variant) => {
        flattened.push({
          ...variant,
          id: variant.id,
          productId: product.id,
          category: product.category?.slug || "",
          subcategory: product.subcategory?.slug || "",
          brand: product.brand,
          status: product.status,
          averageRating: product.averageRating?.toString() || "0",
          tags: Array.isArray(product.tags)
            ? product.tags
            : typeof product.tags === "string"
            ? (product.tags as string)
                .split(",")
                .map((tag: string) => tag.trim())
            : [],
          totalStocks: variant.stock?.toString() || "0",
          createdAt: safeToISOString(variant.createdAt),
          updatedAt: safeToISOString(variant.updatedAt),
          color: variant.attributes?.color as string | undefined,
          storage: variant.attributes?.storage as string | undefined,
          description: product.description || "",
          productParent: product,
          material: variant.attributes?.material as string | undefined,
          mrp: variant.mrp?.toString() || "0",
          ourPrice: variant.ourPrice?.toString() || "0",
        } as unknown as FlattenedProduct);
      });
    } else {
      flattened.push({
        ...product,
        id: product.id,
        productId: product.id,
        name: product.shortName || "Unnamed Product",
        mrp: product.defaultVariant?.mrp?.toString() || "0",
        ourPrice: product.defaultVariant?.ourPrice?.toString() || "0",
        stock: product.totalStocks?.toString() || "0",
        slug: product.slug || "",
        sku: product.defaultVariant?.sku || "",
        tags: Array.isArray(product.tags)
          ? product.tags
          : typeof product.tags === "string"
          ? (product.tags as string).split(",").map((tag: string) => tag.trim())
          : [],
        createdAt: safeToISOString(product.createdAt),
        updatedAt: safeToISOString(product.updatedAt),
        category: product.category?.slug || "",
        subcategory: product.subcategory?.slug || "",
        brand: product.brand,
        status: product.status,
        averageRating: product.averageRating?.toString() || "0",
        totalStocks: product.totalStocks?.toString() || "0",
        description: product.description || "",
      } as unknown as FlattenedProduct);
    }
  });

  return flattened;
};
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

function SearchContent({
  products,
  loading,
  error,
  query,
}: {
  products: FlattenedProduct[];
  loading: boolean;
  error: string | null;
  query: string;
}) {
  if (loading) return <SearchLoading />;

  if (error)
    return (
      <div className="flex justify-center items-center min-h-[300px] text-red-500">
        {error}
      </div>
    );

  if (products.length === 0)
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🔍</div>
        <h3 className="text-xl font-medium mb-2">No results found</h3>
        <p className="text-gray-600">
          Try searching with a different keyword.
        </p>
      </div>
    );

  return (
    <div className="mx-auto pt-6">
      
      <ProductListing searchQuery={query} initialProducts={products} />
    </div>
  );
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState<FlattenedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!query.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data: CompleteProduct[] = await fetchSearchProducts(query);
        if (!mounted) return;
        setProducts(flattenProductVariants(data));
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load search results");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [query]);

  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent
        products={products}
        loading={loading}
        error={error}
        query={query}
      />
    </Suspense>
  );
}
