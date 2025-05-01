'use client';

import React from 'react';
import UserLayout from '@/components/Layouts/UserLayout';
import ProductListing from '@/components/Listing/ProductListing';
import { useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

const SearchPage = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  

  return (
    <UserLayout>
      <div className="mx-auto py-6">
        {/* Search Banner */}
        <div className="w-full h-48 bg-gray-100 rounded-lg mb-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
            <div className="px-8 text-white">
              <h2 className="text-2xl font-bold mb-2">
                {query ? `Search Results for "${query}"` : 'Search Products'}
              </h2>
              <p className="text-sm text-gray-200 max-w-md">
                {query 
                  ? `Browse our products matching your search for "${query}"`
                  : 'Find exactly what you\'re looking for in our extensive catalog'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Product Listing Component - Pass query as prop */}
        <ProductListing searchQuery={query} />
      </div>
    </UserLayout>
  );
};

export default SearchPage;