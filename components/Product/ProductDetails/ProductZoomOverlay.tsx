"use client"

import { useEffect, useState, useMemo } from "react"
import { useProductContext } from "@/context/product-context"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ProductZoomOverlayProps {
  zoomFactor?: number
  className?: string
}

export default function ProductZoomOverlay({
  zoomFactor = 2.5,
  className,
}: ProductZoomOverlayProps) {
  const { product, isZooming, selectedImageIndex, zoomPosition } = useProductContext()
  const [isMounted, setIsMounted] = useState(false)

  // Ensure component only renders on client-side to avoid hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Get current image URL with fallback
  const currentImageUrl = useMemo(() => {
    return product.productImages[selectedImageIndex] || "/placeholder.svg"
  }, [product.productImages, selectedImageIndex])

  // Don't render if not mounted or not zooming
  if (!isMounted || !isZooming) {
    return null
  }

  // Calculate zoom styles using transform for scale and translate
  const zoomStyles = {
    transform: `
      scale(${zoomFactor})
      translate(
        ${-zoomPosition.x * (1 - 1 / zoomFactor) * 100}%,
        ${-zoomPosition.y * (1 - 1 / zoomFactor) * 100}%
      )
    `,
    transformOrigin: "0 0", // Ensure scaling starts from top-left
    transition: "transform 0.1s ease-out", // Smooth zoom movement
  }

  return (
    <div
      className={cn(
        "absolute inset-0 z-50 h-[85%] mt-10 ml-6 border rounded-lg overflow-hidden bg-white shadow-lg",
        className
      )}
      role="region"
      aria-label="Zoomed product image"
    >
      <div className="relative w-full h-full overflow-hidden">
        <Image
          src={currentImageUrl}
          alt={`${product.name} zoomed view`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          style={zoomStyles}
          className="object-cover"
          priority={selectedImageIndex === 0} // Prioritize first image
          placeholder="blur"
          blurDataURL="/placeholder.svg"
          onError={(e) => {
            e.currentTarget.src = "/placeholder.svg" // Fallback on error
          }}
          aria-hidden={currentImageUrl === "/placeholder.svg"}
        />
      </div>
    </div>
  )
}