'use client'
import React, { useEffect, useRef, useState } from 'react';
import { X, Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProducts } from '@/utils/products.util';
import Fuse from 'fuse.js';

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
  const [products, setProducts] = useState<Product[]>([]);
  const [fuse, setFuse] = useState<Fuse<Product> | null>(null);

  // Fetch products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const fetchedProducts = await fetchProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    loadProducts();
  }, []);

  // Initialize Fuse.js with weighted keys for better relevance
  useEffect(() => {
    if (products.length > 0) {
      const fuseInstance = new Fuse(products, {
        keys: [
          { name: 'shortName', weight: 0.4 }, // Higher weight for product names
          { name: 'fullName', weight: 0.4 },
          { name: 'description', weight: 0.2 }, // Lower weight for description
        ],
        threshold: 0.3, // Moderate fuzziness for matching
        includeScore: true, // Include score for sorting by relevance
        minMatchCharLength: 2, // Minimum query length for matching
        ignoreLocation: true, // Match anywhere in the string
      });
      setFuse(fuseInstance);
    }
  }, [products]);

  // Focus trap for accessibility
  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
          if (e.shiftKey && document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Perform search and sort results by relevance (lower score = better match)
  const searchResults = fuse && searchQuery 
    ? fuse.search(searchQuery).sort((a, b) => (a.score || 0) - (b.score || 0)) 
    : [];

  // Extract suggestions and matching products, limited to 5 and 4 respectively
  const suggestions = searchResults
    .map((result) => result.item.shortName || result.item.fullName || '')
    .slice(0, 5);

  const matchingProducts = searchResults
    .map((result) => result.item)
    .slice(0, 4);

  // Trending searches
  const trendingSearches = [
    'MacBook',
    'White Keyboard',
    'Asus Laptop',
    'Gaming Headphone',
    'Gaming Chair',
    'Mouse Pad',
    'HP Mouse',
    'Acer ALG',
    'Dell Laptop',
    'Monitor',
    'RGB Gaming Keyboard',
  ];

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
          aria-label="Search modal"
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
                  if (e.key === 'Enter') {
                    handleSearchItemClick(searchQuery);
                  }
                }}
                aria-label="Search input"
              />
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close search modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {searchQuery ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Suggestions (Left) */}
                  <div>
                    <div className="flex items-center mb-3 text-gray-700">
                      <span className="font-medium text-sm">Suggestions</span>
                    </div>
                    <ul className="space-y-2">
                      {suggestions.length > 0 ? (
                        suggestions.map((suggestion, index) => (
                          <li key={index}>
                            <button
                              className="w-full text-left text-sm text-gray-700 hover:bg-gray-100 rounded px-3 py-2 transition-colors"
                              onClick={() => handleSearchItemClick(suggestion)}
                              aria-label={`Search for ${suggestion}`}
                            >
                              {suggestion}
                            </button>
                          </li>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No suggestions found.</p>
                      )}
                    </ul>
                  </div>

                  {/* Matching Products (Right) */}
                  <div>
                    <div className="flex items-center mb-3 text-gray-700">
                      <span className="font-medium text-sm">Matching Products</span>
                    </div>
                    <div className="space-y-4">
                      {matchingProducts.length > 0 ? (
                        matchingProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                          >
                            {product.variants[0]?.productImages[0]?.url && (
                              <img
                                src={product.variants[0].productImages[0].url}
                                alt={product.shortName || product.fullName || 'Product image'}
                                className="w-16 h-16 object-contain mr-4"
                              />
                            )}
                            <div>
                              <button
                                className="text-sm font-medium text-gray-800 hover:text-blue-600"
                                onClick={() => handleSearchItemClick(product.shortName || product.fullName || '')}
                                aria-label={`View ${product.shortName || product.fullName}`}
                              >
                                {product.shortName || product.fullName}
                              </button>
                              <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                              {product.variants[0]?.ourPrice && (
                                <p className="text-sm font-bold text-gray-800">
                                  ₹{parseFloat(product.variants[0].ourPrice).toLocaleString('en-IN')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No products found.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center text-gray-700">
                          <Clock size={16} className="mr-2" />
                          <span className="font-medium text-sm">Recent Searches</span>
                        </div>
                        <button
                          onClick={clearAllRecentSearches}
                          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          aria-label="Clear all recent searches"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                            onClick={() => handleSearchItemClick(search)}
                            aria-label={`Search for ${search}`}
                          >
                            {search}
                            <button
                              onClick={(e) => removeRecentSearch(search, e)}
                              className="ml-2 text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-300"
                              aria-label={`Remove ${search} from recent searches`}
                            >
                              <X size={14} />
                            </button>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Searches */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3 text-gray-700">
                      <TrendingUp size={16} className="mr-2" />
                      <span className="font-medium text-sm">Trending Searches</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trendingSearches.map((search, index) => (
                        <button
                          key={index}
                          className="bg-gray-100 rounded-full px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                          onClick={() => handleSearchItemClick(search)}
                          aria-label={`Search for ${search}`}
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Promotional Banners */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                      <div className="bg-gradient-to-r from-red-600 to-red-800 h-32 flex items-center p-4">
                        <div className="text-white">
                          <div className="text-lg font-bold">PC PORTABLE</div>
                          <div className="text-2xl font-bold">MSI</div>
                          <div className="text-lg font-bold">GF63 THIN</div>
                        </div>
                      </div>
                      <button
                        className="absolute bottom-3 right-3 bg-blue-500 text-white rounded-full px-4 py-1 text-sm hover:bg-blue-600 transition-colors"
                        aria-label="Shop MSI GF63 Thin"
                      >
                        Shop Now
                      </button>
                    </div>
                    <div className="relative rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-32 flex items-center justify-between p-4">
                        <div className="text-black font-bold text-lg max-w-[60%]">
                          Be the Core of Your Play
                        </div>
                        <div className="bg-red-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold">
                          <div className="text-xs text-center">
                            <span>78%</span>
                            <br />
                            <span>Off</span>
                          </div>
                        </div>
                      </div>
                      <button
                        className="absolute bottom-3 right-3 bg-blue-500 text-white rounded-full px-4 py-1 text-sm hover:bg-blue-600 transition-colors"
                        aria-label="Shop discounted products"
                      >
                        Shop Now
                      </button>
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