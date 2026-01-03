"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { X, Clock, TrendingUp, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import debounce from "lodash/debounce";
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
  handleSearchItemClick: (search: string) => void;
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<QuickSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- Autofocus ---------------- */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* ---------------- Escape key ---------------- */
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  /* ---------------- Debounced Suggestions ---------------- */
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
      } catch {
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

  /* ---------------- Keyword Suggestions ---------------- */
  const keywordSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const q = searchQuery.toLowerCase();
    const set = new Set<string>();

    suggestions.forEach((item) => {
      const title = item.title.toLowerCase();
      if (title.startsWith(q) && title !== q) {
        set.add(item.title);
      }
    });

    return Array.from(set).slice(0, 6);
  }, [searchQuery, suggestions]);

  const trendingSearches = [
    "MacBook Pro",
    "iPhone 16",
    "RTX 4090",
    "Gaming Chair",
    "SSD 2TB",
    "Mechanical Keyboard",
    "4K Monitor",
  ];

  const hasQuery = searchQuery.trim().length > 0;
  const showResults =
    hasQuery &&
    (loading || suggestions.length > 0 || keywordSuggestions.length > 0);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bottom-0 left-0 right-0 md:top-20 md:mx-auto md:max-w-4xl bg-white md:rounded-3xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center p-4 border-b">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands..."
              className="flex-1 text-base bg-transparent focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault(); // 🚨 CRITICAL
                  handleSearchItemClick(searchQuery);
                }
              }}
            />
            <button onClick={onClose} className="p-2">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 w-3/4 mb-2 rounded" />
                      <div className="h-3 bg-gray-200 w-1/2 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : showResults ? (
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                {/* Suggestions */}
                {keywordSuggestions.length > 0 && (
                  <div className="p-6">
                    <h3 className="text-sm font-semibold mb-3">Suggestions</h3>
                    {keywordSuggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSearchItemClick(s)}
                        className="block w-full text-left px-4 py-2 rounded hover:bg-gray-100"
                      >
                        <span className="font-medium">{searchQuery}</span>
                        <span className="text-gray-500">
                          {s.slice(searchQuery.length)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Products */}
                <div className="p-6">
                  <h3 className="text-sm font-semibold mb-3">
                    Products ({suggestions.length})
                  </h3>

                  {suggestions.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={onClose}
                      className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition"
                    >
                      {p.image ? (
                        <img
                          src={p.image}
                          alt={p.title}
                          className="w-16 h-16 object-contain rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{p.title}</p>
                        {p.price && (
                          <p className="text-primary font-bold">
                            ₹{Number(p.price).toLocaleString("en-IN")}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {p.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        Recent Searches
                      </span>
                      <button
                        onClick={clearAllRecentSearches}
                        className="text-xs text-primary"
                      >
                        Clear
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSearchItemClick(s)}
                          className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Trending
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {trendingSearches.map((t) => (
                      <button
                        key={t}
                        onClick={() => handleSearchItemClick(t)}
                        className="p-3 bg-gray-100 rounded-lg text-sm"
                      >
                        {t}
                      </button>
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
