'use client';

import { useState, useCallback } from 'react';
import { Heart, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useProfileStore } from '@/store/profile-store';
import { encodeUUID } from '@/utils/Encryption';
import { addToWishlist, removeFromWishlist } from '@/utils/wishlist.utils';

// Types (aligned with provided schema)
interface ProductImage {
  url: string;
  alt: string;
  isFeatured: boolean;
  displayOrder: number;
}

interface ProductCardProps {
  image?: string;
  name: string;
  rating?: number;
  ourPrice?: number;
  mrp?: number;
  discount?: number;
  showViewDetails?: boolean;
  className?: string;
  slug: string;
  onRemove?: () => void;
  isHeartNeed?: boolean;
  productId: string;
  variantId: string;
}

const ProductCardwithoutCart: React.FC<ProductCardProps> = ({
  image,
  name,
  rating,
  ourPrice,
  mrp,
  discount: providedDiscount,
  showViewDetails = true,
  className = '',
  slug,
  onRemove,
  isHeartNeed = true,
  productId,
  variantId,
}) => {
  const { user } = useAuthStore();
  const { isInWishlist, fetchWishlist } = useWishlistStore();
  const { refetch: refetchProfile } = useProfileStore();
  const [isAdding, setIsAdding] = useState(false);
  const userId = user?.id;

  const isInWishlistStatus = productId && variantId ? isInWishlist(productId, variantId) : false;

  const handleWishlistClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!userId || !productId || !variantId) {
        alert('Please login or provide valid product.');
        return;
      }

      setIsAdding(true);
      try {
        let result;
        if (isInWishlistStatus) {
          result = await removeFromWishlist(userId, productId, variantId);
        } else {
          result = await addToWishlist(userId, productId, variantId);
        }

        if (result.success) {
          alert(isInWishlistStatus ? 'Removed from wishlist!' : 'Added to wishlist!');
          fetchWishlist();
          if (refetchProfile) {
            await refetchProfile('profile', userId); // Fix: Pass required arguments
          }
        } else {
          throw new Error(result.message || `Failed to ${isInWishlistStatus ? 'remove from' : 'add to'} wishlist`);
        }
      } catch (error: any) {
        console.error('[WISHLIST_ERROR]', error);
        alert(error.message || `Failed to ${isInWishlistStatus ? 'remove from' : 'add to'} wishlist`);
      } finally {
        setIsAdding(false);
      }
    },
    [userId, productId, variantId, isInWishlistStatus, fetchWishlist, refetchProfile]
  );

  const calculateDiscount = useCallback(() => {
    if (mrp && ourPrice && mrp > ourPrice && mrp > 0) {
      return Math.round(((mrp - ourPrice) / mrp) * 100);
    }
    return null;
  }, [mrp, ourPrice]);

  const discount = providedDiscount ?? calculateDiscount();

  const renderRating = useCallback(() => {
    if (typeof rating !== 'number' || isNaN(rating) || rating < 0 || rating > 5) return null;

    const stars = Array(5)
      .fill(0)
      .map((_, index) => (
        <span
          key={index}
          className={cn('text-lg', index < Math.floor(rating) ? 'text-yellow-500' : 'text-gray-300')}
        >
          ★
        </span>
      ));

    return (
      <div className="flex items-center">
        <span className="mr-1 font-medium">{rating.toFixed(1)}</span>
        <div className="flex">{stars}</div>
      </div>
    );
  }, [rating]);

  const encodedProductId = productId ? encodeUUID(productId) : '';

  return (
    <Link
      href={`/product/${encodedProductId}/${slug}`}
      className={cn('w-full rounded-lg cursor-pointer', className)}
      aria-label={`View details for ${name}`}
    >
      <div className="relative">
        {/* Wishlist button */}
        {isHeartNeed && (
          <button
            onClick={handleWishlistClick}
            className={cn(
              'absolute cursor-pointer right-0 bottom-0 z-10 p-2 rounded-full',
              isInWishlistStatus ? 'text-red-500 bg-red-200 hover:text-red-700' : 'text-gray-400 bg-gray-300 hover:text-gray-700',
              isAdding && 'opacity-50 cursor-not-allowed'
            )}
            disabled={isAdding}
            aria-label={isInWishlistStatus ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={18}
              fill={isInWishlistStatus ? 'red' : 'none'}
              className={cn(isInWishlistStatus ? 'text-red-500' : 'text-gray-400')}
            />
          </button>
        )}

        {/* Remove button */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute right-5 top-5 z-10 rounded-full bg-white p-1 text-red-500 shadow-md hover:bg-red-500 hover:text-white cursor-pointer"
            aria-label="Remove product"
          >
            <X size={16} />
          </button>
        )}

        {/* Product Image */}
        <div className="mb-4 relative w-full aspect-square border group border-gray-100 rounded-md bg-[#F4F4F4] overflow-hidden">
          <Image
            src={image || '/placeholder.png'}
            alt={name || 'Product'}
            fill
            className="max-h-full max-w-full object-contain p-6 group-hover:scale-105 duration-200 mix-blend-multiply"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'contain' }}
          />
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="text-base font-medium text-gray-900 line-clamp-2">{name}</h3>

          {/* Rating */}
          {renderRating()}

          {/* Price Info */}
          <div className="flex items-center flex-wrap gap-2">
            {ourPrice !== undefined && ourPrice !== null && ourPrice >= 0 && (
              <span className="text-lg font-bold">₹{Number(ourPrice).toLocaleString()}</span>
            )}
            {mrp && mrp > 0 && ourPrice !== undefined && ourPrice !== null && mrp > ourPrice && (
              <span className="text-sm text-gray-500 line-through">MRP ₹{Number(mrp).toLocaleString()}</span>
            )}
            {discount && discount > 0 && (
              <span className="rounded-full bg-offer px-2 py-1 text-xs font-medium text-white">
                {discount}% Off
              </span>
            )}
          </div>

          {/* View Details */}
          {showViewDetails && (
            <div className="pt-2">
              <div className="text-sm text-gray-500 hover:text-gray-700">View full details</div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCardwithoutCart;