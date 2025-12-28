"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import SearchModal from "./SearchModal";

interface SearchProps {
  onSearch?: (query: string, category: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchProps> = ({
  onSearch,
  inputRef,
  autoFocus = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [category, setCategory] = useState<string>("All Categories");
  const [showCategories, setShowCategories] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const internalInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const actualInputRef = inputRef || internalInputRef;

  const categories = [
    "All Categories",
    "Laptops",
    "Monitors",
    "Processor",
    "Graphics Card",
    "Accessories",
    "Storage",
    "Cabinets",
  ];

  // Load recent searches once
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Auto-focus support
  useEffect(() => {
    if (autoFocus && actualInputRef.current) {
      actualInputRef.current.focus();
    }
  }, [autoFocus]);

  // Click outside to close category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategories(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigateToSearch = useCallback((query: string, selectedCategory: string) => {
    const params = new URLSearchParams();
    if (query.trim()) params.append("q", query.trim());
    if (selectedCategory !== "All Categories") params.append("category", selectedCategory);
    router.push(`/search?${params.toString()}`);
  }, [router]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    navigateToSearch(query, category);
    addToRecentSearches(query);
    setShowSearchModal(false);
  }, [searchQuery, category, navigateToSearch]);

  const addToRecentSearches = useCallback((query: string) => {
    const updated = [
      query,
      ...recentSearches.filter((item) => item !== query),
    ].slice(0, 8); // Increased to 8 for better UX
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  }, [recentSearches]);

  const handleSearchItemClick = useCallback((search: string) => {
    setSearchQuery(search);
    addToRecentSearches(search);
    navigateToSearch(search, category);
    setShowSearchModal(false);
  }, [category, navigateToSearch, addToRecentSearches]);

  const removeRecentSearch = useCallback((search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter((item) => item !== search);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  }, [recentSearches]);

  const clearAllRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  }, []);

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setShowCategories(false);
  };

  return (
    <div className="relative w-full sm:px-4 md:px-6">
      <form
        onSubmit={handleSearch}
        className="flex w-full items-center rounded-full border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all duration-200 "
      >
        {/* Category Dropdown - Kept exactly as your original (commented but ready to enable) */}
        {/* <div ref={categoryDropdownRef} className="relative hidden md:block">
          <button
            type="button"
            className="flex items-center justify-between cursor-pointer bg-primary px-3 py-2.5 text-sm text-white rounded-l-full transition-colors"
            onClick={() => setShowCategories(!showCategories)}
            aria-haspopup="listbox"
            aria-expanded={showCategories}
          >
            <span className="truncate max-w-[120px] md:max-w-[150px]">{category}</span>
            <ChevronDown size={16} className="ml-2" />
          </button>
          {showCategories && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => handleCategorySelect(cat)}
                  role="option"
                  aria-selected={category === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div> */}

        {/* Search Input - Exact original padding and styling */}
        <div className="relative flex-1">
          <input
            ref={actualInputRef}
            type="text"
            placeholder="Search for Products, Brands & More"
            className="w-full px-4 py-2.5 text-xs md:text-sm bg-transparent focus:outline-none placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchModal(true)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(e)}
            aria-label="Search products"
            autoComplete="off"
          />
        </div>

        {/* Search Button - Exact original design */}
        <button
          type="submit"
          className="flex items-center justify-center bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-r-full transition-colors duration-200"
          aria-label="Search"
        >
          <Search size={20} />
        </button>
      </form>

      {/* Search Modal - Opens instantly on focus */}
      {showSearchModal && (
        <SearchModal
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onClose={() => setShowSearchModal(false)}
          recentSearches={recentSearches}
          clearAllRecentSearches={clearAllRecentSearches}
          removeRecentSearch={removeRecentSearch}
          handleSearchItemClick={handleSearchItemClick}
        />
      )}
    </div>
  );
};

export default SearchBar;