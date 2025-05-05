"use client"


import { useState, useEffect, useRef } from "react"
import ProductImageGallery from "./ProductImageGallery"
import ProductDetailsContent from "./ProductDetailsContent"
import ProductSpecifications from "./ProductSpecifications"
import ProductRatingsReviews from "./ProductRatingsReviews"
import ProductZoomOverlay from "./ProductZoomOverlay"
import Breadcrumbs from "@/components/Reusable/BreadScrumb"
import type { ProductData } from "./Data"
import { ProductProvider } from "@/context/product-context"


interface ProductDetailPageProps {
  product: ProductData
}

export default function ProductDetailPage({ product }: ProductDetailPageProps) {

  // Prepare breadcrumb items
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: product.category, path: `/${product.category.toLowerCase().replace(/\s+/g, "-")}` },
    { name: product.name, path: `/product/${product.slug}` },
  ]

  return (
    <ProductProvider product={product} >
      <div className="container mx-auto px-4 pb-8 ">
        <Breadcrumbs breadcrumbs={breadcrumbItems} className="my-6 hidden"/>

        <div className="flex flex-col md:flex-row md:mb-12 mb-1">
          <div className="w-full md:w-[40%]">
            <ProductImageGallery />
          </div>

          <div className="w-full md:w-[60%] product-details relative">
            <ProductZoomOverlay />
            <ProductDetailsContent />
          </div>
        </div>

        <ProductSpecifications className="mb-12" />

        <ProductRatingsReviews />
      </div>
    </ProductProvider>
  )
}
