'use client';
import { useState, memo, useMemo } from 'react';
import ProductCardwithoutCart from '@/components/Product/ProductCards/ProductCardwithoutCart';
import PrimaryLinkButton from '@/components/Reusable/PrimaryLinkButton';
import { ProductCardSkeleton } from '@/components/Reusable/ProductCardSkeleton';
import { useHomeStore } from '@/store/home-store';

interface VariantCard {
  productId: string;
  variantId: string;
  variant: {
    name: string;
    slug: string;
    mrp: number;
    ourPrice: number;
    productImages: string[];
  };
  averageRating: number;
  createdAt: string;
}

const FeaturedProducts: React.FC = () => {
  const { featuredProducts } = useHomeStore();
  const [loading] = useState(false);

  const variantCards: VariantCard[] = useMemo(() => {
    return featuredProducts
      .map(({ productId, variantId, product, variant }: any) => ({
        productId,
        variantId,
        variant,
        averageRating: product?.averageRating ?? 0,
        createdAt: product?.createdAt ?? '',
      }))
      .sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10);
  }, [featuredProducts]);

  const calculateDiscount = (mrp: number, ourPrice: number): number => {
    if (mrp <= 0 || ourPrice >= mrp) return 0;
    return Math.round(((mrp - ourPrice) / mrp) * 100);
  };

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
            ) : variantCards.length > 0 ? (
              <div className="flex gap-6 pl-1">
                {variantCards.map(({ productId, variantId, variant, averageRating }) => {
                  const mrp = Number(variant.mrp);
                  const ourPrice = Number(variant.ourPrice);
                  const discount = calculateDiscount(mrp, ourPrice);

                  return (
                    <div
                      key={`${productId}-${variantId}`}
                      className="snap-start flex-shrink-0 relative"
                      style={{ width: 'calc(80vw - 32px)', maxWidth: '22rem' }}
                    >
                      <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                        Featured
                      </span>
                      <ProductCardwithoutCart
                        productId={productId}
                        variantId={variantId}
                        slug={variant.slug}
                        className="w-full h-full"
                        image={variant.productImages?.[0] ?? '/placeholder.svg'}
                        name={variant.name}
                        rating={Number(averageRating)}
                        ourPrice={ourPrice}
                        mrp={mrp}
                        discount={discount}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col mx-auto items-center justify-center py-16 text-center px-4">
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
                  No featured products are available. Please check back later or explore other categories.
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
