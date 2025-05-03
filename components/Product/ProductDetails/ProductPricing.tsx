"use client"

import { useState } from "react"
import { Heart, Minus, Plus } from "lucide-react"

interface ProductPricingProps {
  price: number
  mrp?: number
  discount?: number
  onQuantityChange?: (quantity: number) => void
  initialQuantity?: number
  className?: string
  inStock?: boolean
}

export default function ProductPricing({
  price,
  mrp,
  discount,
  onQuantityChange,
  initialQuantity = 1,
  className,
  inStock = true,
}: ProductPricingProps) {
  const [quantity, setQuantity] = useState(initialQuantity)

  const increaseQuantity = () => {
    const newQuantity = quantity + 1
    setQuantity(newQuantity)
    onQuantityChange?.(newQuantity)
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1
      setQuantity(newQuantity)
      onQuantityChange?.(newQuantity)
    }
  }

  return (
    <div className={className}>
      {/* Price */}
      <div className="flex items-center gap-3 mb-6 mt-6">
        <span className="text-3xl font-bold">₹{price.toString()}</span>
        {mrp && mrp > price && (
          <>
            <span className="text-gray-500 text-lg">MRP ₹{mrp.toString()}</span>
            {discount && discount > 0 && (
              <span className="bg-red-600 text-white text-xs font-medium px-2 py-1 rounded">{discount}% OFF</span>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="mr-3 text-gray-700">Qty</span>
          <div className="flex items-center border border-gray-300 rounded-full">
            <button onClick={decreaseQuantity} className="px-2 py-1 rounded-l-full" aria-label="Decrease quantity">
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-3 py-1">{quantity}</span>
            <button onClick={increaseQuantity} className="px-2 py-1 rounded-r-full" aria-label="Increase quantity">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="p-1 border border-gray-300 rounded-full w-10 h-10 flex items-center justify-center"
            aria-label="Add to wishlist"
          >
            <Heart className="h-5 w-5" />
          </button>

          {inStock && <span className="text-green-600 font-medium">In Stock</span>}
        </div>
      </div>
    </div>
  )
}
