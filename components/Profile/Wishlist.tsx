// pages/Wishlist.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { AlertCircle, Heart } from 'lucide-react';
import Link from 'next/link';
import WishlistProductCard from '../Product/ProductCards/WishlistProductCard';
import { ProductCardSkeleton } from '../Reusable/ProductCardSkeleton';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { wishlist: wishlistItems, wishlistCount, isLoading, isRefetching, errors, fetchWishlist } = useWishlistStore();
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // Fetch wishlist on mount if user is authenticated
  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchWishlist(true); // Force fetch on mount
    }
  }, [authLoading, user?.id, fetchWishlist]);

  const handleRemoveFromWishlist = async (productId: string, variantId: string) => {
    setIsRemoving(`${productId}-${variantId}`);
    try {
      await useWishlistStore.getState().removeFromWishlist(productId, variantId);
      fetchWishlist()
    } catch (error) {
      toast.error('Failed to remove item from wishlist');
    } finally {
      setIsRemoving(null);
    }
  };

  const renderSkeletons = () => {
    return Array(6)
      .fill(0)
      .map((_, index) => (
        <div key={`skeleton-${index}`} className="snap-start flex-shrink-0 w-72">
          <ProductCardSkeleton />
        </div>
      ));
  };

  if (authLoading || isLoading || isRefetching) {
    return <div className="flex flex-wrap w-full justify-between gap-6 pl-1">{renderSkeletons()}</div>;
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 my-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Authentication required</h3>
            <p className="text-sm text-yellow-700 mt-1">Please log in to view your wishlist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 nohemi-bold">
          My <span className="text-primary border-b-3 border-primary">Wishlist</span>
        </h1>
        <span className="text-2xl text-gray-500 nohemi-bold">({wishlistCount})</span>
      </div>

      {(errors.fetch || errors.add || errors.remove) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">
                {errors.fetch || errors.add || errors.remove}
              </p>
            </div>
          </div>
        </div>
      )}

      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id}>
              <WishlistProductCard
                productId={item.productId}
                variantId={item.variantId}
                name={item.variant.name}
                mrp={Number(item.variant.mrp)}
                ourPrice={Number(item.variant.ourPrice)}
                slug={item.variant.slug}
                image={item.variant.productImages[0]}
                onRemove={() => handleRemoveFromWishlist(item.productId, item.variantId)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add some products to your wishlist to see them here.
          </p>
          <div className="mt-6">
            <Link
              href="/category/all"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              aria-label="Browse products"
            >
              Browse products
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}