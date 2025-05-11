// components/Home/GamersZone/GamersZone.tsx
'use client';
import React, { useState, useEffect, memo } from 'react';
import ProductCardwithoutCart from '@/components/Product/ProductCards/ProductCardwithoutCart';
import { ProductCardSkeleton } from '@/components/Reusable/ProductCardSkeleton';
import PrimaryLinkButton from '@/components/Reusable/PrimaryLinkButton';
import { useHomeStore } from '@/store/home-store';

const categories = [
  { label: 'All', key: 'all' },
  { label: 'Consoles', key: 'consoles' },
  { label: 'Accessories', key: 'accessories' },
  { label: 'Laptops', key: 'laptops' },
  { label: 'Steerings & Chairs', key: 'steering-chairs' },
];

const GamersZone: React.FC = () => {
  const { gamersZoneProducts } = useHomeStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading] = useState(false); // No loading state since data is pre-fetched

  useEffect(() => {
    localStorage.setItem('gamersZoneCategory', activeCategory);
  }, [activeCategory]);

  const getFilteredProducts = () => {
    if (activeCategory === 'all') {
      return [
        ...gamersZoneProducts.consoles,
        ...gamersZoneProducts.accessories,
        ...gamersZoneProducts.laptops,
        ...gamersZoneProducts['steering-chairs'],
      ];
    }
    return gamersZoneProducts[activeCategory as keyof typeof gamersZoneProducts] || [];
  };

  const filteredProducts = getFilteredProducts();

  const renderSkeletons = () => {
    return Array(4)
      .fill(0)
      .map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="snap-start flex-shrink-0"
          style={{ width: 'calc(70vw - 24px)', maxWidth: '22rem' }}
        >
          <ProductCardSkeleton />
        </div>
      ));
  };

  const renderDesktopSkeletons = () => {
    return Array(8)
      .fill(0)
      .map((_, index) => (
        <div key={`desktop-skeleton-${index}`}>
          <ProductCardSkeleton />
        </div>
      ));
  };

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto">
        <div className="mb-6 text-start md:text-center">
          <h2 className="text-3xl md:text-4xl font-bold nohemi-bold text-primary">
            Gamers <span className="text-black">Zone</span>
          </h2>
        </div>

        <div className="flex overflow-x-auto pb-2 md:pb-0 md:flex-wrap md:justify-center gap-3 mb-6 minimal-scrollbar">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${
                activeCategory === category.key
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-black border-gray-300 hover:border-primary'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {loading ? (
          <>
            <div className="sm:hidden flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory minimal-scrollbar">
              {renderSkeletons()}
            </div>
            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {renderDesktopSkeletons()}
            </div>
          </>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="mb-6 text-primary animate-bounce">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 nohemi-bold">No Products Found</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm">
              We couldn&apos;t find any items in this category. Please try again later or explore other categories.
            </p>
            <PrimaryLinkButton href="/category/all" className="mt-6">
              Browse All Products
            </PrimaryLinkButton>
          </div>
        ) : (
          <>
            <div className="sm:hidden flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory minimal-scrollbar">
              {filteredProducts.map((product) => (
                <div key={product.id} className="snap-start flex-shrink-0 w-64">
                  <ProductCardwithoutCart
                    className="w-full"
                    image={product.productImages[0] || '/placeholder.svg'}
                    name={product.name}
                    rating={Number(product.averageRating)}
                    ourPrice={Number(product.ourPrice)}
                    mrp={Number(product.mrp)}
                    discount={product.discount}
                  />
                </div>
              ))}
            </div>
            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id}>
                  <ProductCardwithoutCart
                    className="w-full"
                    image={product.productImages[0] || '/placeholder.svg'}
                    name={product.name}
                    rating={Number(product.averageRating)}
                    ourPrice={Number(product.ourPrice)}
                    mrp={Number(product.mrp)}
                    discount={product.discount}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default memo(GamersZone);