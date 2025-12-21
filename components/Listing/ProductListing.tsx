"use client";

import React, { useState, useEffect, useMemo, memo, useRef } from "react";
import DynamicFilter from "@/components/Filter/DynamicFilter";
import ProductCard from "@/components/Product/ProductCards/ProductCardwithCart";
import { usePathname, useSearchParams } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import debounce from "lodash/debounce";
import Fuse from "fuse.js";
import { FlattenedProduct } from "@/types/product";
import { getNormalizer } from "@/utils/normalisers";

const MemoizedProductCard = memo(ProductCard);

const ProductListing = ({
  category,
  searchQuery,
  initialProducts = [],
}: {
  category?: string;
  searchQuery?: string;
  initialProducts?: FlattenedProduct[];
}) => {
  const [originalProducts] = useState<FlattenedProduct[]>(initialProducts);

  const [filteredProducts, setFilteredProducts] = useState<FlattenedProduct[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(50);
  const [fuse, setFuse] = useState<Fuse<FlattenedProduct> | null>(null);
  const searchParams = useSearchParams();

  const pathname = usePathname();
  const isOfferZonePage = pathname?.includes("offer-zone");

  // console.log("Og Products", originalProducts)
  useEffect(() => {
    if (originalProducts.length > 0) {
      const fuseInstance = new Fuse(originalProducts, {
        keys: [
          {
            name: "name",
            weight: 0.5,
            getFn: (obj) => (obj.name || "").toLowerCase(),
          },
          {
            name: "brand.name",
            weight: 0.2,
            getFn: (obj) => (obj.brand?.name || "").toLowerCase(),
          },
          {
            name: "category.name",
            weight: 0.15,
            getFn: (obj) => (obj.category?.name || "").toLowerCase(),
          },
          {
            name: "subcategory.name",
            weight: 0.15,
            getFn: (obj) => (obj.subcategory?.name || "").toLowerCase(),
          },
        ],
        threshold: 0.3,
        minMatchCharLength: 2,
        ignoreLocation: true,
        shouldSort: true,
        includeScore: true,
        useExtendedSearch: true,
      });

      setFuse(fuseInstance);
    }
  }, [originalProducts]);

  // Get subcategory from URL params
  const subcategory = searchParams.get("subcategory");

  // Memoized debounced filter function
  const debouncedApplyFilters = useMemo(
    () =>
      debounce(
        (
          productsList: FlattenedProduct[],
          filters: Record<string, any>,
          sortOpt: string,
          query: string
        ) => {
          let filtered = [...productsList];

          const isOfferZone = pathname?.includes("offer-zone");

          // Only apply category/subcategory filters if NOT Offer Zone
          if (!isOfferZone) {
            if (category && category.toLowerCase() !== "all") {
              filtered = filtered.filter(
                (product) =>
                  product.category &&
                  (product.category as unknown as string).toLowerCase() ===
                    category.toLowerCase()
              );
            }

            if (subcategory && subcategory.toLowerCase() !== "all") {
              filtered = filtered.filter(
                (product) =>
                  product.subcategory &&
                  (product.subcategory as unknown as string).toLowerCase() ===
                    subcategory.toLowerCase()
              );
            }

            // Apply status filter for normal pages
            filtered = filtered.filter(
              (product) =>
                product.status &&
                ["active", "coming_soon"].includes(
                  product.status.trim().toLowerCase()
                )
            );
          }

          // Apply search query filter (Fuse.js or fallback) as usual
          if (query?.trim()) {
            const lowerQuery = query.trim().toLowerCase();
            const words = lowerQuery.split(/\s+/);
            let results: FlattenedProduct[] = [];

            if (fuse && words.length > 0) {
              const resultSets = words.map(
                (word) =>
                  new Set(fuse.search(`'${word}`).map((r) => r.refIndex))
              );

              let commonIndices = resultSets.reduce((a, b) => {
                return new Set([...a].filter((x) => b.has(x)));
              }, resultSets[0]);

              if (commonIndices.size === 0 && words.length > 1) {
                // Fallback to OR
                commonIndices = new Set(
                  words.flatMap((word) =>
                    fuse.search(`'${word}`).map((r) => r.refIndex)
                  )
                );
              }

              const resultsWithScores = [...commonIndices].map((index) => {
                const scores = words.map((word) => {
                  const res = fuse
                    .search(`'${word}`)
                    .find((r) => r.refIndex === index);
                  return res ? res.score ?? 1 : 1;
                });
                const avgScore =
                  scores.reduce((s, c) => s + c, 0) / scores.length;
                return { item: originalProducts[index], score: avgScore };
              });

              resultsWithScores.sort((a, b) => a.score - b.score); // Lower score is better
              results = resultsWithScores.map((r) => r.item);
            }

            // Fallback if Fuse fails
            if (results.length === 0) {
              const textGetter = (p: FlattenedProduct) =>
                [
                  (p.name || "").toLowerCase(),
                  (p.brand?.name || "").toLowerCase(),
                  (p.category?.name || "").toLowerCase(),
                  (p.subcategory?.name || "").toLowerCase(),
                ].join(" ");

              results = productsList.filter((p) =>
                words.every((word) => textGetter(p).includes(word))
              );

              if (results.length === 0 && words.length > 1) {
                results = productsList.filter((p) =>
                  words.some((word) => textGetter(p).includes(word))
                );
              }
            }

            filtered = results;
          }

          // Apply other dynamic filters (color, brand, rating, inStock, etc.) as usual
          Object.keys(filters).forEach((key) => {
            if (key === "color" && filters.color?.length > 0) {
              filtered = filtered.filter(
                (p) => p.color && filters.color.includes(p.color)
              );
            }
            if (key === "brand" && filters.brand?.length > 0) {
              filtered = filtered.filter(
                (p) => p.brand && filters.brand.includes(p.brand.name)
              );
            }
            if (key === "storage" && filters.storage?.length > 0) {
              filtered = filtered.filter(
                (p) => p.storage && filters.storage.includes(p.storage)
              );
            }
            if (key === "rating" && filters.rating?.length > 0) {
              const minRating = Math.min(
                ...filters.rating.map((r: string) => parseInt(r))
              );
              filtered = filtered.filter(
                (p) => (Number(p.averageRating) || 0) >= minRating
              );
            }
            if (key === "inStock" && filters.inStock) {
              filtered = filtered.filter((p) => Number(p.totalStocks) > 0);
            }
            if (
              key === "ourPrice" &&
              filters.ourPrice &&
              typeof filters.ourPrice === "object" &&
              "min" in filters.ourPrice &&
              "max" in filters.ourPrice
            ) {
              const { min: priceMin, max: priceMax } = filters.ourPrice;
              filtered = filtered.filter((p) => {
                const price = Number(p.ourPrice) || 0;
                return price >= priceMin && price <= priceMax;
              });
            }
            // Dynamic attributes
            if (
              ![
                "color",
                "brand",
                "storage",
                "rating",
                "inStock",
                "ourPrice",
                "category",
              ].includes(key) &&
              Array.isArray(filters[key])
            ) {
              const normalizer = getNormalizer(key);

              // Normalize incoming filter values
              const normalizedFilters = filters[key].map((val) =>
                normalizer(val).toLowerCase()
              );

              // Filter products using normalized product values
              filtered = filtered.filter((product) => {
                const val = product.attributes?.[key];
                if (!val) return false;
                const normVal = normalizer(val as string).toLowerCase();
                return normalizedFilters
                  .map((v) => v.toLowerCase())
                  .includes(normVal);
              });
            }
          });

          // Sorting
          switch (sortOpt.toLowerCase()) {
            case "ourprice-low-high":
              filtered.sort(
                (a, b) => (Number(a.ourPrice) || 0) - (Number(b.ourPrice) || 0)
              );
              break;
            case "ourprice-high-low":
              filtered.sort(
                (a, b) => (Number(b.ourPrice) || 0) - (Number(a.ourPrice) || 0)
              );
              break;
            case "featured":
            default:
              break;
          }

          console.log("Fiterd Products: " ,filtered)

          setFilteredProducts(filtered);
          setLoading(false);
          setCurrentPage(1);
        },
        300
      ),
    [category, subcategory, searchQuery, fuse, pathname]
  );

  useEffect(() => {
    return () => {
      debouncedApplyFilters.cancel();
    };
  }, [debouncedApplyFilters]);

  // Compute filter options based on ALL products, not just filtered ones
  const filterOptions = useMemo(() => {
    const options = {
      colors: new Set<string>(),
      brands: new Set<string>(),
      storageOptions: new Set<string>(),
      minPrice: Infinity,
      maxPrice: 0,
      attributes: {} as { [key: string]: Set<string> },
    };

    // Use originalProducts for filter options to show all available options
    let productsForOptions = originalProducts;

    // If we have category/subcategory filters, apply them to get relevant filter options
    if (category && category.toLowerCase() !== "all") {
      productsForOptions = productsForOptions.filter(
        (product) =>
          product.category &&
          (product.category as unknown as string).toLowerCase() ===
            category.toLowerCase()
      );
    }

    if (subcategory && subcategory.toLowerCase() !== "all") {
      productsForOptions = productsForOptions.filter(
        (product) =>
          product.subcategory &&
          (product.subcategory as unknown as string).toLowerCase() ===
            subcategory.toLowerCase()
      );
    }

    productsForOptions.forEach((product) => {
      if (product.color) options.colors.add(product.color);
      if (product.brand?.name) {
        // console.log("ADDING BRAND:", product.brand.name);
        options.brands.add(product.brand.name);
      }
      if (product.storage) options.storageOptions.add(product.storage);
      const price = Number(product.ourPrice) || 0;
      if (price > 0) {
        options.minPrice = Math.min(options.minPrice, price);
        options.maxPrice = Math.max(options.maxPrice, price);
      }

      // Process dynamic attributes
      if (product.attributes) {
        Object.entries(product.attributes).forEach(([key, value]) => {
          if (typeof value === "string" && value.trim()) {
            const normalizer = getNormalizer(key);
            const normalizedValue = normalizer(value);

            if (!options.attributes[key]) {
              options.attributes[key] = new Set<string>();
            }

            options.attributes[key].add(normalizedValue);
          }
        });
      }
    });

    return {
      colors: Array.from(options.colors).sort(),
      brands: Array.from(options.brands).sort(),
      storageOptions: Array.from(options.storageOptions).sort(),
      priceRange: {
        min: options.minPrice === Infinity ? 0 : Math.floor(options.minPrice),
        max: options.maxPrice === 0 ? 1000 : Math.ceil(options.maxPrice),
      },
      attributes: Object.fromEntries(
        Object.entries(options.attributes).map(([key, valueSet]) => [
          key,
          Array.from(valueSet).sort(),
        ])
      ),
    };
  }, [originalProducts, category, subcategory]);

  // Apply filters when dependencies change
  useEffect(() => {
    // console.log('Search query:', searchQuery);
    if (originalProducts.length === 0) return;

    const filters: Record<string, any> = {};
    // console.log('Applied filters:', filters);

    const minPriceParam = searchParams.get("minPrice");
    const maxPriceParam = searchParams.get("maxPrice");
    if (minPriceParam !== null || maxPriceParam !== null) {
      filters.ourPrice = {
        min: minPriceParam ? parseFloat(minPriceParam) : 0,
        max: maxPriceParam
          ? parseFloat(maxPriceParam)
          : filterOptions.priceRange.max,
      };
    }

    const possibleFilters = [
      "color",
      "brand",
      "category",
      "rating",
      "storage",
      ...Object.keys(filterOptions.attributes),
    ];
    possibleFilters.forEach((filter) => {
      const values = searchParams.getAll(filter);
      if (values.length > 0) {
        filters[filter] = values;
      }
    });

    if (searchParams.get("inStock") === "true") {
      filters.inStock = true;
    }

    debouncedApplyFilters(
      originalProducts,
      filters,
      sortOption,
      searchQuery || ""
    );
  }, [
    searchParams,
    sortOption,
    originalProducts,
    filterOptions,
    debouncedApplyFilters,
    searchQuery,
    category,
    subcategory,
  ]);

  const displayedProducts = useMemo(() => {
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    return filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  }, [currentPage, filteredProducts, productsPerPage]);

  const handleFilterChange = (filters: Record<string, any>) => {
    debouncedApplyFilters(
      originalProducts,
      filters,
      sortOption,
      searchQuery || ""
    );
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxButtons = 5;

    buttons.push(
      <button
        key="first"
        onClick={() => handlePageChange(1)}
        className={`px-3 py-1 mx-1 rounded ${
          currentPage === 1
            ? "bg-primary text-white"
            : "bg-gray-200 hover:bg-gray-300"
        }`}
        disabled={currentPage === 1}
        aria-label="Go to first page"
      >
        1
      </button>
    );

    let startPage = Math.max(2, currentPage - Math.floor(maxButtons / 2));
    const endPage = Math.min(totalPages - 1, startPage + maxButtons - 3);

    if (endPage - startPage < maxButtons - 3) {
      startPage = Math.max(2, endPage - (maxButtons - 3) + 1);
    }

    if (startPage > 2) {
      buttons.push(
        <span key="ellipsis1" className="px-2" aria-hidden="true">
          ...
        </span>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === i
              ? "bg-blue-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          aria-label={`Go to page ${i}`}
          aria-current={currentPage === i ? "page" : undefined}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages - 1) {
      buttons.push(
        <span key="ellipsis2" className="px-2" aria-hidden="true">
          ...
        </span>
      );
    }

    if (totalPages > 1) {
      buttons.push(
        <button
          key="last"
          onClick={() => handlePageChange(totalPages)}
          className={`px-3 py-1 mx-1 rounded ${
            currentPage === totalPages
              ? "bg-blue-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          disabled={currentPage === totalPages}
          aria-label={`Go to last page, page ${totalPages}`}
        >
          {totalPages}
        </button>
      );
    }

    return buttons;
  };

  // Helper function to get display text for category/subcategory
  const formatText = (text: string) => {
    if (!text) return "";

    return text
      .replace(/[-_]/g, " ") // replace hyphens/underscores with spaces
      .toLowerCase() // make all lowercase first
      .replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize first letter of each word
  };

  const getDisplayText = () => {
    const parts = [];
    if (filteredProducts.length > 0) {
      parts.push(
        `${filteredProducts.length} ${
          filteredProducts.length === 1 ? "Product" : "Products"
        }`
      );
    }

    if (category && category !== "all") {
      parts.push(`in ${formatText(DOMPurify.sanitize(category))}`);
    }

    if (subcategory && subcategory !== "all") {
      parts.push(`> ${formatText(DOMPurify.sanitize(subcategory))}`);
    }

    if (searchQuery?.trim()) {
      parts.push(`for "${formatText(DOMPurify.sanitize(searchQuery))}"`);
    }

    return parts.join(" ");
  };

  const asideRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current && asideRef.current) {
      const mainHeight = mainRef.current.offsetHeight;
      asideRef.current.style.maxHeight = `${mainHeight}px`;
    }
  }, [filteredProducts, currentPage, loading, error, sortOption, searchParams]);

  return (
    <div className="mx-auto" role="main">
      <div className="flex flex-col md:flex-row gap-6">
        {!loading && filteredProducts.length > 0 && (
          <aside
            ref={asideRef}
            className="w-full md:w-1/4 flex overflow-y-auto"
          >
            <DynamicFilter
              products={filteredProducts}
              category={category}
              onFilterChange={handleFilterChange}
              filterOptions={filterOptions}
            />
            <div className="items-center flex md:hidden justify-center text-center w-full">
              <select
                id="sort"
                className="text-sm border-y border-r w-full border-gray-300 text-center flex items-center justify-center p-3.5 md:p-4 focus:outline-none focus:ring-2 focus:ring-primary"
                value={sortOption}
                onChange={handleSortChange}
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="ourprice-low-high">Price: Low to High</option>
                <option value="ourprice-high-low">Price: High to Low</option>
              </select>
            </div>
          </aside>
        )}

        <main
          ref={mainRef}
          className={`w-full ${
            filteredProducts.length > 0 ? "md:w-3/4" : "md:w-full"
          }`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:pb-4 border-b border-gray-200">
            <div className="text-sm md:text-lg font-medium text-gray-800 mb-4 sm:mb-0">
              {getDisplayText()}
            </div>

            <div className="items-center hidden md:flex">
              <label htmlFor="sort" className="text-sm text-gray-600 mr-2">
                Sort by:
              </label>
              <select
                id="sort"
                className="text-sm border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={sortOption}
                onChange={handleSortChange}
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="ourprice-low-high">Price: Low to High</option>
                <option value="ourprice-high-low">Price: High to Low</option>
              </select>
            </div>
          </div>

          {error ? (
            <div
              className="flex flex-col items-center justify-center min-h-[400px] text-center"
              role="alert"
            >
              <h3 className="text-xl font-medium text-red-600 mb-2">{error}</h3>
              <button
                onClick={() => {
                  setError(null);
                  // Retry logic would need to be implemented here
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left: Filter Sidebar Skeleton */}
              <aside className="w-full md:w-1/4 bg-white rounded-lg border animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="mb-4">
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
                <div className="h-10 bg-gray-200 rounded mt-6"></div>
              </aside>

              {/* Right: Product Cards Skeleton */}
              <main className="w-full md:w-3/4">
                <div className="grid grid-cols-2 md:grid-cols-3 mb-6 pb-4 border-b border-gray-200">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
                  <div className="hidden md:flex items-center gap-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>

                <div
                  className="grid grid-cols-2 lg:grid-cols-3 gap-6"
                  aria-live="polite"
                >
                  {[...Array(9)].map((_, index) => (
                    <div
                      key={index}
                      className="bg-white p-4 rounded-lg border  animate-pulse"
                    >
                      <div className="bg-gray-200 h-48 w-full rounded mb-4"></div>
                      <div className="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
                      <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
                    </div>
                  ))}
                </div>
              </main>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center min-h-[400px] text-center"
              aria-live="polite"
            >
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">
                No products found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters or search query to find what
                you&apos;re looking for.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {displayedProducts.map((product, index) => (
                  <MemoizedProductCard
                    productId={product.productId}
                    variantId={product.id}
                    key={index}
                    slug={product.slug}
                    name={product.name}
                    status={product.status}
                    image={
                      Array.isArray(product.productImages) &&
                      product.productImages.length > 0
                        ? product.productImages?.[0]?.url
                        : "/placeholder.svg"
                    }
                    ourPrice={Number(product.ourPrice) || 0}
                    mrp={Number(product.mrp) || 0}
                    rating={Number(product.averageRating) || 0}
                    discount={
                      product.mrp && product.ourPrice
                        ? Math.round(
                            ((Number(product.mrp) - Number(product.ourPrice)) /
                              Number(product.mrp)) *
                              100
                          )
                        : 0
                    }
                    showViewDetails={true}
                    isHeartNeed={true}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav
                  className="flex justify-center items-center mt-8"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300"
                    aria-label="Previous page"
                  >
                    prev
                  </button>

                  {renderPaginationButtons()}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 mx-1 rounded bg-gray-200 disabled:opacity-50 hover:bg-gray-300"
                    aria-label="Next page"
                  >
                    next
                  </button>
                </nav>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListing;
