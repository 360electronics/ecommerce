"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Clock, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import { fetchSearchProducts } from "@/utils/products.util";

interface SearchModalProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClose: () => void;
  recentSearches: string[];
  clearAllRecentSearches: () => void;
  removeRecentSearch: (search: string, e: React.MouseEvent) => void;
  handleSearchItemClick: (search: string) => void;
}

interface Product {
  id: string;
  shortName?: string;
  fullName?: string;
  description: string;
  variants: {
    productImages: Array<{ url: string; alt: string }>;
    ourPrice?: string;
  }[];
}

const CACHE_KEY = "search-products-cache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms

const SearchModal: React.FC<SearchModalProps> = ({
  searchQuery,
  setSearchQuery,
  onClose,
  recentSearches,
  clearAllRecentSearches,
  removeRecentSearch,
  handleSearchItemClick,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [fuse, setFuse] = useState<Fuse<Product> | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Helper to get cached products
  const getCachedProducts = useCallback((): Product[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return data;
    } catch {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  }, []);

  // Helper to cache products
  const cacheProducts = useCallback((products: Product[]) => {
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ data: products, timestamp: Date.now() })
      );
    } catch {
      // Ignore cache errors (e.g., storage quota)
    }
  }, []);

  // Load products (from cache or API)
  const loadProducts = useCallback(async (forceFetch = false) => {
    if (loading || (allProducts.length > 0 && !forceFetch)) return;

    const cached = getCachedProducts();
    if (cached && !forceFetch) {
      setAllProducts(cached);
      setHasLoaded(true);
      return;
    }

    try {
      setLoading(true);
      const results = await fetchSearchProducts('');
      const products = Array.isArray(results) ? results : [];
      setAllProducts(products);
      cacheProducts(products);
      setHasLoaded(true);
    } catch (err) {
      console.error("Failed to load products:", err);
      setAllProducts([]);
      // Optional: Fall back to debounced API for searches in this session
    } finally {
      setLoading(false);
    }
  }, [loading, allProducts.length, getCachedProducts, cacheProducts]);

  // Trigger load on first search (or force if needed)
  useEffect(() => {
    if (searchQuery.trim() && !hasLoaded) {
      loadProducts();
    }
  }, [searchQuery, hasLoaded, loadProducts]);

  // Initialize Fuse.js on loaded products (only name fields for lighter index)
  useEffect(() => {
    if (allProducts.length > 0 && searchQuery.trim()) {
      const fuseInstance = new Fuse(allProducts, {
        keys: [
          { name: "shortName", weight: 0.6 },
          { name: "fullName", weight: 0.4 },
          // Exclude description from index to save memory/CPU; use it only for display
        ],
        threshold: 0.35,
        includeScore: true,
        ignoreLocation: true,
      });
      setFuse(fuseInstance);
    } else if (!searchQuery.trim()) {
      setFuse(null);
    }
  }, [allProducts, searchQuery]);

  // Derive ranked results (now capped early)
  const searchResults = (() => {
    if (!fuse || !searchQuery.trim()) return [];

    const results = fuse.search(searchQuery);
    // Already limited by Fuse's `limit`, but sort explicitly
    return results.sort((a, b) => (a.score || 0) - (b.score || 0));
  })();

  // Suggestions: Full product titles that start with the query
  const suggestions = Array.from(
    new Set<string>(
      searchResults
        .slice(0, 5)
        .map((res) => {
          const title = res.item.shortName || res.item.fullName || "";
          return title.toLowerCase().startsWith(searchQuery.toLowerCase()) &&
            title.toLowerCase() !== searchQuery.toLowerCase()
            ? title
            : null;
        })
        .filter((t): t is string => !!t)
    )
  ).slice(0, 5);

  const trendingSearches = [
    "MacBook",
    "White Keyboard",
    "Asus Laptop",
    "Gaming Headphone",
    "Gaming Chair",
    "Mouse Pad",
    "HP Mouse",
    "Acer ALG",
    "Dell Laptop",
    "Monitor",
  ];

  // Show loading if searching but not ready
  const isSearching = searchQuery.trim() && (loading || !hasLoaded);

  return (
    <AnimatePresence>
      {true && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-white md:bg-black/80 flex justify-center items-start md:items-center"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            ref={modalRef}
            className="w-full md:w-[800px] md:rounded-xl md:shadow-2xl bg-white overflow-hidden"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center border-b border-gray-200 p-4">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search for Products, Brands & More"
                className="flex-grow text-sm focus:outline-none placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearchItemClick(searchQuery);
                }}
              />
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {isSearching ? (
                <p className="text-sm text-gray-500">Loading products...</p>
              ) : searchQuery ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Suggestions */}
                  <div>
                    <h3 className="font-medium text-sm mb-3 text-gray-700">Suggestions</h3>
                    <ul className="space-y-2">
                      {suggestions.length > 0 ? (
                        suggestions.map((title, i) => (
                          <li key={i}>
                            <button
                              onClick={() => handleSearchItemClick(title)}
                              className="w-full text-left text-sm text-gray-700 hover:bg-gray-100 rounded px-3 py-2 transition-colors"
                            >
                              {title}
                            </button>
                          </li>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No suggestions found.</p>
                      )}
                    </ul>
                  </div>

                  {/* Ranked Products */}
                  <div>
                    <h3 className="font-medium text-sm mb-3 text-gray-700">Matching Products</h3>
                    {searchResults.length > 0 ? (
                      searchResults.slice(0, 6).map(({ item: product }) => (
                        <div
                          key={product.id}
                          className="flex items-center bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() =>
                            handleSearchItemClick(product.shortName || product.fullName || "")
                          }
                        >
                          {product.variants?.[0]?.productImages?.[0]?.url ? (
                            <img
                              src={product.variants[0].productImages[0].url}
                              alt={product.shortName || product.fullName || "Product"}
                              loading="eager"
                              className="w-16 h-16 object-contain mr-4"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 mr-4 rounded flex items-center justify-center text-xs text-gray-400">
                              No Image
                            </div>
                          )}
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {product.shortName || product.fullName}
                            </p>
                            {product.variants?.[0]?.ourPrice && (
                              <p className="text-sm font-semibold text-gray-700">
                                ₹{parseFloat(product.variants[0].ourPrice).toLocaleString("en-IN")}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {product.description}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No products found.</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Recent + Trending (unaffected by loading) */}
                  {recentSearches.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-gray-700">
                          <Clock size={16} className="mr-2" />
                          <span className="font-medium text-sm">Recent Searches</span>
                        </div>
                        <button
                          onClick={clearAllRecentSearches}
                          className="text-sm text-primary hover:text-primary-hover"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search, i) => (
                          <button
                            key={i}
                            className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                            onClick={() => handleSearchItemClick(search)}
                          >
                            {search}
                            <button
                              onClick={(e) => removeRecentSearch(search, e)}
                              className="ml-2 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-300"
                            >
                              <X size={14} />
                            </button>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center mb-3 text-gray-700">
                      <TrendingUp size={16} className="mr-2" />
                      <span className="font-medium text-sm">Trending Searches</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trendingSearches.map((search, i) => (
                        <button
                          key={i}
                          className="bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
                          onClick={() => handleSearchItemClick(search)}
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;