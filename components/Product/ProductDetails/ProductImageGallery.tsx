"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductImageGalleryProps {
  images: string[]
  productName: string
  className?: string
}

export default function ProductImageGallery({ images, productName, className }: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZooming, setIsZooming] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 })
  const [lensSize, setLensSize] = useState({ width: 100, height: 100 })
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const productDetailsRef = useRef<HTMLDivElement>(null)
  const zoomFactor = 2.5 // Zoom magnification level
  const [isMounted, setIsMounted] = useState(false)
  const [detailsRect, setDetailsRect] = useState({ width: 0, height: 0, top: 0, left: 0 })

  // Handle client-side only functionality
  useEffect(() => {
    setIsMounted(true)

    // Find the product details element
    const detailsElement = document.querySelector(".product-details") as HTMLDivElement
    if (detailsElement) {
      productDetailsRef.current = detailsElement
      updateDetailsRect()

      // Add resize listener to update measurements when window size changes
      window.addEventListener("resize", updateDetailsRect)
      return () => {
        window.removeEventListener("resize", updateDetailsRect)
      }
    }
  }, [])

  // Function to update the details rectangle measurements
  const updateDetailsRect = () => {
    if (!productDetailsRef.current) return

    const rect = productDetailsRef.current.getBoundingClientRect()
    setDetailsRect({
      width: rect.width,
      height: rect.height,
      top: rect.top - (window.scrollY || document.documentElement.scrollTop),
      left: rect.left,
    })
  }

  const handlePrevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  // Check if we're on a mobile device - only run on client
  const isMobile = () => {
    if (!isMounted) return false
    return window.innerWidth < 768
  }

  const handleMouseEnter = () => {
    if (isMounted && !isMobile()) {
      setIsZooming(true)
      if (productDetailsRef.current) {
        productDetailsRef.current.style.visibility = "hidden"
      }
    }
  }

  const handleMouseLeave = () => {
    setIsZooming(false)
    if (productDetailsRef.current) {
      productDetailsRef.current.style.visibility = "visible"
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !isMounted || isMobile()) return

    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect()

    // Calculate relative position (0 to 1)
    const x = Math.max(0, Math.min(1, (e.clientX - left) / width))
    const y = Math.max(0, Math.min(1, (e.clientY - top) / height))

    setZoomPosition({ x, y })

    // Calculate lens position
    const lensWidth = lensSize.width
    const lensHeight = lensSize.height

    // Position the lens with the mouse at the center
    const lensX = Math.max(0, Math.min(width - lensWidth, e.clientX - left - lensWidth / 2))
    const lensY = Math.max(0, Math.min(height - lensHeight, e.clientY - top - lensHeight / 2))

    setLensPosition({ x: lensX, y: lensY })
  }

  // Reset zoom when selected image changes
  useEffect(() => {
    setIsZooming(false)
    if (productDetailsRef.current) {
      productDetailsRef.current.style.visibility = "visible"
    }
  }, [selectedImage])

  // Update lens size based on zoom factor
  useEffect(() => {
    if (imageContainerRef.current && isMounted) {
      const { width, height } = imageContainerRef.current.getBoundingClientRect()
      setLensSize({
        width: width / zoomFactor,
        height: height / zoomFactor,
      })
    }
  }, [isMounted, zoomFactor])

  if (!images.length) {
    return null
  }

  return (
    <div className={cn("", className)}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left side thumbnails (desktop) */}
        <div className="hidden md:flex flex-col gap-3 w-20 mt-16">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "w-16 h-16 border rounded overflow-hidden relative",
                selectedImage === index ? "border-blue-500 border-2" : "border-gray-200",
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`${productName} thumbnail ${index + 1}`}
                fill
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>

        {/* Main image container - square aspect ratio */}
        <div className="flex-1 relative">
          {/* Main product image */}
          <div
            ref={imageContainerRef}
            className="border rounded-lg overflow-hidden relative aspect-square mb-4"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            style={{ cursor: isZooming ? "crosshair" : "zoom-in" }}
          >
            <Image
              src={images[selectedImage] || "/placeholder.svg"}
              alt={productName}
              fill
              className="object-cover"
              priority={selectedImage === 0}
            />

            {/* Zoom lens indicator (blue net-like container) */}
            {isMounted && isZooming && !isMobile() && (
              <div
                className="absolute border-2 border-blue-500 pointer-events-none bg-blue-500/10"
                style={{
                  width: `${lensSize.width}px`,
                  height: `${lensSize.height}px`,
                  left: `${lensPosition.x}px`,
                  top: `${lensPosition.y}px`,
                }}
              />
            )}
          </div>

          {/* Mobile thumbnails */}
          <div className="flex md:hidden gap-2 overflow-x-auto pb-2 mb-4">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={cn(
                  "w-16 h-16 border rounded flex-shrink-0 relative",
                  selectedImage === index ? "border-blue-500 border-2" : "border-gray-200",
                )}
                aria-label={`View image ${index + 1}`}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  className="object-contain p-1"
                />
              </button>
            ))}
          </div>

          {/* Navigation arrows */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handlePrevImage}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextImage}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Zoom overlay - positioned to replace product details */}
      {isMounted && isZooming && !isMobile() && detailsRect.width > 0 && (
        <div
          className="fixed z-50 pointer-events-none"
          aria-hidden="true"
          style={{
            top: `${detailsRect.top}px`,
            left: `${detailsRect.left+20}px`,
            width: `${detailsRect.width}px`,
            height: `${detailsRect.width-240}px`, // Make it square like the image container
          }}
        >
          <div
            className="w-full h-[80%] border rounded-lg overflow-hidden bg-white"
            style={{
              backgroundImage: `url(${images[selectedImage]})`,
              backgroundPosition: `${zoomPosition.x * 100}% ${zoomPosition.y * 100}%`,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${zoomFactor * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  )
}
