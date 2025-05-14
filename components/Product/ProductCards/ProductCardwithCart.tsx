

"use client"

import type React from "react"
import { Heart, ShoppingCart, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ProductCardProps } from "@/types/product"
import { addToWishlist, removeFromWishlist } from "@/utils/wishlist.utils"; // Add removeFromWishlist
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/context/auth-context";
import { useState } from "react";
import { useWishlist } from "@/context/wishlist-context";
import { useProfileContext } from "@/context/profile-context";
import { encodeUUID } from "@/utils/Encryption"
import { useCart } from "@/context/cart-context"


const ProductCardwithCart: React.FC<ProductCardProps> = ({
  image,
  name,
  rating,
  ourPrice,
  mrp,
  discount: providedDiscount,
  showViewDetails = true,
  className = "",
  slug,
  onRemove,
  isHeartNeed = true,
  productId,
  variantId
}) => {
  const { user } = useAuth();
  const { isInWishlist, refreshWishlist } = useWishlist();
  const { refetch: refetchProfile } = useProfileContext();
  const [isAdding, setIsAdding] = useState(false);
  const userId = user?.id;

  const { addToCart } = useCart();

  const isInWishlistStatus = productId && variantId ? isInWishlist(productId, variantId) : false;

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId || !productId || !variantId) {
      toast.error('Please login or provide valid product.');
      return;
    }

    setIsAdding(true);
    let result;
    if (isInWishlistStatus) {
      result = await removeFromWishlist(userId, productId, variantId);
    } else {
      result = await addToWishlist(userId, productId, variantId);
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

    if (!userId || !productId || !variantId) {
      toast.error('Please login or provide valid product.');
      return;
    }

    setIsAdding(true);
    
    await addToCart(productId, variantId, 1);

    setIsAdding(false);
  };

  const calculateDiscount = () => {
    if (mrp && ourPrice && mrp > ourPrice) {
      return Math.round(((mrp - ourPrice) / mrp) * 100);
    }
    return null;
  };

  const discount = providedDiscount || calculateDiscount();

  const renderRating = () => {
    if (typeof rating !== "number" || isNaN(rating)) return null;

    const stars = Array(5)
      .fill(0)
      .map((_, index) => (
        <span
          key={index}
          className={`text-lg ${index < Math.floor(rating) ? "text-yellow-500" : "text-gray-300"}`}
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
  };

  // Encode productId for the URL
  const encodedProductId = productId ? encodeUUID(productId) : '';

  return (
    <Link href={`/product/${encodedProductId}/${slug}`} className={`w-full rounded-lg cursor-pointer ${className}`}>
      <Toaster />
      <div className="relative">
        {/* Wishlist button */}
        {isHeartNeed && (
          <button
            onClick={handleWishlistClick}
            className={`absolute cursor-pointer right-12 bottom-0 z-10 p-2 rounded-full 
              ${isInWishlistStatus ? 'text-red-500 bg-red-200' : 'text-gray-400'} 
              bg-gray-300 hover:text-gray-700 disabled:opacity-50`}
            disabled={isAdding}
            aria-label={isInWishlistStatus ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              size={18}
              fill={isInWishlistStatus ? 'red' : 'none'}
              className={isInWishlistStatus ? 'text-red-500' : 'text-gray-400'}
            />
          </button>
        )}

        <button onClick={handleCartClick} className=" absolute right-2 bottom-0 bg-black rounded-full p-2 text-white cursor-pointer">
          <ShoppingCart size={18} />
        </button>

        {/* Remove button (only shown when onRemove is provided) */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute right-5 top-5 z-10 rounded-full bg-white p-1 text-red-500 shadow-md hover:bg-red-500 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        )}

        {/* Product image with transparent background support */}
        <div className="mb-4 relative w-full aspect-square border group border-gray-100 rounded-md bg-[#F4F4F4] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-6 mix-blend-multiply">
            <Image
              src={image || "/placeholder.svg"}
              alt={name || "Product"}
              width={250}
              height={250}
              className="max-h-full max-w-full object-contain group-hover:scale-105 duration-200"
              style={{ objectFit: "contain", mixBlendMode: "multiply" }}
            />
          </div>
        </div>

        {/* Product info */}
        <div className="space-y-2">
          <h3 className="text-base font-medium text-gray-900 line-clamp-2">{name}</h3>

          {/* Rating - only shown if rating exists */}
          {renderRating()}

          {/* Price */}
          <div className="flex items-center flex-wrap gap-2">
            {ourPrice !== null && ourPrice !== undefined && (
              <span className="text-lg font-bold">₹{typeof ourPrice === 'number' ? ourPrice.toLocaleString() : ourPrice}</span>
            )}
            {mrp && mrp > 0 && ourPrice && (
              <span className="text-sm text-gray-500 line-through">MRP {typeof mrp === 'number' ? mrp.toLocaleString() : mrp}</span>
            )}
            {discount && discount > 0 && (
              <span className="rounded-full bg-offer px-2 py-1 text-xs font-medium text-white">{discount}% Off</span>
            )}
          </div>


          {/* View details link */}
          {showViewDetails && (
            <div className="pt-2">
              <div className="text-sm text-gray-500 hover:text-gray-700">
                View full details
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ProductCardwithCart