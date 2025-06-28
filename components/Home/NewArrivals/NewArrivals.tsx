'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { Search, X, AlertCircle } from 'lucide-react';
import ProductCardwithoutCart from '@/components/Product/ProductCards/ProductCardwithoutCart';
import PrimaryLinkButton from '@/components/Reusable/PrimaryLinkButton';
import { ProductCardSkeleton } from '@/components/Reusable/ProductCardSkeleton';
import { useHomeStore } from '@/store/home-store';
import { Input } from '@/components/ui/input';
import { CompleteProduct, ProductVariant, ProductImage } from '@/types/product';
import { cn } from '@/lib/utils';

// Types
interface NewArrivalSelection {
  productId: string;
  variantId: string;
  product: CompleteProduct;
  variant: ProductVariant;
  displayName: string; // Combined product + variant name
}

const NewArrivals: React.FC = () => {
  const { newArrivals, isLoading, error } = useHomeStore();
  const [searchTerm, setSearchTerm] = useState('');

  // Memoized filtered and sorted variant cards
  const variantCards = useMemo(() => {
    const selections: NewArrivalSelection[] = newArrivals
      .map(({ productId, variantId, product, variant }: any) => ({
        productId,
        variantId,
        product: product as CompleteProduct,
        variant: variant as ProductVariant,
        displayName: `${product.shortName} - ${variant.name}`,
      }))
      .filter((selection) =>
        searchTerm.trim()
          ? [
              selection.displayName,
              selection.product.shortName,
              selection.product.fullName,
              selection.variant.name,
              selection.variant.sku,
              selection.product.description || '',
            ].some((field) => field.toLowerCase().includes(searchTerm.toLowerCase()))
          : true
      )
      .sort((a, b) => {
        // Sort by newArrivals.createdAt (from fetchNewArrivalsProducts)
        const aDate = a.product.createdAt ? new Date(a.product.createdAt).getTime() : 0;
        const bDate = b.product.createdAt ? new Date(b.product.createdAt).getTime() : 0;
        return bDate - aDate || a.productId.localeCompare(b.productId);
      })
      .slice(0, 10);

    return selections;
  }, [newArrivals, searchTerm]);

  const calculateDiscount = useCallback((mrp: number, ourPrice: number): number => {
    if (mrp <= 0 || ourPrice >= mrp) return 0;
    return Math.round(((mrp - ourPrice) / mrp) * 100);
  }, []);

  const renderSkeletons = useCallback(() => {
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
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  if (isLoading) {
    return (
      <div className="py-6 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold nohemi-bold">
              New <span className="text-primary">Arrivals</span>
            </h2>
            <p className="mt-1 text-sm text-gray-600 max-w-xs mx-auto md:max-w-sm">
              The Future of Tech Starts Here, Unbox what's New & Next.
            </p>
          </div>
          <div className="flex overflow-x-auto pb-4 sm:pb-6 snap-x snap-mandatory minimal-scrollbar gap-3 sm:gap-5 scrollbar-hide">
            {renderSkeletons()}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 md:py-12 flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-red-600">{error}</p>
          <PrimaryLinkButton href="/category/all">Browse All Products</PrimaryLinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 md:py-12">
      <div className="md:hidden container mx-auto px-4 mb-4">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold nohemi-bold">
            New <span className="text-primary">Arrivals</span>
          </h2>
          <p className="mt-1 text-sm text-gray-600 max-w-xs mx-auto">
            The Future of Tech Starts Here, Unbox what's New & Next.
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
              <p className="mb-4">The Future of Tech Starts Here, Unbox what's New & Next.</p>
              <PrimaryLinkButton href="/category/all">View All</PrimaryLinkButton>
            </div>

            {variantCards.length > 0 ? (
              variantCards.map(({ productId, variantId, product, variant, displayName }) => {
                const mrp = Number(variant.mrp);
                const ourPrice = Number(variant.ourPrice);
                const discount = calculateDiscount(mrp, ourPrice);

                return (
                  <div
                    key={`${productId}-${variantId}`}
                    className="snap-start flex-shrink-0"
                    style={{ width: 'calc(60vw - 32px)', maxWidth: '20rem' }}

                  >
                    <ProductCardwithoutCart
                      productId={productId}
                      variantId={variant.id}
                      className="w-full h-full"
                      image={variant.productImages?.[0]?.url ?? '/placeholder.png'}
                      name={displayName}
                      rating={Number(product.averageRating)}
                      ourPrice={ourPrice}
                      mrp={mrp}
                      slug={variant.slug}
                      discount={discount}
                      isHeartNeed={true}
                      showViewDetails={true}
                    />
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col mx-auto items-center justify-center py-16 text-center px-4">
                <div className="mb-6 text-primary animate-bounce">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
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
                  {searchTerm.trim()
                    ? 'No new arrivals match your search. Try different keywords or browse all products.'
                    : 'No new arrivals are available. Please check back later or explore other categories.'}
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

      
      
    </div>
  );
};

export default memo(NewArrivals);