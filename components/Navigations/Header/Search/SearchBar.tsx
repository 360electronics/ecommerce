import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation'; 
import SearchModal from './SearchModal';

interface SearchProps {
  onSearch?: (query: string, category: string) => void;
  isMobile?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchProps> = ({ onSearch, isMobile = false, inputRef, autoFocus = false }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [category, setCategory] = useState<string>('All Categories');
  const [showCategories, setShowCategories] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); 

  const actualInputRef = inputRef || internalInputRef;

  const categories = ['All Categories','Laptops', 'Desktops', 'Components', 'Peripherals', 'Accessories'];

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

  // Navigate to search page with query parameters
  const navigateToSearch = (query: string, category: string) => {
    const params = new URLSearchParams();
    
    if (query.trim()) {
      params.append('q', query.trim());
    }
    
    if (category !== 'All Categories') {
      params.append('category', category);
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
      ...recentSearches.filter(item => item !== query)
    ].slice(0, 5);

    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const removeRecentSearch = (search: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSearches = recentSearches.filter(item => item !== search);
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
    // Removed the navigation here - only update the state
  };

  return (
    <div className="relative w-full sm:px-3 md:px-4">
      <form onSubmit={handleSearch} className="flex w-full">
        <div ref={categoryDropdownRef} className="relative hidden sm:block">
          <button
            type="button"
            className="flex items-center cursor-pointer justify-between bg-black text-white rounded-l-3xl px-2 sm:px-3 md:px-4 py-[12.5px] text-sm whitespace-nowrap"
            onClick={() => setShowCategories(!showCategories)}
          >
            <span className="hidden md:inline">{category}</span>
            <span className="md:hidden">All</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>

          {showCategories && (
            <div className="absolute top-full left-0 mt-1 w-40 sm:w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className="block w-full cursor-pointer text-left px-4 py-3 text-sm hover:bg-gray-100"
                  onClick={() => handleCategorySelect(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="relative flex-1">
          <input
            ref={actualInputRef}
            type="text"
            placeholder={isMobile ? "Search..." : "Search for Products, Brands & More"}
            className="w-full border rounded-full md:rounded-none  sm:border-y border-gray-300 px-3 py-3 text-[10px] md:text-sm focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchModal(true)}
          />
          
          <button
            type="submit"
            className="absolute cursor-pointer right-0 top-0 h-full px-3 flex items-center justify-center sm:hidden"
          >
            <Search size={18} className="text-gray-500" />
          </button>
        </div>

        <button
          type="submit"
          className="hidden cursor-pointer sm:flex bg-black text-white rounded-r-3xl px-3 md:px-4 py-2 items-center justify-center"
        >
          <Search size={20} />
        </button>
      </form>

      {/* Mobile category selector */}
      {/* <div className="flex sm:hidden mt-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`flex-shrink-0 text-xs px-3 py-1 rounded-full mr-2 whitespace-nowrap ${
              category === cat ? 'bg-black text-white' : 'bg-gray-100'
            }`}
            onClick={() => handleCategorySelect(cat)}
          >
            {cat}
          </button>
        ))}
      </div> */}

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