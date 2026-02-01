"use client";

import React, { useMemo, memo } from "react";
import DynamicFilter from "@/components/Filter/DynamicFilter";
import ProductCard from "@/components/Product/ProductCards/ProductCardwithCart";
import { usePathname, useSearchParams } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";

const MemoCard = memo(ProductCard);

interface Props {
  category?: string;
  searchQuery?: string;
  products: any[];
  totalCount: number;
  filterOptions: any;
  pageSize: number;
  currentPage: number;
  loading: boolean;
}

type SortKey =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "newest";

export default function ProductListing({
  category,
  searchQuery,
  products,
  totalCount,
  filterOptions,
  pageSize,
  currentPage,
  loading,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalCount / pageSize);

  const sort = searchParams.get("sort") || "relevance";

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page"); // reset pagination on sort change

    window.history.replaceState({}, "", `${pathname}?${params.toString()}`);
  };

  /* ---------------- Filter handler (URL ONLY) ---------------- */
  const handleFilterChange = (filters: Record<string, any>) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v.toString().toLowerCase()));

        return;
      }

      if (typeof value === "object" && value?.min !== undefined) {
        params.set("minPrice", String(value.min));
        params.set("maxPrice", String(value.max));
        return;
      }

      params.set(key, String(value));
    });

    window.history.replaceState({}, "", `${pathname}?${params.toString()}`);
  };

  /* ---------------- Pagination ---------------- */
  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));

    window.history.replaceState({}, "", `${pathname}?${params}`);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ---------------- Header text ---------------- */
  const headerText = useMemo(() => {
    const parts = [`${totalCount} Products`];
    if (category)
      parts.push(
        `in ${DOMPurify.sanitize(category)
          .replace(/[-_]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase())}`,
      );
    if (searchQuery) parts.push(`for "${searchQuery}"`);
    return parts.join(" ");
  }, [totalCount, category, searchQuery]);

  if (loading) {
  return null; // ⛔ nothing renders while loading
}


  return (
    <div className="flex gap-6 pb-10">
      {/* FILTER */}
      <aside className="hidden md:block w-1/4">
        <DynamicFilter
          products={products}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
        />
      </aside>

      <main className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-medium">{headerText}</div>

          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="relevance">Relevance</option>
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Customer Rating</option>
          </select>
        </div>

        {/* TRUE empty state */}
        {totalCount === 0 && products.length === 0 ? (
          <div className="py-20 text-center">No products found</div>
        ) : (
          <>
            {/* Product grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <MemoCard
                  key={p.variantId} // ✅ stable
                  productId={p.productId}
                  variantId={p.variantId}
                  slug={p.slug}
                  name={p.name}
                  image={p.productImages?.[0]?.url}
                  ourPrice={+p.ourPrice}
                  mrp={+p.mrp}
                  rating={+p.averageRating}
                  status={p.status}
                  isHeartNeed
                  showViewDetails
                />
              ))}
            </div>

            {/* ✅ Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-10">
                <nav
                  className="inline-flex items-center gap-1 rounded-lg bg-white border border-gray-200 px-2 py-2"
                  aria-label="Pagination"
                >
                  {/* Prev */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-md cursor-pointer text-sm font-medium transition
          ${
            currentPage === 1
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }`}
                  >
                    Prev
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const page = i + 1;

                    // ✅ windowed pagination
                    if (
                      page !== 1 &&
                      page !== totalPages &&
                      Math.abs(page - currentPage) > 1
                    ) {
                      if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span
                            key={page}
                            className="px-2 text-gray-400 text-sm"
                          >
                            …
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        aria-current={page === currentPage ? "page" : undefined}
                        className={`px-3 py-1.5 rounded-md cursor-pointer text-sm font-medium transition
              ${
                page === currentPage
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  {/* Next */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-md cursor-pointer text-sm font-medium transition
          ${
            currentPage === totalPages
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }`}
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
