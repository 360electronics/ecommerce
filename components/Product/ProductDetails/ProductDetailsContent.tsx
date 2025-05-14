'use client';

import { Heart, Minus, Plus, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductContext } from '@/context/product-context';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { encodeUUID } from '@/utils/Encryption';
import { useAuth } from '@/context/auth-context';
import { useProfileContext } from '@/context/profile-context';
import { useWishlist } from '@/context/wishlist-context';
import toast, { Toaster } from 'react-hot-toast';
import { addToWishlist, removeFromWishlist } from '@/utils/wishlist.utils';
import { useCart } from '@/context/cart-context';

interface ProductDetailsContentProps {
  className?: string;
}

export default function ProductDetailsContent({ className }: ProductDetailsContentProps) {
  const {
    product,
    selectedColor,
    setSelectedColor,
    selectedStorage,
    setSelectedStorage,
    quantity,
    setQuantity,
    handleBuyNow,
  } = useProductContext();
  const router = useRouter();
  const { user } = useAuth();
  const { isInWishlist, refreshWishlist } = useWishlist();
  const { refetch: refetchProfile } = useProfileContext();
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const userId = user?.id;

  const isInWishlistStatus = product.productId && product.id ? isInWishlist(product.productId, product.id) : false;

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId || !product.productId || !product.id) {
      toast.error('Please login or provide valid product.');
      return;
    }

    setIsAdding(true);
    let result;
    if (isInWishlistStatus) {
      result = await removeFromWishlist(userId, product.productId, product.id);
    } else {
      result = await addToWishlist(userId, product.productId, product.id);
    }
    setIsAdding(false);

    if (result.success) {
      toast.success(isInWishlistStatus ? 'Removed from wishlist!' : 'Added to wishlist!');
      refreshWishlist();
      if (refetchProfile) {
        refetchProfile();
      }
    } else {
      toast.error(result.message || `Failed to ${isInWishlistStatus ? 'remove from' : 'add to'} wishlist`);
    }
  };

  const handleCartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId || !product.productId || !product.id) {
      toast.error('Please login or provide valid product.');
      return;
    }

    setIsAdding(true);
    

    await addToCart(product.productId, product.id, quantity);

    setIsAdding(false);
  };
  
  // Find the active variant based on selectedColor and selectedStorage
  const activeVariant = useMemo(() => {
    return product.productParent.variants.find(
      (v) => v.color === selectedColor && v.storage === selectedStorage
    ) || product.productParent.variants[0]; // Fallback to first variant
  }, [selectedColor, selectedStorage, product.productParent.variants]);

  // Get unique color options
  const colorOptions = useMemo(() => {
    const options = product.productParent.variants
      .map((variant) => ({
        value: variant.color,
        name: variant.color,
        isValid: true, // Simplified: assume all colors are valid
        variantId: variant.id,
        slug: variant.slug,
      }))
      .filter((option, index, self) =>
        index === self.findIndex((t) => t.value === option.value)
      );
    return options;
  }, [product.productParent.variants]);

  // Get storage options filtered by selected color
  const storageOptions = useMemo(() => {
    const options = product.productParent.variants
      .filter((variant) => variant.color === selectedColor)
      .map((variant) => ({
        value: variant.storage,
        label: variant.storage,
        variantId: variant.id,
        slug: variant.slug,
      }))
      .filter((option, index, self) =>
        index === self.findIndex((t) => t.value === option.value)
      );
    return options;
  }, [selectedColor, product.productParent.variants]);

  // Update route and ensure valid selection when variant changes
  useEffect(() => {
    if (!activeVariant) {
      // Reset to first available variant if current selection is invalid
      const firstVariant = product.productParent.variants[0];
      setSelectedColor(firstVariant.color);
      setSelectedStorage(firstVariant.storage);
      return;
    }

    if (activeVariant.id !== product.id) {
      const encodedProductId = encodeUUID(product.productId);
      router.push(`/product/${encodedProductId}/${activeVariant.slug}`);
    }
  }, [activeVariant, product, router, setSelectedColor, setSelectedStorage]);

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // Calculate discount based on active variant
  const discount = activeVariant.mrp && activeVariant.ourPrice && activeVariant.mrp > activeVariant.ourPrice
    ? Math.round(((activeVariant.mrp - activeVariant.ourPrice) / activeVariant.mrp) * 100)
    : product.discount || 0;

  return (
    <div className={cn(`md:ml-14`, className)}>
      <Toaster />
      <div className="hidden md:flex flex-row items-center gap-2 justify-end mb-5 my-2 cursor-pointer text-xs md:text-base">
        <Share2 className="md:w-5 md:h-5 w-4 h-4" />
        <p>Share</p>
      </div>

      {/* Product Name */}
      <h1 className="md:text-xl text-sm md:font-medium md:mb-6 md:border-b md:pb-4 mt-5 mb-2 md:my-0">
        {product.name} ({selectedColor}, {selectedStorage})
      </h1>

      {/* Mobile - Pricing */}
      <div className="md:hidden flex flex-row items-center justify-between">
        <div className="flex items-center gap-3 md:mb-6 mb-5">
          {activeVariant.mrp && activeVariant.mrp > activeVariant.ourPrice && (
            <div className="md:hidden items-center gap-1 text-base text-gray-400">
              <span>MRP</span>
              <div className="relative inline-block">
                <span>₹{activeVariant.mrp.toLocaleString()}</span>
                <span className="absolute left-0 top-1/2 w-full h-[1.5px] bg-gray-400 transform rotate-[5deg] origin-center" />
              </div>
            </div>
          )}

          <span className="text-lg font-bold nohemi-bold">₹{activeVariant.ourPrice.toLocaleString()}</span>

          {discount > 0 && (
            <span className="bg-red-600 text-white text-xs font-lighter px-2 py-1 rounded-full">
              {discount}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Mobile - QTY & Stocks */}
      <div className="md:hidden w-full">
        <div className="flex items-center mb-4 w-full">
          <div className="flex flex-col items-start w-full">
            <div className="flex flex-row items-center justify-between w-full">
              <div className="flex items-center border border-gray-300 rounded-full px-2 p-1 text-xs md:text-base">
                <span className="mr-3 text-gray-700">Qty</span>
                <button
                  onClick={decreaseQuantity}
                  className="px-2 cursor-pointer py-1 rounded-l-full"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4 border rounded-full" />
                </button>
                <span className="px-3 py-1">{quantity}</span>
                <button
                  onClick={increaseQuantity}
                  className="px-2 cursor-pointer py-1 rounded-r-full"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4 border rounded-full" />
                </button>
              </div>

              {Number(activeVariant.stock) > 0 && (
                <button className="text-green-600 text-xs font-medium border border-green-600 bg-green-100 rounded-full px-2 p-1">
                  In Stock
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Options */}
      <div className="space-y-6 mt-5 md:mt-0">
        {/* Storage Options */}
        {storageOptions.length > 0 && (
          <div className="flex md:flex-row flex-col md:items-center justify-between">
            <h3 className="md:text-base text-sm font-medium mb-3">RAM / Internal Storage</h3>
            <div className="flex gap-3">
              {storageOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedStorage(option.value)}
                  className={cn(
                    'px-4 py-1.5 rounded-full md:text-sm text-xs border',
                    selectedStorage === option.value
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-300 hover:border-gray-400',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Options */}
        {colorOptions.length > 0 && (
          <div className="mt-6 hidden md:flex flex-row items-center justify-between">
            <div className="mb-2">
              <h3 className="text-base font-medium mb-3">Color</h3>
              <span className="text-gray-700">
                {colorOptions.find((c) => c.value === selectedColor)?.name || 'Default'}
              </span>
            </div>
            <div className="flex gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    setSelectedColor(color.value);
                    // Set storage to first available for this color
                    const validStorage = product.productParent.variants
                      .find((v) => v.color === color.value)?.storage;
                    if (validStorage) setSelectedStorage(validStorage);
                  }}
                  className={cn(
                    'w-10 h-10 rounded-full border',
                    selectedColor === color.value
                      ? 'p-1 outline-2 border border-white'
                      : 'border-gray-300',
                    !color.isValid && 'opacity-50 cursor-not-allowed',
                  )}
                  style={{ backgroundColor: color.value }}
                  aria-label={`Select ${color.name} color`}
                />
              ))}
            </div>
          </div>
        )}
        <hr className="bg-gray-400 md:block hidden" />
      </div>

      {/* Desktop - Product Pricing */}
      <div className="hidden md:flex flex-col gap-2">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-6 mt-6">
            <span className="text-3xl font-bold nohemi-bold">₹{activeVariant.ourPrice.toLocaleString()}</span>

            {activeVariant.mrp && activeVariant.mrp > activeVariant.ourPrice && (
              <div className="flex items-center gap-1 text-lg text-gray-400">
                <span>MRP</span>
                <div className="relative inline-block">
                  <span>₹{activeVariant.mrp.toLocaleString()}</span>
                  <span className="absolute left-0 top-1/2 w-full h-[1.5px] bg-gray-400 transform rotate-[5deg] origin-center" />
                </div>
              </div>
            )}

            {discount > 0 && (
              <span className="bg-red-600 text-white text-xs font-lighter px-2 py-1 rounded-full">
                {discount}% OFF
              </span>
            )}
          </div>

          {Number(activeVariant.stock) > 0 && (
            <button className="text-green-600 text-sm font-medium border border-green-600 bg-green-100 rounded-full px-2 p-1">
              In Stock
            </button>
          )}
        </div>

        <div className="flex items-center mb-4">
          <div className="flex items-center">
            <div className="flex items-center border border-gray-300 rounded-full px-2 p-1">
              <span className="mr-3 text-gray-700">Qty</span>
              <button
                onClick={decreaseQuantity}
                className="px-2 cursor-pointer py-1 rounded-l-full"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4 border rounded-full" />
              </button>
              <span className="px-3 py-1">{quantity}</span>
              <button
                onClick={increaseQuantity}
                className="px-2 cursor-pointer py-1 rounded-r-full"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4 border rounded-full" />
              </button>
            </div>

            <button
              onClick={handleWishlistClick}
              className={` cursor-pointer ml-2 z-0 p-2 rounded-full 
              ${isInWishlistStatus ? 'text-red-500 bg-red-200' : 'text-gray-400'} 
              bg-gray-300 hover:text-gray-700 disabled:opacity-50`}
              disabled={isAdding}
              aria-label={isInWishlistStatus ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                size={20}
                fill={isInWishlistStatus ? 'red' : 'none'}
                className={isInWishlistStatus ? 'text-red-500' : 'text-gray-400'}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop - Product Actions */}
      <div className="hidden md:block mt-2">
        <div className="grid grid-cols-2 gap-4 md:w-[60%]">
          <button
            onClick={handleCartClick}
            className="flex-1 py-3 px-4 rounded-full cursor-pointer border border-gray-300 hover:border-gray-400 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
            disabled={isAdding}
          >
            {isAdding ? 'Adding...' : 'Add to cart'}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5H17.5L16 12H6.5L5 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path
                d="M5 5L4.5 3H2.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.5 12L6 14H16.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="7.5" cy="17" r="1" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="15.5" cy="17" r="1" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 py-3 px-4 rounded-full cursor-pointer bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2 font-medium"
          >
            Buy Now
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.75 10H16.25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M11.25 5L16.25 10L11.25 15"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}