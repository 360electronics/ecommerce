"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import SearchModal from "./SearchModal";

interface SearchProps {
  inputRef?: React.RefObject<HTMLInputElement>;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchProps> = ({
  inputRef,
  autoFocus = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const internalInputRef = useRef<HTMLInputElement>(null);
  const actualInputRef = inputRef || internalInputRef;

  const router = useRouter();

  /* ---------------- Recent Searches ---------------- */

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) setRecentSearches(JSON.parse(saved));
  }, []);

  const addToRecentSearches = useCallback((query: string) => {
    const updated = [
      query,
      ...recentSearches.filter((q) => q !== query),
    ].slice(0, 8);

    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  }, [recentSearches]);

  const removeRecentSearch = useCallback(
    (search: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const updated = recentSearches.filter((q) => q !== search);
      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
    },
    [recentSearches]
  );

  const clearAllRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  }, []);

  /* ---------------- Navigation ---------------- */

  const goToSearch = useCallback((query: string) => {
    const q = query.trim();
    if (!q) return;

    addToRecentSearches(q);
    setShowSearchModal(false);

    router.push(`/search?q=${encodeURIComponent(q)}`);
  }, [router, addToRecentSearches]);

  /* ---------------- Form Submit ---------------- */

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault(); // 🚨 PREVENT POST
      goToSearch(searchQuery);
    },
    [searchQuery, goToSearch]
  );

  /* ---------------- Autofocus ---------------- */

  useEffect(() => {
    if (autoFocus) actualInputRef.current?.focus();
  }, [autoFocus, actualInputRef]);

  return (
    <div className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center rounded-full border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-primary/30 transition"
      >
        {/* Search Input */}
        <input
          ref={actualInputRef}
          type="text"
          placeholder="Search for Products, Brands & More"
          className="w-full px-4 py-2.5 text-sm bg-transparent focus:outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowSearchModal(true)}
          autoComplete="off"
          aria-label="Search products"
        />

        {/* Search Button */}
        <button
          type="submit"
          className="flex items-center justify-center bg-primary text-white px-4 py-2.5 rounded-r-full"
          aria-label="Search"
        >
          <Search size={20} />
        </button>
      </form>

      {/* Search Modal */}
      {showSearchModal && (
        <SearchModal
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClose={() => setShowSearchModal(false)}
          recentSearches={recentSearches}
          clearAllRecentSearches={clearAllRecentSearches}
          removeRecentSearch={removeRecentSearch}
          handleSearchItemClick={goToSearch} // 🔑 single navigation path
        />
      )}
    </div>
  );
};

export default SearchBar;
