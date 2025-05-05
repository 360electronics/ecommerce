"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import Image from "next/image"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"
import { useProductContext } from "@/context/product-context"

interface ProductImageGalleryProps {
  className?: string
}

export default function ProductImageGallery({ className }: ProductImageGalleryProps) {
  const { product, selectedImageIndex, setSelectedImageIndex, isZooming, setIsZooming, zoomPosition, setZoomPosition } =
    useProductContext()

  const imageContainerRef = useRef<HTMLDivElement>(null)
  const mobileSliderRef = useRef<HTMLDivElement>(null)
  const isMobile = useMobile()
  const [isMounted, setIsMounted] = useState(false)
  const [activeIndex, setActiveIndex] = useState(selectedImageIndex) // Local state for immediate dot updates
  const images = product.productImages

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update local active index when selected image index changes
  useEffect(() => {
    setActiveIndex(selectedImageIndex)
  }, [selectedImageIndex])

  // Handle mobile slider scroll
  useEffect(() => {
    if (!isMobile || !mobileSliderRef.current) return

    let scrollTimeout: NodeJS.Timeout | null = null

    const handleScroll = () => {
      if (!mobileSliderRef.current) return

      // Clear any existing timeout to debounce the scroll event
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }

      // Update active index immediately for responsive dot indicator
      const scrollLeft = mobileSliderRef.current.scrollLeft
      const itemWidth = mobileSliderRef.current.clientWidth
      const currentIndex = Math.round(scrollLeft / itemWidth)

      if (currentIndex >= 0 && currentIndex < images.length) {
        setActiveIndex(currentIndex)
      }

      // Set a timeout to process the scroll event after scrolling stops
      scrollTimeout = setTimeout(() => {
        const newIndex = Math.round(scrollLeft / itemWidth)

        // Only update if the index has actually changed
        if (newIndex !== selectedImageIndex && newIndex >= 0 && newIndex < images.length) {
          setSelectedImageIndex(newIndex)
        }
      }, 150) // Wait for scrolling to finish
    }

    mobileSliderRef.current.addEventListener("scroll", handleScroll)
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)
      mobileSliderRef.current?.removeEventListener("scroll", handleScroll)
    }
  }, [isMobile, selectedImageIndex, setSelectedImageIndex, images.length, setActiveIndex])

  // Scroll to selected image when index changes
  useEffect(() => {
    if (!isMobile || !mobileSliderRef.current) return

    // Scroll to the selected image with smooth behavior
    const scrollToPosition = selectedImageIndex * mobileSliderRef.current.clientWidth

    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      if (mobileSliderRef.current) {
        mobileSliderRef.current.scrollTo({
          left: scrollToPosition,
          behavior: "smooth",
        })
      }
    })
  }, [selectedImageIndex, isMobile])

  const handlePrevImage = () => {
    const newIndex = selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1
    setSelectedImageIndex(newIndex)
    setActiveIndex(newIndex) // Update local state immediately
  }

  const handleNextImage = () => {
    const newIndex = selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1
    setSelectedImageIndex(newIndex)
    setActiveIndex(newIndex) // Update local state immediately
  }

  const handleDotClick = (index: number) => {
    setSelectedImageIndex(index)
    setActiveIndex(index) // Update local state immediately
  }

  const handleMouseEnter = () => {
    if (isMounted && !isMobile) {
      setIsZooming(true)
    }
  }

  const handleMouseLeave = () => {
    setIsZooming(false)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current || !isMounted || isMobile) return

    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect()

    // Calculate relative position (0 to 1)
    const x = Math.max(0, Math.min(1, (e.clientX - left) / width))
    const y = Math.max(0, Math.min(1, (e.clientY - top) / height))

    setZoomPosition({ x, y })
  }

  // Reset zoom when selected image changes
  useEffect(() => {
    setIsZooming(false)
  }, [selectedImageIndex, setIsZooming])

  if (!images.length) {
    return null
  }

  return (
    <div className={cn("mt-10", className)}>
      {/* Desktop View */}
      <div className="hidden md:flex md:flex-row gap-4">
        {/* Left side thumbnails (desktop) */}
        <div className="flex flex-col gap-3 w-20 mt-10">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={cn(
                "w-16 h-16 border rounded overflow-hidden relative",
                selectedImageIndex === index ? "border-blue-500 border-2" : "border-gray-200",
              )}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`${product.name} thumbnail ${index + 1}`}
                fill
                className="object-contain p-1"
              />
            </button>
          ))}
        </div>

        {/* Main image container - square aspect ratio (desktop) */}
        <div className="flex-1 relative">
          {/* Main product image */}
          <div
            ref={imageContainerRef}
            className=" rounded-lg overflow-hidden relative aspect-square mb-4"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            style={{ cursor: isZooming ? "crosshair" : "zoom-in" }}
          >
            <Image
              src={images[selectedImageIndex] || "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover"
              priority={selectedImageIndex === 0}
            />
          </div>

          {/* Navigation arrows (desktop) */}
          <div className="flex justify-center gap-4">
            <button
              onClick={handlePrevImage}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
              aria-label="Previous image"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextImage}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
              aria-label="Next image"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {/* Horizontal scrollable image slider */}
        <div className="relative">
          {/* Mobile slider */}
          <div
            ref={mobileSliderRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {images.map((image, index) => (
              <div key={index} className="flex-shrink-0 w-full snap-center">
                <div className="relative aspect-square border rounded-lg overflow-hidden mx-auto">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.name} image ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center mt-4 gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-150",
                activeIndex === index
                  ? "bg-blue-500 w-4" // Selected dot is wider
                  : "bg-gray-300 hover:bg-gray-400",
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
