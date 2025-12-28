"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { X, Clock, TrendingUp, Loader2, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { debounce } from "lodash";
import { fetchQuickSuggestions } from "@/utils/products.util";
import Link from "next/link";

interface QuickSuggestion {
  id: string;
  title: string;
  image?: string;
  slug?: string;
  price?: string;
  description: string;
}

interface SearchModalProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClose: () => void;
  recentSearches: string[];
  clearAllRecentSearches: () => void;
  removeRecentSearch: (search: string, e: React.MouseEvent) => void;
  handleSearchItemClick: (search: string) => void; // Fixed: matches what SearchBar passes
}

const DEBOUNCE_DELAY = 250;

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
  const [suggestions, setSuggestions] = useState<QuickSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Extract unique suggestion keywords from product titles (starts with query)
  const keywordSuggestions = useMemo(() => {
    if (!searchQuery.trim() || suggestions.length === 0) return [];

    const lowerQuery = searchQuery.toLowerCase();
    const unique = new Set<string>();

    suggestions.forEach((item) => {
      const title = item.title.toLowerCase();
      if (
        title.startsWith(lowerQuery) &&
        item.title.toLowerCase() !== lowerQuery
      ) {
        unique.add(item.title);
      }
    });

    return Array.from(unique).slice(0, 6);
  }, [searchQuery, suggestions]);

  const trendingSearches = useMemo(
    () => [
      "MacBook Pro",
      "iPhone 16",
      "RTX 4090",
      "Gaming Chair",
      "SSD 2TB",
      "Mechanical Keyboard",
      "4K Monitor",
      "Wireless Mouse",
      "AirPods Pro",
      "Webcam",
    ],
    []
  );

  // Debounced fetch
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      try {
        setLoading(true);
        const results = await fetchQuickSuggestions(query);
        setSuggestions(results.slice(0, 10));
      } catch (err) {
        console.error("Search failed:", err);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_DELAY),
    []
  );

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const hasQuery = searchQuery.trim().length > 0;
  const showResults =
    hasQuery &&
    (loading || suggestions.length > 0 || keywordSuggestions.length > 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/30 md:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 md:inset-x-4 md:top-20 md:bottom-auto md:max-w-4xl md:mx-auto md:rounded-3xl bg-white shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands..."
              className="flex-1 text-base bg-transparent focus:outline-none placeholder-gray-500"
              onKeyDown={(e) =>
                e.key === "Enter" && handleSearchItemClick(searchQuery)
              }
            />
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 animate-pulse"
                  >
                    <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : showResults ? (
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                {/* Left: Keyword Suggestions */}
                {keywordSuggestions.length > 0 && (
                  <div className="p-5 md:p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                      Suggestions
                    </h3>
                    <div className="space-y-2">
                      {keywordSuggestions.map((suggestion, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => handleSearchItemClick(suggestion)}
                          className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-800"
                        >
                          <span className="font-medium">{searchQuery}</span>
                          <span className="text-gray-600">
                            {suggestion.slice(searchQuery.length)}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Right: Product Results */}
                <div className="p-5 md:p-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Products ({suggestions.length})
                  </h3>
                  <div className="space-y-3">
                    {suggestions.length > 0 ? (
                      suggestions.map((product, i) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          // onClick={() => handleSearchItemClick(product.title)}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
                        >
                          <Link href={`/product/${product.slug}` || "#"} onClick={onClose}>
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-16 h-16 object-contain rounded-lg bg-gray-50 shadow-sm"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Search className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {product.title}
                              </p>
                              {product.price && (
                                <p className="text-sm font-bold text-primary mt-1">
                                  ₹
                                  {parseFloat(product.price).toLocaleString(
                                    "en-IN"
                                  )}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {product.description}
                              </p>
                            </div>
                          </Link>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No products found for &quot;{searchQuery}&quot;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State: Recent + Trending */
              <div className="p-6 space-y-8">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Clock className="w-4 h-4" />
                        Recent Searches
                      </div>
                      <button
                        onClick={clearAllRecentSearches}
                        className="text-xs text-primary hover:underline"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((search, i) => (
                        <motion.button
                          key={i}
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full text-sm transition-colors"
                          onClick={() => handleSearchItemClick(search)}
                        >
                          {search}
                          <button
                            onClick={(e) => removeRecentSearch(search, e)}
                            className="ml-1 text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending */}
                <div>
                  <div className="flex items-center gap-2 mb-4 text-sm font-medium text-gray-700">
                    <TrendingUp className="w-4 h-4" />
                    Trending Now
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {trendingSearches.map((trend, i) => (
                      <motion.button
                        key={trend}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleSearchItemClick(trend)}
                        className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary/5 hover:to-primary/10 rounded-xl text-sm text-gray-700 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                      >
                        {trend}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SearchModal;
