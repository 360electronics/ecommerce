// components/Home/NewArrivals/NewArrivals.tsx
'use client';
import { useState, memo } from 'react';
import ProductCardwithoutCart from '@/components/Product/ProductCards/ProductCardwithoutCart';
import PrimaryLinkButton from '@/components/Reusable/PrimaryLinkButton';
import { ProductCardSkeleton } from '@/components/Reusable/ProductCardSkeleton';
import { useHomeStore } from '@/store/home-store';

const NewArrivals: React.FC = () => {
  const { newArrivals } = useHomeStore();
  const [loading] = useState(false); // No loading state since data is pre-fetched

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

  return (
    <div className="py-6 md:py-12">
      <div className="md:hidden container mx-auto px-4 mb-4">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold nohemi-bold">
            New <span className="text-primary">Arrivals</span>
          </h2>
          <p className="mt-1 text-sm text-gray-600 max-w-xs mx-auto">
            The Future of Tech Starts Here, Unbox what&apos;s New & Next.
          </p>
        </div>
      </div>

      <div className="mx-auto">
        <div className="relative">
          <div className="flex overflow-x-auto pb-4 sm:pb-6 snap-x snap-mandatory minimal-scrollbar gap-3 sm:gap-5 scrollbar-hide">
            <div className="hidden md:flex mb-8 text-start snap-start flex-shrink-0 w-80 flex-col justify-center items-start">
              <h2 className="text-3xl md:text-4xl font-bold mb-2 nohemi-bold">
                New <br />
                <span className="text-primary">Arrivals</span>
              </h2>
              <p className="mb-4">The Future of Tech Starts Here, Unbox what&apos;s New & Next.</p>
              <PrimaryLinkButton href="/">View All</PrimaryLinkButton>
            </div>

            {loading ? (
              renderSkeletons()
            ) : newArrivals.length > 0 ? (
              newArrivals.map((product) => (
                <div
                  key={product.id}
                  className="snap-start flex-shrink-0"
                  style={{ width: 'calc(70vw - 24px)', maxWidth: '22rem' }}
                >
                  <ProductCardwithoutCart
                    className="w-full h-full"
                    image={product.productImages[0] ?? 'placeholder.svg'}
                    name={product.name}
                    rating={Number(product.averageRating)}
                    ourPrice={Number(product.ourPrice)}
                    mrp={Number(product.mrp)}
                    slug={product.slug}
                    discount={product.discount}
                  />
                </div>
              ))
            ) : (
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
            )}
            <div className="flex-shrink-0 w-4"></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6 md:hidden flex justify-center">
        <PrimaryLinkButton href="/" className="w-full max-w-xs">
          View All
        </PrimaryLinkButton>
      </div>

      {!loading && newArrivals.length > 0 && (
        <div className="flex justify-center mt-4 md:hidden">
          <div className="flex space-x-2">
            {Array(Math.min(5, newArrivals.length))
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-gray-300'}`}
                ></div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(NewArrivals);