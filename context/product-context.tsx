"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"
import type { ProductData } from "@/components/Product/ProductDetails/Data"

interface ProductContextType {
  product: ProductData
  selectedColor: string
  setSelectedColor: (color: string) => void
  selectedStorage: string
  setSelectedStorage: (storage: string) => void
  quantity: number
  setQuantity: (quantity: number) => void
  isZooming: boolean
  setIsZooming: (isZooming: boolean) => void
  zoomPosition: { x: number; y: number }
  setZoomPosition: (position: { x: number; y: number }) => void
  selectedImageIndex: number
  setSelectedImageIndex: React.Dispatch<React.SetStateAction<number>>
  handleAddToCart: () => void
  handleBuyNow: () => void
}

const ProductContext = createContext<ProductContextType | undefined>(undefined)

export const ProductProvider: React.FC<{
  children: React.ReactNode
  product: ProductData
}> = ({ children, product }) => {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.value || "")
  const [selectedStorage, setSelectedStorage] = useState(product.ramOptions[0]?.value || "")
  const [quantity, setQuantity] = useState(1)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0.5, y: 0.5 })
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const handleAddToCart = () => {
    console.log("Adding to cart:", {
      product: product.id,
      quantity,
      color: selectedColor,
      storage: selectedStorage,
    })
  }

  const handleBuyNow = () => {
    console.log("Buy now:", {
      product: product.id,
      quantity,
      color: selectedColor,
      storage: selectedStorage,
    })
  }

  return (
    <ProductContext.Provider
      value={{
        product,
        selectedColor,
        setSelectedColor,
        selectedStorage,
        setSelectedStorage,
        quantity,
        setQuantity,
        isZooming,
        setIsZooming,
        zoomPosition,
        setZoomPosition,
        selectedImageIndex,
        setSelectedImageIndex,
        handleAddToCart,
        handleBuyNow,
      }}
    >
      {children}
    </ProductContext.Provider>
  )
}

export const useProductContext = () => {
  const context = useContext(ProductContext)
  if (context === undefined) {
    throw new Error("useProductContext must be used within a ProductProvider")
  }
  return context
}
