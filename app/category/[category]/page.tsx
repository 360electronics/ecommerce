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

        
        {/* Product Listing Component */}
        <ProductListing category={category} />
      </div>
    </UserLayout>
  );
};

export default CategoryPage;