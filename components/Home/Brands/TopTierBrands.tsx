// components/Home/Brands/TopTierBrands.tsx
'use client';
import React, { useState, useCallback, memo, useEffect } from 'react';
import Image from 'next/image';
import ProductCardwithoutCart from '@/components/Product/ProductCards/ProductCardwithoutCart';
import { ProductCardSkeleton } from '@/components/Reusable/ProductCardSkeleton';
import PrimaryLinkButton from '@/components/Reusable/PrimaryLinkButton';
import { useHomeStore } from '@/store/home-store';

interface Brand {
  name: string;
  logoSrc: string;
}

interface BrandLogoProps extends Brand {
  isActive: boolean;
  onClick: () => void;
}

const BRANDS: Brand[] = [
  { name: 'apple', logoSrc: 'https://img.icons8.com/?size=100&id=95294&format=png&color=000000' },
  { name: 'hp', logoSrc: 'https://img.icons8.com/?size=100&id=38607&format=png&color=000000' },
  { name: 'dell', logoSrc: 'https://img.icons8.com/?size=100&id=63790&format=png&color=000000' },
  { name: 'asus', logoSrc: 'https://press.asus.com/assets/w_854,h_640/e2c84986-7e34-40e3-8fa2-4053d3f17187/ASUS%20logo%20grey.png' },
  { name: 'acer', logoSrc: 'https://1000logos.net/wp-content/uploads/2016/09/Acer-Logo-720x450.png' },
];

const BrandLogo: React.FC<BrandLogoProps> = memo(({ name, logoSrc, isActive, onClick }) => {
  return (
    <button
      type="button"
      className={`flex flex-col items-center p-2 sm:p-3 md:p-4 rounded-full bg-slate-100 cursor-pointer transition-all duration-200 hover:bg-slate-200 ${
        isActive ? 'border-2 border-dashed border-primary' : 'border-2 border-transparent'
      }`}
      onClick={onClick}
      aria-label={`Select ${name} brand`}
      aria-pressed={isActive}
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 relative flex items-center justify-center">
        <Image
          src={logoSrc}
          alt={`${name} logo`}
          width={64}
          height={64}
          className="object-contain w-full h-full"
          priority={name === 'apple'}
          loading={name === 'apple' ? 'eager' : 'lazy'}
        />
      </div>
    </button>
  );
});

BrandLogo.displayName = 'BrandLogo';

const TopTierBrands: React.FC = () => {
  const { brandProducts } = useHomeStore();
  const [activeBrand, setActiveBrand] = useState('apple');
  const [loading] = useState(false); 

  const handleBrandClick = useCallback((brandName: string) => {
    setActiveBrand(brandName);
  }, []);

  useEffect(() => {
    localStorage.setItem('activeBrand', activeBrand);
  }, [activeBrand]);

  const filteredProducts = brandProducts
    .filter((product) => product.brand.toLowerCase() === activeBrand)
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return Number(b.id) - Number(a.id);
    })
    .slice(0, 10);

  const skeletonCards = Array(4)
    .fill(null)
    .map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="snap-start flex-shrink-0"
        style={{ width: 'calc(80vw - 32px)', maxWidth: '22rem' }}
      >
        <ProductCardSkeleton />
      </div>
    ));

  return (
    <div className="py-6 sm:py-8 md:py-12 mx-auto">
      <header className="text-center mb-6 sm:mb-8 md:mb-10">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 nohemi-bold">
          Explore Top-Tier <span className="text-primary">Brands</span>
        </h2>
        <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
          Discover top-tier laptops from trusted brands — performance, power, and precision at Computer Garage.
        </p>
      </header>

      <div
        className="flex overflow-x-auto pb-4 sm:pb-6 sm:flex-wrap sm:justify-center gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8 md:mb-12 scrollbar-hide sm:scrollbar-default"
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

      {loading ? (
        <div className="flex overflow-x-auto pb-6 sm:pb-8 snap-x snap-mandatory minimal-scrollbar scrollbar-hide">
          <div className="flex gap-3 sm:gap-4 md:gap-6 pl-1">
            {skeletonCards}
            <div className="flex-shrink-0 w-4"></div>
          </div>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="flex overflow-x-auto pb-6 sm:pb-8 snap-x snap-mandatory minimal-scrollbar scrollbar-hide">
          <div className="flex gap-3 sm:gap-4 md:gap-6 pl-1">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="snap-start flex-shrink-0"
                style={{ width: 'calc(80vw - 32px)', maxWidth: '22rem' }}
              >
                <ProductCardwithoutCart
                  className="w-full h-full"
                  image={product.productImages[0] ?? 'placeholder.svg'}
                  name={product.name}
                  rating={Number(product.averageRating)}
                  ourPrice={Number(product.ourPrice)}
                  mrp={Number(product.mrp)}
                  discount={product.discount}
                />
              </div>
            ))}
            <div className="flex-shrink-0 w-4"></div>
          </div>
        </div>
      ) : (
        <div className="w-full flex items-center justify-center min-h-[300px] px-4">
          <div className="text-center max-w-md">
            <div className="mb-5 text-primary animate-bounce">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-14 w-14 mx-auto"
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
            <h3 className="text-2xl font-bold text-gray-800 mb-2 nohemi-bold">No Products Found</h3>
            <p className="text-sm text-gray-600">
              We currently don’t have any{' '}
              <span className="font-medium text-gray-700">
                {activeBrand.charAt(0).toUpperCase() + activeBrand.slice(1)}
              </span>{' '}
              products.
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Please check back later or explore other brands.
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