// SearchModal.tsx
import React from 'react';
import { X, Clock, TrendingUp } from 'lucide-react';

interface SearchModalProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onClose: () => void;
  recentSearches: string[];
  clearAllRecentSearches: () => void;
  removeRecentSearch: (search: string, e: React.MouseEvent) => void;
  handleSearchItemClick: (search: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  searchQuery,
  setSearchQuery,
  onClose,
  recentSearches,
  clearAllRecentSearches,
  removeRecentSearch,
  handleSearchItemClick
}) => {
  // Trending searches data
  const trendingSearches = [
    'Mackbook',
    'White keyboard',
    'Asus laptop',
    'Gaming Headphone',
    'Gaming Chair',
    'Mouse pad',
    'hp Mouse',
    'Acer ALG',
    'Dell laptop',
    'Monitor',
    'RGB gaming keyboard'
  ];

  return (
    <div className="fixed inset-0 z-50 md:relative md:inset-auto">
      {/* Full screen overlay for mobile */}
      <div className="md:hidden fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="fixed inset-0 md:absolute md:top-full md:left-0 md:right-0 md:inset-auto md:mt-1 bg-white md:rounded-lg shadow-lg overflow-hidden">
        <div className="flex flex-col h-full md:h-auto md:max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <input
              type="text"
              placeholder="Search for Products, Brands & More"
              className="flex-grow focus:outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button 
              onClick={onClose}
              className="ml-2 text-gray-500 hover:text-gray-800"
              aria-label="Close search"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
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
                    className="text-xs cursor-pointer text-blue-600 hover:text-blue-800"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <div 
                      key={index} 
                      className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSearchItemClick(search)}
                    >
                      {search}
                      <button 
                        onClick={(e) => removeRecentSearch(search, e)} 
                        className="ml-1 text-gray-500 hover:text-gray-700"
                        aria-label={`Remove ${search} from recent searches`}
                      >
                        <X size={14} />
                      </button>
                    </div>
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
                  <div 
                    key={index} 
                    className="bg-gray-100 rounded-full px-3 py-1 text-sm cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSearchItemClick(search)}
                  >
                    {search}
                  </div>
                ))}
              </div>
            </div>

            {/* Promotional Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded overflow-hidden cursor-pointer relative">
                <div className="bg-red-600 h-32 w-full relative">
                  <div className="absolute inset-0 flex items-center p-4">
                    <div className="text-white">
                      <div className="text-xl font-bold">PC PORTABLE</div>
                      <div className="text-3xl font-bold">MSI</div>
                      <div className="text-xl font-bold">GF63 THIN</div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <button className="bg-blue-500 text-white rounded px-3 py-1 text-sm">
                      Shop now
                    </button>
                  </div>
                </div>
              </div>
              <div className="rounded overflow-hidden cursor-pointer relative">
                <div className="bg-yellow-400 h-32 w-full relative">
                  <div className="absolute inset-0 flex items-center justify-between p-4">
                    <div className="text-black font-bold text-xl">
                      Be the core of your play
                    </div>
                    <div className="flex items-center">
                      <div className="bg-red-500 rounded-full w-12 h-12 flex items-center justify-center text-white font-bold">
                        <div className="text-xs">
                          <span>78%</span>
                          <br />
                          <span>Off</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <button className="bg-blue-500 text-white rounded px-3 py-1 text-sm">
                      Shop now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchModal;