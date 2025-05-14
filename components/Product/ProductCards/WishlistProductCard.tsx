"use client"

import type React from "react"
import { Heart, ShoppingCart } from "lucide-react";
import Image from "next/image"
import Link from "next/link"
import { ProductCardProps } from "@/types/product"
import { addToWishlist, removeFromWishlist } from "@/utils/wishlist.utils"; // Add removeFromWishlist
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/context/auth-context";
import { useEffect, useState } from "react";
import { useWishlist } from "@/context/wishlist-context";
import { useProfileContext } from "@/context/profile-context";
import { encodeUUID } from "@/utils/Encryption";
import { useCart } from "@/context/cart-context";


const WishlistProductCard: React.FC<ProductCardProps> = ({
  image,
  name,
  rating,
  ourPrice,
  mrp,
  discount: providedDiscount,
  showViewDetails = true,
  className = "",
  slug,
  onAddToCart,
  isHeartNeed = true,
  productId,
  variantId
}) => {
  const { user } = useAuth();
  const { refreshWishlist } = useWishlist();
  const profileContext = useProfileContext();
  const [isAdding, setIsAdding] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const userId = user?.id;

  const { addToCart } = useCart();

  // Check if product is in wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!userId || !productId) {
        setIsInWishlist(false);
        return;
      }

      // Use wishlistItems from ProfileContext if available
      if (profileContext?.wishlistItems) {
        setIsInWishlist(
          profileContext.wishlistItems.some((item) => item.productId === productId)
        );
        return;
      }

      try {
        const res = await fetch(`/api/users/wishlist?userId=${userId}`);
        if (res.ok) {
          const wishlistData = await res.json();
          setIsInWishlist(
            Array.isArray(wishlistData) &&
            wishlistData.some((item: { productId: string }) => item.productId === productId)
          );
        } else {
          setIsInWishlist(false);
        }
      } catch (error) {
        console.error("Error checking wishlist status:", error);
        setIsInWishlist(false);
      }
    };

    checkWishlistStatus();
  }, [userId, productId, profileContext?.wishlistItems]);

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId || !productId || !variantId) {
      toast.error("Please login or provide valid product.");
      return;
    }

    setIsAdding(true);
    let result;
    if (isInWishlist) {
      // Remove from wishlist
      result = await removeFromWishlist(userId, productId, variantId); // Implement removeFromWishlist
    } else {
      // Add to wishlist
      result = await addToWishlist(userId, productId, variantId);
    }
    setIsAdding(false);

    if (result.success) {
      toast.success(isInWishlist ? "Removed from wishlist!" : "Added to wishlist!");
      setIsInWishlist(!isInWishlist);
      refreshWishlist();
      if (profileContext?.refetch) {
        profileContext.refetch(); // Refresh ProfileContext data
      }
    } else {
      toast.error(result.message || `Failed to ${isInWishlist ? "remove from" : "add to"} wishlist`);
    }
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
              ${isInWishlist ? "text-red-500 bg-red-200" : "text-gray-400"} 
              bg-gray-300 hover:text-gray-700 disabled:opacity-50`}
            disabled={isAdding}
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart
              size={18}
              fill={isInWishlist ? "red" : "none"}
              className={isInWishlist ? "text-red-500" : "text-gray-400"}
            />
          </button>
        )}
        {/* Remove button (only shown when onRemove is provided) */}
        {onAddToCart && (
          <button
            onClick={() => addToCart(productId, variantId, 1)}
            className="absolute right-2 bottom-0 z-10 rounded-full bg-black p-2 text-white shadow-md hover:text-white cursor-pointer"
          >
            <ShoppingCart size={18} />
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

export default WishlistProductCard