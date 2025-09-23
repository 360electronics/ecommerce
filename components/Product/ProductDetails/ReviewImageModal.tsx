"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Star } from "lucide-react";
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

  useEffect(() => {
    setCurrentImageIndex(initialImageIndex);
  }, [review, initialImageIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") handlePrevImage();
      else if (e.key === "ArrowRight") handleNextImage();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, review, currentImageIndex]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen || !review || !review.images || review.images.length === 0) return null;

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
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 bg-white/10 rounded text-white hover:bg-white/20 z-50"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-full h-full md:w-4/5 md:h-4/5 bg-white rounded overflow-hidden flex flex-col md:flex-row">
        {/* Image section */}
        <div className="relative flex-1 bg-gray-100">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}
          <img
            src={currentImage.url || "https://avatar.iran.liara.run/public"}
            alt={currentImage.alt || "Image"}
            
            className="object-contain aspect-square w-full h-full"
          />
          {review.images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1 bg-white/80 rounded hover:bg-white"
                aria-label="Prev"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/80 rounded hover:bg-white"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                {currentImageIndex + 1}/{review.images.length}
              </div>
            </>
          )}
        </div>

        {/* Review content */}
        <div className="p-4 md:w-1/3 overflow-y-auto text-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 relative">
              <img
                src="https://avatar.iran.liara.run/public"
                alt="Avatar"
                
                className="object-cover aspect-square w-full h-full"
              />
            </div>
            <div>
              <h3 className="font-medium">{review.title || "Anonymous"}</h3>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn("w-3 h-3", star <= parseFloat(review.rating) ? "fill-black" : "text-gray-300")}
                    />
                  ))}
                </div>
                <span>{parseFloat(review.rating).toFixed(1)}</span>
                <span className="text-gray-500 ml-1">{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <p className="text-gray-800">{review.comment}</p>
        </div>
      </div>
    </div>
  );
}