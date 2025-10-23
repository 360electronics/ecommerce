'use client';

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import ProductCardwithoutCart from '@/components/Product/ProductCards/ProductCardwithoutCart';
import { ProductCardSkeleton } from '@/components/Reusable/ProductCardSkeleton';
import PrimaryLinkButton from '@/components/Reusable/PrimaryLinkButton';
import { useHomeStore } from '@/store/home-store';
import { CompleteProduct, ProductVariant } from '@/types/product';
import { cn } from '@/lib/utils';

interface Brand {
  name: string;
  logoSrc: string;
}

interface BrandLogoProps extends Brand {
  isActive: boolean;
  onClick: () => void;
}

const BRANDS: Brand[] = [
  { name: 'asus', logoSrc: 'https://press.asus.com/assets/w_854,h_640/e2c84986-7e34-40e3-8fa2-4053d3f17187/ASUS%20logo%20grey.png' },
  { name: 'hp', logoSrc: 'https://img.icons8.com/?size=100&id=38607&format=png&color=000000' },
  { name: 'dell', logoSrc: 'https://img.icons8.com/?size=100&id=63790&format=png&color=000000' },
  { name: 'apple', logoSrc: 'https://img.icons8.com/?size=100&id=95294&format=png&color=000000' },
  { name: 'acer', logoSrc: 'https://1000logos.net/wp-content/uploads/2016/09/Acer-Logo-720x450.png' },
];

const BrandLogo: React.FC<BrandLogoProps> = memo(({ name, logoSrc, isActive, onClick }) => (
  <button
    type="button"
    className={cn(
      'flex flex-col items-center p-2 sm:p-3 md:p-4 rounded-full bg-slate-100 cursor-pointer transition-all duration-200 hover:bg-slate-200',
      isActive ? 'border-2 border-dashed border-primary' : 'border-2 border-transparent'
    )}
    onClick={onClick}
    aria-label={`Select ${name} brand`}
    aria-pressed={isActive}
  >
    <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 relative flex items-center justify-center">
      <img
        src={logoSrc}
        alt={`${name} logo`}
        className="object-contain w-full h-full"
        loading={name === 'apple' ? 'eager' : 'lazy'}
      />
    </div>
  </button>
));
BrandLogo.displayName = 'BrandLogo';

const TopTierBrands: React.FC = () => {
  const { brandProducts, isLoading, error } = useHomeStore();
  const [activeBrand, setActiveBrand] = useState('asus');

  const handleBrandClick = useCallback((brandName: string) => {
    setActiveBrand(brandName);
  }, []);

  // 🧩 Debug Info
  // useEffect(() => {
  //   console.groupCollapsed('%c[TopTierBrands Debug]', 'color: #0ea5e9; font-weight: bold;');
  //   console.log('Active Brand:', activeBrand);
  //   console.log('brandProducts:', brandProducts);
  //   if (Array.isArray(brandProducts)) {
  //     console.log(
  //       'Available Brands:',
  //       brandProducts.map((b: any) => b.brand)
  //     );
  //     const found = brandProducts.find(
  //       (b: any) => b.brand?.toLowerCase() === activeBrand.toLowerCase()
  //     );
  //     console.log(`Matched Block for ${activeBrand}:`, found);
  //     if (found && found.products) {
  //       console.log(`✅ ${activeBrand} has ${found.products.length} products`);
  //       if (found.products.length > 0) {
  //         const sample = found.products[0];
  //         console.log('🔍 Sample Product:', {
  //           id: sample.id,
  //           name: sample.name || sample.shortName,
  //           variants: sample.variants?.length || 0,
  //         });
  //       }
  //     } else {
  //       console.warn(`⚠️ No brand match found for ${activeBrand}`);
  //     }
  //   } else {
  //     console.warn('❌ brandProducts is not an array:', typeof brandProducts);
  //   }
  //   console.groupEnd();
  // }, [brandProducts, activeBrand]);

  const currentBrandProducts = useMemo(() => {
    if (!Array.isArray(brandProducts)) return [];
    const brandBlock = brandProducts.find(
      (b: any) => b.brand?.toLowerCase() === activeBrand.toLowerCase()
    );
    return brandBlock?.products || [];
  }, [brandProducts, activeBrand]);

  const variantCards = useMemo(() => {
    if (!Array.isArray(currentBrandProducts) || !currentBrandProducts.length) return [];
    return currentBrandProducts.flatMap((product: CompleteProduct) =>
      (product.variants || []).map((variant: ProductVariant) => ({
        productId: product.id,
        variantId: variant.id,
        product,
        variant,
        displayName: `${product.shortName || product.fullName || 'Product'} - ${variant.name || ''}`,
      }))
    ).slice(0, 10);
  }, [currentBrandProducts]);

  const calculateDiscount = useCallback((mrp: number, ourPrice: number): number => {
    if (mrp <= 0 || ourPrice >= mrp) return 0;
    return Math.round(((mrp - ourPrice) / mrp) * 100);
  }, []);

  const renderSkeletonCards = useCallback(() => (
    Array(4).fill(null).map((_, index) => (
      <div key={`skeleton-${index}`} className="snap-start flex-shrink-0" style={{ width: 'calc(60vw - 32px)', maxWidth: '15rem' }}>
        <ProductCardSkeleton />
      </div>
    ))
  ), []);

  if (isLoading) {
    return (
      <div className="py-8 md:py-12 mx-auto container md:px-4">
        <header className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold nohemi-bold">
            Explore Top-Tier <span className="text-primary">Brands</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Discover high-performance laptops from trusted global brands.
          </p>
        </header>
        <div className="flex overflow-x-auto pb-8 snap-x snap-mandatory minimal-scrollbar scrollbar-hide">
          <div className="flex gap-4 pl-2">{renderSkeletonCards()}</div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('[TopTierBrands Error]', error);
    return (
      <div className="py-8 md:py-12 flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="text-red-600">{error?.message || 'Failed to load brand products'}</p>
          <PrimaryLinkButton href="/category/all">Browse All Products</PrimaryLinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12 mx-auto container md:px-4">
      <header className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 nohemi-bold">
          Explore Top-Tier <span className="text-primary">Brands</span>
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
          Discover top-tier laptops from trusted brands — performance, power, and precision at 360 Electronics.
        </p>
      </header>

      {/* Brand Selector */}
      <div
        className="flex overflow-x-auto pb-6 sm:flex-wrap justify-center gap-3 sm:gap-4 md:gap-5 mb-10 scrollbar-hide"
        role="tablist"
        aria-label="Brand selector"
      >
        {BRANDS.map((brand) => (
          <BrandLogo
            key={brand.name}
            name={brand.name}
            logoSrc={brand.logoSrc}
            isActive={activeBrand === brand.name}
            onClick={() => handleBrandClick(brand.name)}
          />
        ))}
      </div>

      {/* Product Carousel */}
      {variantCards.length > 0 ? (
        <div className="flex overflow-x-auto pb-8 snap-x snap-mandatory minimal-scrollbar">
          <div className="flex gap-4 pl-2">
            {variantCards.map(({ productId, variantId, product, variant, displayName }) => {
              const mrp = Number(variant.mrp) || 0;
              const ourPrice = Number(variant.ourPrice) || 0;
              const discount = calculateDiscount(mrp, ourPrice);

              return (
                <div
                  key={`${productId}-${variantId}`}
                  className="snap-start flex-shrink-0"
                  style={{ width: 'calc(60vw - 32px)', maxWidth: '15rem' }}
                >
                  <ProductCardwithoutCart
                    productId={productId}
                    variantId={variantId}
                    slug={variant.slug || product.slug || 'product'}
                    className="w-full h-full"
                    image={variant.productImages?.[0]?.url ?? '/placeholder.png'}
                    name={displayName}
                    rating={Number(product.averageRating) || 0}
                    ourPrice={ourPrice}
                    mrp={mrp}
                    discount={discount}
                    isHeartNeed
                    showViewDetails
                    status={product.status}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="w-full flex items-center justify-center min-h-[300px] px-4">
          <div className="text-center max-w-md">
            <div className="mb-5 text-primary animate-bounce">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2 nohemi-bold">No Products Found</h3>
            <p className="text-sm text-gray-600">
              No <strong>{activeBrand}</strong> laptops found. Please verify API or product data.
            </p>
            <PrimaryLinkButton href="/category/all" className="mt-6">
              Browse All Products
            </PrimaryLinkButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(TopTierBrands);
