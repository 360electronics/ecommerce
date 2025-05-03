"use client"

import { useState } from "react"
import ProductImageGallery from "./ProductImageGallery"
import ProductOptions from "./ProductOptions"
import ProductPricing from "./ProductPricing"
import ProductActions from "./ProductActions"
import ProductSpecifications from "./ProductSpecifications"
import ProductRatingsSummary from "./ProductRatingsSummary"
import ProductReviews from "./ProductReviews"
import { Share } from "lucide-react"
import Breadcrumbs from "@/components/Reusable/BreadScrumb"
import type { ProductData } from "./Data"


interface ProductDetailPageProps {
  product: ProductData
}

export default function ProductDetailPage({ product }: ProductDetailPageProps) {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.value || "")
  const [selectedStorage, setSelectedStorage] = useState(product.ramOptions[0]?.value || "")
  const [quantity, setQuantity] = useState(1)

  // Handlers
  const handleAddToCart = () => {
    console.log("Adding to cart:", {
      product: product.id,
      quantity,
      color: selectedColor,
      storage: selectedStorage,
    })
    // Implement your cart logic here
  }

  const handleBuyNow = () => {
    console.log("Buy now:", {
      product: product.id,
      quantity,
      color: selectedColor,
      storage: selectedStorage,
    })
    // Implement your checkout logic here
  }

  // Prepare breadcrumb items
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: product.category, path: `/${product.category.toLowerCase().replace(/\s+/g, "-")}` },
    { name: product.name, path: `/product/${product.slug}` },
  ]

  // Prepare customer images from reviews
  const customerImages = product.reviews
    .filter((review) => review.images && review.images.length > 0)
    .flatMap((review) => review.images || [])
    .slice(0, 6)

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Share */}
      <div className="flex justify-between items-center mb-6">
        <Breadcrumbs breadcrumbs={breadcrumbItems} />
        <button className="flex items-center gap-1 text-sm">
          <Share className="h-4 w-4" />
          Share
        </button>
      </div>

      {/* Product layout with 40/60 split on large screens */}
      <div className="flex flex-col md:flex-row my-12">
        {/* Product Images - 40% width on large screens */}
        <div className="w-full md:w-[40%]">
          <ProductImageGallery images={product.productImages} productName={product.name} />
        </div>

        {/* Product Details - 60% width on large screens */}
        <div className="w-full md:w-[60%]  md:pl-20 product-details">
          <h1 className="text-xl font-medium mb-6 border-b pb-4">{product.name}</h1>

          {/* Product Options */}
          <ProductOptions
            colors={product.colors}
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            storageOptions={product.ramOptions}
            selectedStorage={selectedStorage}
            onStorageChange={setSelectedStorage}
          />

          {/* Product Pricing */}
          <ProductPricing
            price={product.ourPrice}
            mrp={product.mrp}
            discount={product.discount}
            onQuantityChange={setQuantity}
            initialQuantity={quantity}
            inStock={product.totalStocks > 0}
          />

          {/* Product Actions */}
          <ProductActions onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} deliveryDate={product.deliveryDate} />
        </div>
      </div>

      {/* Specifications */}
      <ProductSpecifications productName={product.name} specifications={product.specifications} className="mb-12" />

      {/* Ratings & Reviews */}
      <div className="mb-12">
        <ProductRatingsSummary
          averageRating={product.averageRating}
          totalRatings={product.ratingCount}
          totalReviews={product.reviews.length}
          ratingDistribution={product.ratingDistribution}
          categoryRatings={product.categoryRatings}
          className="mb-8"
        />

        <ProductReviews
          reviews={product.reviews}
          customerImages={customerImages}
          onWriteReview={() => console.log("Write review clicked")}
        />
      </div>
    </div>
  )
}
