"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Star, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import type { Review } from "./ProductRatingsReviews";

interface ReviewImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  initialImageIndex: number;
}

export default function ReviewImageModal({ isOpen, onClose, review, initialImageIndex }: ReviewImageModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMobile();

  // Reset current image index when review changes
  useEffect(() => {
    setCurrentImageIndex(initialImageIndex);
  }, [review, initialImageIndex]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, review, currentImageIndex]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !review || !review.images || review.images.length === 0) {
    return null;
  }

  const handlePrevImage = () => {
    setIsLoading(true);
    setCurrentImageIndex((prev) => (prev === 0 ? review.images!.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setIsLoading(true);
    setCurrentImageIndex((prev) => (prev === review.images!.length - 1 ? 0 : prev + 1));
  };

  const currentImage = review.images[currentImageIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      {/* Desktop Close button */}
      {!isMobile && (
        <button
          onClick={onClose}
          className="absolute top-4 cursor-pointer right-4 z-10 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Mobile Layout */}
      {isMobile ? (
        <div className="w-full h-full bg-white flex flex-col">
          {/* Mobile Header with Back Button */}
          <div className="flex items-center p-4 ">
            <button onClick={onClose} className="flex items-center gap-2 text-gray-800" aria-label="Go back">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </button>
          </div>

          {/* Main Image Area */}
          <div className="relative flex-1 bg-gray-100">
            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}

            {/* Main image */}
            <div className="relative w-full h-full">
              <Image
                src={currentImage.url || "/placeholder.svg"}
                alt={currentImage.alt || "Review image"}
                fill
                className="object-contain"
                onLoad={() => setIsLoading(false)}
                priority
              />
            </div>

            {/* Navigation arrows */}
            {review.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Image counter */}
            {review.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {review.images.length}
              </div>
            )}
          </div>

          {/* Review Content at Bottom */}
          <div className="p-4 bg-white ">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full overflow-hidden relative bg-gray-200">
                <Image
                  src="/diverse-group.png" // Placeholder since author.avatar isn't in schema
                  alt="User avatar"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium">{review.title || "Anonymous"}</h3>
                <div className="flex items-center gap-1_tabs">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn("w-3 h-3", star <= parseFloat(review.rating) ? "fill-black" : "text-gray-300")}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium ml-1">{parseFloat(review.rating).toFixed(1)}</span>
                  <span className="text-xs text-gray-500 ml-2">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-800 line-clamp-3">{review.comment}</p>
          </div>
        </div>
      ) : (
        // Desktop Layout
        <div className="w-full h-full md:w-[90%] md:h-[90%] md:max-w-6xl bg-white md:rounded-lg overflow-hidden flex flex-col md:flex-row">
          {/* Image section - takes 70% on desktop */}
          <div className="relative w-full h-[50vh] md:h-full md:w-[70%] bg-gray-100 flex items-center justify-center">
            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}

            {/* Main image */}
            <div className="relative w-full h-full">
              <Image
                src={currentImage.url || "/placeholder.svg"}
                alt={currentImage.alt || "Review image"}
                fill
                className="object-contain"
                onLoad={() => setIsLoading(false)}
                priority
              />
            </div>

            {/* Navigation arrows */}
            {review.images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-4 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-4 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Image counter */}
            {review.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {currentImageIndex + 1} / {review.images.length}
              </div>
            )}
          </div>

          {/* Review content section - takes 30% on desktop */}
          <div className="w-full md:w-[30%] p-6 overflow-y-auto">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden relative bg-gray-200 flex-shrink-0">
                <Image
                  src="/diverse-group.png" // Placeholder since author.avatar isn't in schema
                  alt="User avatar"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{review.title || "Anonymous"}</h3>
                <p className="text-sm text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn("w-4 h-4", star <= parseFloat(review.rating) ? "fill-black" : "text-gray-300")}
                      />
                    ))}
                  </div>
                  <span className="font-medium ml-1">{parseFloat(review.rating).toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-gray-800">{review.comment}</p>
            </div>

            {/* Thumbnail gallery */}
            {review.images && review.images.length > 1 && (
              <div>
                <h4 className="font-medium mb-3">All Images ({review.images.length})</h4>
                <div className="grid grid-cols-3 gap-2">
                  {review.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsLoading(true);
                        setCurrentImageIndex(index);
                      }}
                      className={cn(
                        "relative w-full aspect-square border rounded overflow-hidden",
                        currentImageIndex === index ? "ring-2 ring-blue-500" : "",
                      )}
                    >
                      <Image
                        src={image.url || "/placeholder.svg"}
                        alt={image.alt || `Review image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}