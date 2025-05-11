// components/Home/FeatureProducts/FeaturedProducts.tsx
'use client';
import { useState, memo } from 'react';
import ProductCardwithoutCart from '@/components/Product/ProductCards/ProductCardwithoutCart';
import PrimaryLinkButton from '@/components/Reusable/PrimaryLinkButton';
import { ProductCardSkeleton } from '@/components/Reusable/ProductCardSkeleton';
import { useHomeStore } from '@/store/home-store';

const FeaturedProducts: React.FC = () => {
  const { featuredProducts } = useHomeStore();
  const [loading] = useState(false); // No loading state since data is pre-fetched

  const renderSkeletons = () => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <div key={`skeleton-${index}`} className="snap-start flex-shrink-0 w-72">
          <ProductCardSkeleton />
        </div>
      ));
  };

  return (
    <div className="py-12">
      <div className="mx-auto">
        <div className="mb-8 text-start md:text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 nohemi-bold">
            Featured <span className="text-primary">Products</span>
          </h2>
        </div>

        <div className="relative">
          <div className="flex overflow-x-auto pb-10 snap-x snap-mandatory minimal-scrollbar">
            {loading ? (
              <div className="flex gap-6 pl-1">{renderSkeletons()}</div>
            ) : featuredProducts.length > 0 ? (
              <div className="flex gap-6 pl-1">
                {featuredProducts.map((product) => (
                  <div key={product.id} className="snap-start flex-shrink-0 w-72">
                    <ProductCardwithoutCart
                      image={product.productImages[0] ?? 'placeholder.svg'}
                      name={product.name}
                      rating={Number(product.averageRating)}
                      ourPrice={Number(product.ourPrice)}
                      mrp={Number(product.mrp)}
                      discount={product.discount}
                      slug={product.slug}
                    />
                  </div>
                ))}
              </div>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(FeaturedProducts);