"use client"

import { Heart, Minus, Plus, Share2, Truck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProductContext } from "@/context/product-context"

interface ProductDetailsContentProps {
  className?: string
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
    isZooming,
    handleAddToCart,
    handleBuyNow,
  } = useProductContext()

  const increaseQuantity = () => {
    setQuantity(quantity + 1)
  }

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  return (
    <div className={cn(`md:ml-14 ${isZooming ? "invisible" : "visible"}`, className)}>
      <div className="hidden md:flex flex-row items-center gap-2 justify-end mb-5 my-2 cursor-pointer text-xs md:text-base ">
        <Share2 className="md:w-5 md:h-5 w-4 h-4 " />
        <p>Share</p>
      </div>

      {/* Product Name */}
      <h1 className="md:text-xl text-sm md:font-medium md:mb-6 md:border-b md:pb-4 mt-5 mb-2 md:my-0">{product.name}</h1>

      {/* Mobile - Pricing */}
      <div className="md:hidden flex flex-row items-center justify-between">
        <div className="flex items-center gap-3 md:mb-6 mb-5">
          {product.mrp && product.mrp > product.ourPrice && (
            <div className="md:hidden items-center gap-1 text-base text-gray-400">
              <span>MRP</span>
              <div className="relative inline-block">
                <span>₹{product.mrp.toString()}</span>
                <span className="absolute left-0 top-1/2 w-full h-[1.5px] bg-gray-400 transform rotate-[5deg] origin-center" />
              </div>
            </div>
          )}

          <span className=" text-lg font-bold">₹{product.ourPrice.toString()}</span>

          {product.discount && product.discount > 0 && (
            <span className="bg-red-600 text-white text-xs font-lighter px-2 py-1 rounded-full">
              {product.discount}% OFF
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

              {product.totalStocks > 0 && (
                <button className="text-green-600 text-xs font-medium border border-green-600 bg-green-100 rounded-full px-2 p-1">
                  In Stock
                </button>
              )}
            </div>
            {/* 
            <div className="border border-gray-400 rounded-full p-2 ml-4">
              <Heart className="w-5 h-5" />
            </div> */}

            {/* Delivery */}
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-700">
              <Truck className="h-5 w-5 text-blue-500" />
              <span>Free delivery by {product.deliveryDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Options */}
      <div className="space-y-6 mt-5 md:mt-0">
        {/* RAM / Storage Options */}
        {product.ramOptions && product.ramOptions.length > 0 && (
          <div className="flex md:flex-row flex-col md:items-center justify-between">
            <h3 className="md:text-base text-sm font-medium mb-3">RAM / Internal Storage</h3>
            <div className="flex gap-3">
              {product.ramOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedStorage(option.value)}
                  className={cn(
                    "px-4 py-1.5 rounded-full md:text-sm text-xs border",
                    selectedStorage === option.value
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-300 hover:border-gray-400",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Options */}
        {product.colors && product.colors.length > 0 && (
          <div className="mt-6 hidden md:flex flex-row items-center justify-between">
            <div className="mb-2">
              <h3 className="text-base font-medium mb-3">Color</h3>
              <span className="text-gray-700">
                {product.colors.find((c) => c.value === selectedColor)?.name || "Default"}
              </span>
            </div>
            <div className="flex gap-3">
              {product.colors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "w-10 h-10 rounded-full border",
                    selectedColor === color.value ? "p-1  outline-2 border border-white" : "border-gray-300",
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
        {/* Price */}
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3 mb-6 mt-6">
            <span className="text-3xl font-bold">₹{product.ourPrice.toString()}</span>

            {product.mrp && product.mrp > product.ourPrice && (
              <div className="flex items-center gap-1 text-lg text-gray-400">
                <span>MRP</span>
                <div className="relative inline-block">
                  <span>₹{product.mrp.toString()}</span>
                  <span className="absolute left-0 top-1/2 w-full h-[1.5px] bg-gray-400 transform rotate-[5deg] origin-center" />
                </div>
              </div>
            )}

            {product.discount && product.discount > 0 && (
              <span className="bg-red-600 text-white text-xs font-lighter px-2 py-1 rounded-full">
                {product.discount}% OFF
              </span>
            )}
          </div>

          {product.totalStocks > 0 && (
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

            <div className="border border-gray-400 rounded-full p-2 ml-4">
              <Heart className="w-5 h-5" />
            </div>

            {/* Delivery */}
            <div className="flex items-center gap-2 text-sm text-gray-700 ml-10">
              <Truck className="h-5 w-5 text-blue-500" />
              <span>Free delivery by {product.deliveryDate}</span>
            </div>
          </div>
        </div>
      </div>

    

      {/* Desktop - Product Actions */}
      <div className="hidden md:block mt-2">
        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4 md:w-[60%]">
          <button
            onClick={handleAddToCart}
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
  )
}
