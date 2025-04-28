"use client"

import type React from "react"
import { Heart, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface ProductCardProps {
  image?: string
  title: string
  rating: number
  price: number
  mrp?: number
  discount?: number
  showViewDetails?: boolean
  className?: string // Added className prop for custom styling
  onRemove?: () => void // Added for subproduct removal
  isHeartNeed?: boolean
}

const ProductCardwithoutCart: React.FC<ProductCardProps> = ({
  image,
  title,
  rating,
  price,
  mrp,
  discount,
  showViewDetails = true,
  className = "", // Default to empty string
  onRemove,
  isHeartNeed = true,
}) => {
  const stars = Array(5)
    .fill(0)
    .map((_, index) => (
      <span key={index} className={`text-lg ${index < Math.floor(rating) ? "text-yellow-500" : "text-gray-300"}`}>
        ★
      </span>
    ))

  return (
    <div className={`w-full rounded-lg ${className}`}>
      <div className="relative">
        {/* Wishlist button */}
        {isHeartNeed && (
          <button className="absolute right-5 top-5 z-10 text-gray-400 hover:text-gray-700">
            <Heart size={20} />
          </button>
        )}

        {/* Remove button (only shown when onRemove is provided) */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute right-5 top-5 z-10 rounded-full bg-white p-1 text-red-500 shadow-md  hover:text-white hover:bg-red-500 cursor-pointer"
          >
            <X size={16} />
          </button>
        )}

        {/* Product image with square aspect ratio */}
        <div className="mb-4 relative w-full aspect-square border border-gray-100 rounded-md bg-[#F4F4F4] overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <Image
              src={image || "/placeholder.svg"}
              alt={title}
              width={250}
              height={250}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>

        {/* Product info */}
        <div className="space-y-2">
          <h3 className="text-base font-medium text-gray-900 line-clamp-2">{title}</h3>

          {/* Rating */}
          <div className="flex items-center">
            <span className="mr-1 font-medium">{rating.toFixed(1)}</span>
            <div className="flex">{stars}</div>
          </div>

          {/* Price */}
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-lg font-bold">₹{price.toLocaleString()}</span>
            {mrp && mrp > price && (
              <span className="text-sm text-gray-500 line-through">MRP {mrp.toLocaleString()}</span>
            )}
            {discount && (
              <span className="rounded-full bg-offer px-2 py-1 text-xs font-medium text-white">{discount}% Off</span>
            )}
          </div>

          {/* View details link */}
          {showViewDetails && (
            <div className="pt-2">
              <Link href={"#"} className="text-sm text-gray-500 hover:text-gray-700">
                View full details
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCardwithoutCart;