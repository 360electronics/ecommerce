"use client"

import { useEffect, useState } from "react"
import { useProductContext } from "@/context/product-context"

interface ProductZoomOverlayProps {
  zoomFactor?: number
}

export default function ProductZoomOverlay({ zoomFactor = 2.5 }: ProductZoomOverlayProps) {
  const { product, isZooming, selectedImageIndex, zoomPosition } = useProductContext()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted || !isZooming) {
    return null
  }

  const currentImageUrl = product.productImages[selectedImageIndex] || "/placeholder.svg"

  return (
    <div
      className="absolute inset-0 z-50 border rounded-lg overflow-hidden bg-white"
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
      }}
    >
      {/* Using an actual image element with correct positioning */}
      <div className="relative w-full h-full overflow-hidden">
        <img
          src={currentImageUrl || "/placeholder.svg"}
          alt={product.name}
          style={{
            position: "absolute",
            width: `${zoomFactor * 100}%`,
            height: `${zoomFactor * 100}%`,
            maxWidth: "none",
            maxHeight: "none",
            left: `${-zoomPosition.x * (zoomFactor - 1) * 100}%`,
            top: `${-zoomPosition.y * (zoomFactor - 1) * 100}%`,
            objectFit: "cover",
          }}
        />
      </div>
    </div>
  )
}
