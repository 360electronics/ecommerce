import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import SearchModal from './SearchModal';

interface SearchProps {
  onSearch?: (query: string, category: string) => void;
  isMobile?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchProps> = ({
  onSearch,
  inputRef,
  autoFocus = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [category, setCategory] = useState<string>('All Categories');
  const [showCategories, setShowCategories] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const actualInputRef = inputRef || internalInputRef;

  const categories = [
    'All Categories',
    'Laptops',
    'Monitors',
    'Processor',
    'Graphics Card',
    'Accessories',
    'Storage',
    'Cabinets',
  ];

  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  useEffect(() => {
    if (autoFocus && actualInputRef.current) {
      actualInputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategories(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateToSearch = (query: string, selectedCategory: string) => {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.append('q', query.trim());
    }
    if (selectedCategory !== 'All Categories') {
      params.append('category', selectedCategory);
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToRecentSearches(searchQuery);
      if (onSearch) {
        onSearch(searchQuery, category);
      }
      navigateToSearch(searchQuery, category);
      setShowSearchModal(false);
    }
  };

  const addToRecentSearches = (query: string) => {
    const updatedSearches = [
      query,
      ...recentSearches.filter((item) => item !== query),
    ].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const removeRecentSearch = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSearches = recentSearches.filter((item) => item !== search);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const handleSearchItemClick = (search: string) => {
    setSearchQuery(search);
    addToRecentSearches(search);
    if (onSearch) {
      onSearch(search, category);
    }
    navigateToSearch(search, category);
    setShowSearchModal(false);
  };

  const handleCategorySelect = (cat: string) => {
    setCategory(cat);
    setShowCategories(false);
  };

  return (
    <div className="relative w-full  sm:px-4 md:px-6">
      <form
        onSubmit={handleSearch}
        className="flex w-full items-center rounded-full border border-gray-200 bg-white focus-within:ring-none  transition-all duration-200 "
      >
        {/* Category Dropdown */}
        <div ref={categoryDropdownRef} className="relative hidden  md:block">
          <button
            type="button"
            className="flex items-center justify-between cursor-pointer bg-black px-3 py-2.5 text-sm text-white rounded-l-full  transition-colors"
            onClick={() => setShowCategories(!showCategories)}
            aria-haspopup="listbox"
            aria-expanded={showCategories}
          >
            <span className="truncate max-w-[120px] md:max-w-[150px]">
              {category}
            </span>
            <ChevronDown size={16} className="ml-2" />
          </button>
          {showCategories && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fadeIn">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className="block cursor-pointer w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  onClick={() => handleCategorySelect(cat)}
                  role="option"
                  aria-selected={category === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex-1">
          <input
            ref={actualInputRef}
            type="text"
            placeholder="Search for Products, Brands & More"
            className="w-full px-4  text-xs md:text-sm bg-transparent focus:outline-none placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchModal(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(e);
              }
            }}
            aria-label="Search products"
          />
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="flex cursor-pointer items-center justify-center bg-black/90 hover:bg-black text-white px-4 py-2 md:py-2.5 rounded-r-full  transition-colors"
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
          handleSearchItemClick={handleSearchItemClick}
        />
      )}
    </div>
  );
};

export default SearchBar;