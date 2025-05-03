"use client"

import { Truck } from "lucide-react"

interface ProductActionsProps {
  onAddToCart?: () => void
  onBuyNow?: () => void
  deliveryDate?: string
  className?: string
}

export default function ProductActions({
  onAddToCart,
  onBuyNow,
  deliveryDate = "11 April, 2025",
  className,
}: ProductActionsProps) {
  return (
    <div className={className}>
      {/* Delivery */}
      <div className="flex items-center gap-2 text-sm text-gray-700 mb-6">
        <Truck className="h-5 w-5 text-blue-500" />
        <span>Free delivery by {deliveryDate}</span>
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onAddToCart}
          className="flex-1 py-3 px-4 rounded-full cursor-pointer border border-gray-300 hover:border-gray-400 flex items-center justify-center gap-2 font-medium"
        >
          Add to cart
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
          onClick={onBuyNow}
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
  )
}
