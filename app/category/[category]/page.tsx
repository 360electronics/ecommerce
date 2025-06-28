'use client';

import React from 'react';
import UserLayout from '@/components/Layouts/UserLayout';
import ProductListing from '@/components/Listing/ProductListing';
import { useParams } from 'next/navigation';

const CategoryPage = () => {
  // Get category from URL params
  const params = useParams();
  const category = params.category as string;
  
  // Capitalize the category for display
  const categoryName = category
    ? category.charAt(0).toUpperCase() + category.slice(1)
    : '';

  return (
    <UserLayout>
      <div className="mx-auto pt-4 pb-10">
        {/* Category Header */}
        {/* <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{categoryName}</h1>
          <p className="text-gray-600 mt-2">
            Browse our collection of {categoryName.toLowerCase()} products
          </p>
        </div> */}
        
        {/* Category Banner - Optional */}
        {/* <div className="w-full h-48 bg-gray-100 rounded-lg mb-8 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
            <div className="px-8 text-white">
              <h2 className="text-2xl font-bold mb-2">Shop {categoryName}</h2>
              <p className="text-sm text-gray-200 max-w-md">
                Discover our latest collection of {categoryName.toLowerCase()} with great deals and fast shipping.
              </p>
            </div>
          </div>
        </div> */}
        
        {/* Product Listing Component */}
        <ProductListing category={category} />
      </div>
    </UserLayout>
  );
};

export default CategoryPage;