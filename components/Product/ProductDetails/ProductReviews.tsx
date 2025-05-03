"use client"

import Image from "next/image"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ReviewImage } from "./Data"

interface Review {
  id: string | number
  author: {
    name: string
    avatar?: string
    date: string
  }
  rating: number
  comment: string
  images?: ReviewImage[]
}

interface ProductReviewsProps {
  reviews: Review[]
  onWriteReview?: () => void
  customerImages?: ReviewImage[]
  className?: string
}

export default function ProductReviews({
  reviews,
  onWriteReview,
  customerImages = [],
  className,
}: ProductReviewsProps) {
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Ratings & Reviews</h2>
        <Button className="bg-white text-black border hover:bg-gray-100" onClick={onWriteReview}>
          Write a Review
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="ml-2"
          >
            <path
              d="M3.75 10H16.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11.25 5L16.25 10L11.25 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>

      {/* Customer Images */}
      {customerImages.length > 0 && (
        <div className="mt-8 mb-8">
          <div className="flex overflow-x-auto gap-4 pb-4">
            {customerImages.map((image, index) => (
              <div key={index} className="w-28 h-28 flex-shrink-0 relative border rounded-md overflow-hidden">
                <Image src={image.src || "/placeholder.svg"} alt={image.alt} fill className="object-cover" />
                {index === customerImages.length - 1 && customerImages.length > 6 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">
                    +{customerImages.length - 6}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Filter */}
      <div className="mt-8 flex justify-end">
        <div className="relative w-48">
          <select className="w-full border rounded-md py-2 px-3 appearance-none pr-10">
            <option>Top Reviews</option>
            <option>Most Recent</option>
            <option>Highest Rating</option>
            <option>Lowest Rating</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="mt-6 space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden relative bg-gray-200">
                <Image
                  src={review.author.avatar || "/diverse-group.png"}
                  alt={review.author.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-semibold">{review.author.name}</h4>
                    <p className="text-sm text-gray-500">{review.author.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{review.rating.toFixed(1)}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? "fill-black" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-2">{review.comment}</p>
              </div>
            </div>
            {review.images && review.images.length > 0 && (
              <div className="mt-4 ml-16 flex gap-2 overflow-x-auto">
                {review.images.map((image, index) => (
                  <div key={index} className="w-28 h-28 relative border rounded-md overflow-hidden flex-shrink-0">
                    <Image src={image.src || "/placeholder.svg"} alt={image.alt} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
