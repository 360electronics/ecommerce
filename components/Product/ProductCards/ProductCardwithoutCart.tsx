'use client';

import { useState, useCallback, useEffect, JSX } from 'react';
import { Heart, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useProfileStore } from '@/store/profile-store';
import toast from 'react-hot-toast';
import { showFancyToast } from '@/components/Reusable/ShowCustomToast';

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
  status?: string;
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
  status
}) => {
  const { isInWishlist, addToWishlist, removeFromWishlist, isLoading } = useWishlistStore();
  const { isLoggedIn, fetchAuthStatus, user } = useAuthStore();
  const { refetch: refetchProfile } = useProfileStore();
  const [isAdding, setIsAdding] = useState(false);
  const router = useRouter();

  const isInWishlistStatus = productId && variantId ? isInWishlist(productId, variantId) : false;

  // useEffect(() => {
  //   if (!isLoggedIn) {
  //     fetchAuthStatus();
  //   }
  // }, [isLoggedIn, fetchAuthStatus]);

  const handleWishlistClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isLoggedIn) {
        showFancyToast({
          title: 'Login Required',
          message: 'Please sign in to manage your wishlist.',
          type: 'error',
        });
        router.push('/signin');
        return;
      }

      if (!productId || !variantId || productId === '' || variantId === '') {
        console.error('Invalid product or variant:', { productId, variantId });
        showFancyToast({
          title: 'Invalid Selection',
          message: 'Product or variant details are missing or incorrect.',
          type: 'error',
        });
        return;
      }

      setIsAdding(true);
      try {
        const success = isInWishlistStatus
          ? await removeFromWishlist(productId, variantId, () => refetchProfile('profile', ''))
          : await addToWishlist(productId, variantId, () => refetchProfile('profile', ''));

          

        if (success) {
          showFancyToast({
            title: isInWishlistStatus ? 'Wishlist Updated' : 'Added to Wishlist',
            message: isInWishlistStatus
              ? 'The item has been removed from your wishlist.'
              : 'The item has been added to your wishlist.',
            type: 'success',
          });
        }
      } catch (error) {
        console.error('[WISHLIST_ERROR]', { productId, variantId, error });
      } finally {
        setIsAdding(false);
      }
    },
    [isLoggedIn, isInWishlistStatus, productId, variantId, addToWishlist, removeFromWishlist, refetchProfile, router]
  );

  const calculateDiscount = useCallback((): number | null => {
    if (mrp && ourPrice && mrp > ourPrice && mrp > 0) {
      return Math.round(((mrp - ourPrice) / mrp) * 100);
    }
    return null;
  }, [mrp, ourPrice]);

  const discount = providedDiscount ?? calculateDiscount();

  const renderRating = useCallback((): JSX.Element | null => {
    if (typeof rating !== 'number' || isNaN(rating) || rating <= 3 || rating > 5) return null;
  
    const stars = Array(5)
      .fill(0)
      .map((_, index) => (
        <span
          key={index}
          className={cn('text-[10px] sm:text-sm', index < Math.floor(rating) ? 'text-yellow-500' : 'text-gray-300')}
        >
          ★
        </span>
      ));
  
    return (
      <div className="flex items-center">
        <span className="mr-1 font-medium text-[10px] sm:text-sm">{rating.toFixed(1)}</span>
        <div className="flex">{stars}</div>
      </div>
    );
  }, [rating]);

  return (
    <Link
      href={`/product/${slug}`}
      // target='_blank'
      className={cn(
        ' rounded-lg cursor-pointer ',
        className
      )}
      aria-label={`View details for ${name}`}
    >
      <div className="relative">
        {/* Wishlist button */}
        {isHeartNeed && (
          <button
            onClick={handleWishlistClick}
            className={cn(
              'absolute right-1 sm:right-2 bottom-0 z-10 p-1.5 sm:p-2 rounded-full transition-colors',
              isInWishlistStatus ? 'text-red-500 bg-red-100 hover:bg-red-200' : 'text-gray-500 bg-gray-100 hover:bg-gray-200',
              (isAdding || isLoading) && 'opacity-50 cursor-not-allowed'
            )}
            disabled={isAdding || isLoading}
            aria-label={isInWishlistStatus ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={14}
              fill={isInWishlistStatus ? 'red' : 'none'}
              className={cn(isInWishlistStatus ? 'text-red-500' : 'text-gray-500')}
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
            className="absolute right-3 sm:right-5 top-3 sm:top-5 z-10 rounded-full bg-white p-1 text-red-500 shadow-md hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Remove product"
          >
            <X size={12} />
          </button>
        )}

        {/* Product Image */}
        <div className="mb-2 sm:mb-4 relative w-full aspect-square border border-gray-100 rounded-md bg-[#F4F4F4] overflow-hidden">
        {status?.toLowerCase() === 'coming_soon' && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-200 to-yellow-400 text-[10px] sm:text-xs px-2 py-1 rounded-full ">
              Coming Soon
            </div>
          )}
          <img
            src={image || '/placeholder.png'}
            alt={name || 'Product'}
            className="max-h-full max-w-full w-full h-full object-contain p-3 sm:p-6 group-hover:scale-105 duration-200 mix-blend-multiply"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
            style={{ objectFit: 'contain' }}
          />
        </div>

        {/* Product Info */}
        <div className="space-y-1 sm:space-y-2">
          <h3 className="text-[10px] sm:text-xs md:text-base font-semibold text-gray-900 line-clamp-2">{name}</h3>

          {/* Rating */}
          {renderRating()}

          {/* Price Info */}
          <div className="flex items-center flex-wrap gap-1 sm:gap-2">
            {ourPrice !== undefined && ourPrice !== null && ourPrice >= 0 && (
              <span className="text-sm sm:text-base md:text-lg font-bold">₹{Number(ourPrice).toLocaleString()}</span>
            )}
            {mrp && mrp > 0 && ourPrice !== undefined && ourPrice !== null && mrp > ourPrice && (
              <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 line-through">
                MRP ₹{Number(mrp).toLocaleString()}
              </span>
            )}
            {discount && discount > 0 && (
              <span className="rounded-full bg-red-600 px-1 sm:px-1.5 py-0.5 sm:py-1 text-[8px] sm:text-[10px] md:text-xs font-medium text-white">
                {discount}% Off
              </span>
            )}
          </div>

          {/* View Details */}
          {showViewDetails && (
            <div className="pt-1 sm:pt-2">
              <div className="text-[10px] sm:text-[12px] md:text-sm text-gray-500 hover:text-gray-700">
                View full details
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCardwithoutCart;