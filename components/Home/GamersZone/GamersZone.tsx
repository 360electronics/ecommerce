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
interface GamerZoneSelection {
  productId: string;
  variantId: string;
  product: CompleteProduct;
  variant: ProductVariant;
  displayName: string; // Combined product + variant name
}

const categories = [
  { label: 'All', key: 'all' },
  { label: 'Consoles', key: 'consoles' },
  { label: 'Accessories', key: 'accessories' },
  { label: 'Laptops', key: 'laptops' },
  { label: 'Steerings & Chairs', key: 'steering-chairs' },
];

const GamersZone: React.FC = () => {
  const { gamersZoneProducts, isLoading, error } = useHomeStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Memoized filtered and sorted variant cards
  const variantCards = useMemo(() => {
    const getFilteredProducts = (): GamerZoneSelection[] => {
      const allProducts = [
        ...(gamersZoneProducts.consoles || []),
        ...(gamersZoneProducts.accessories || []),
        ...(gamersZoneProducts.laptops || []),
        ...(gamersZoneProducts['steering-chairs'] || []),
      ];
      const categoryProducts =
        activeCategory === 'all'
          ? allProducts
          : gamersZoneProducts[activeCategory as keyof typeof gamersZoneProducts] || [];

      return categoryProducts.map(({ productId, variantId, product, variant }: any) => ({
        productId,
        variantId,
        product: product as CompleteProduct,
        variant: variant as ProductVariant,
        displayName: `${product.shortName} - ${variant.name}`,
      }));
    };

    return getFilteredProducts()
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
        const aDate = a.product.createdAt ? new Date(a.product.createdAt).getTime() : 0;
        const bDate = b.product.createdAt ? new Date(b.product.createdAt).getTime() : 0;
        return bDate - aDate || a.productId.localeCompare(b.productId);
      })
      .slice(0, 10);
  }, [gamersZoneProducts, activeCategory, searchTerm]);

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
          style={{  width: 'calc(60vw - 32px)', maxWidth: '15rem'  }}
        >
          <ProductCardSkeleton />
        </div>
      ));
  }, []);

  const renderDesktopSkeletons = useCallback(() => {
    return Array(8)
      .fill(0)
      .map((_, index) => (
        <div key={`desktop-skeleton-${index}`}>
          <ProductCardSkeleton />
        </div>
      ));
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  if (isLoading) {
    return (
      <section className="py-8 md:py-12">
        <div className="mx-auto container px-4">
          <div className="mb-6 text-start md:text-center">
            <h2 className="text-3xl md:text-4xl font-bold nohemi-bold text-primary">
              Gamers <span className="text-black">Zone</span>
            </h2>
          </div>
          <div className="sm:hidden flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory minimal-scrollbar">
            {renderSkeletons()}
          </div>
          <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {renderDesktopSkeletons()}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 md:py-12 flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-red-600">{error.message}</p>
          <PrimaryLinkButton href="/category/all">Browse All Products</PrimaryLinkButton>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto container md:px-4">
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
              className={cn(
                'px-4 py-2 rounded-full border text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0',
                activeCategory === category.key
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-black border-gray-300 hover:border-primary'
              )}
              aria-label={`Filter by ${category.label}`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {variantCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
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
                ? `No products match your search in ${activeCategory === 'all' ? 'Gamers Zone' : categories.find(c => c.key === activeCategory)?.label}.`
                : `No products available in ${activeCategory === 'all' ? 'Gamers Zone' : categories.find(c => c.key === activeCategory)?.label}.`}
              Try different keywords or browse all products.
            </p>
            <PrimaryLinkButton href="/category/all" className="mt-6">
              Browse All Products
            </PrimaryLinkButton>
          </div>
        ) : (
          <>
            <div className="sm:hidden flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory minimal-scrollbar">
              {variantCards.map(({ productId, variantId, product, variant, displayName }) => {
                const mrp = Number(variant.mrp);
                const ourPrice = Number(variant.ourPrice);
                const discount = calculateDiscount(mrp, ourPrice);

                return (
                  <div
                    key={`${productId}-${variantId}`}
                    className="snap-start flex-shrink-0 relative"
                    style={{ width: 'calc(60vw - 32px)', maxWidth: '20rem' }}
                  >
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      Featured
                    </span>
                    <ProductCardwithoutCart
                      productId={productId}
                      variantId={variant.id}
                      slug={variant.slug}
                      className="w-full h-full"
                      image={variant.productImages?.[0]?.url ?? '/placeholder.png'}
                      name={displayName}
                      rating={Number(product.averageRating)}
                      ourPrice={ourPrice}
                      mrp={mrp}
                      discount={discount}
                      isHeartNeed={true}
                      showViewDetails={true}
                      status={product.status}
                    />
                  </div>
                );
              })}
            </div>
            <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
              {variantCards.map(({ productId, variantId, product, variant, displayName }) => {
                const mrp = Number(variant.mrp);
                const ourPrice = Number(variant.ourPrice);
                const discount = calculateDiscount(mrp, ourPrice);

                return (
                  <div key={`${productId}-${variantId}`} className="relative">
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                      Featured
                    </span>
                    <ProductCardwithoutCart
                      productId={productId}
                      variantId={variant.id}
                      slug={variant.slug}
                      className="w-full h-full"
                      image={variant.productImages?.[0]?.url ?? '/placeholder.png'}
                      name={displayName}
                      rating={Number(product.averageRating)}
                      ourPrice={ourPrice}
                      mrp={mrp}
                      discount={discount}
                      isHeartNeed={true}
                      showViewDetails={true}
                      status={product.status}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default memo(GamersZone);