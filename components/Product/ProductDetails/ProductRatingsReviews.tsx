"use client"

import { useState } from "react"
import Image from "next/image"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useProductContext } from "@/context/product-context"
import ReviewImageModal from "./ReviewImageModal"
import type { Review, ReviewImage } from "./Data"

interface ProductRatingsReviewsProps {
  className?: string
}

export default function ProductRatingsReviews({ className }: ProductRatingsReviewsProps) {
  const { product } = useProductContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Calculate the maximum count for scaling the rating bars
  const maxCount = Math.max(...product.ratingDistribution.map((item) => item.count))

  // Prepare customer images from reviews
  const customerImages = product.reviews
    .filter((review) => review.images && review.images.length > 0)
    .flatMap((review) => review.images || [])
    .slice(0, 6)

  const handleWriteReview = () => {
    console.log("Write review clicked")
  }

  const handleImageClick = (review: Review, imageIndex: number) => {
    setSelectedReview(review)
    setSelectedImageIndex(imageIndex)
    setIsModalOpen(true)
  }

  const handleCustomerImageClick = (image: ReviewImage) => {
    // Find the review that contains this image
    for (const review of product.reviews) {
      if (review.images) {
        const imageIndex = review.images.findIndex((img) => img.src === image.src)
        if (imageIndex !== -1) {
          handleImageClick(review, imageIndex)
          return
        }
      }
    }
  }

  return (
    <div className={cn("mb-12", className)}>
      {/* Reviews Section */}
      <div>
        <div className="flex flex-col md:flex-row justify-between md:items-center my-16">
          <h2 className="md:text-4xl text-lg md:font-bold font-medium">
            Ratings & <span className="text-primary">Reviews</span>
          </h2>
          <Button
            className="hidden md:block bg-transparent text-xs mt-2 md:mt-0 md:text-base md:w-auto text-black border hover:bg-gray-100 px-2 md:px-4 p-2 font-light underline"
            onClick={handleWriteReview}
          >
            Write a Review
            <svg
             
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ml-2 w-5 h-5"
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

        {/* Ratings Summary Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="grid grid-cols-[1.3fr_1fr] md:grid-cols-2">
            {/* Overall Rating */}
            <div className="flex flex-col items-start md:justify-end">
              <div className="flex items-center md:items-end mb-2">
                <span className="md:text-5xl text-sm font-medium md:mr-2 mr-1">{product.averageRating.toFixed(1)}</span>
                <Star className="md:w-14 md:h-14 w-4 h-4 fill-black" />
              </div>
              <p className="text-gray-600 text-xs md:text-base">
                {product.ratingCount} Ratings & {product.reviews.length} Reviews
              </p>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2 mt-4 text-[10px] md:text-base">
              {product.ratingDistribution.map((item) => (
                <div key={item.value} className="flex items-center gap-2">
                  <span className="w-8 text-right">{item.value}.0</span>
                  <Star className="w-4 h-4 fill-black" />
                  <div className="w-full bg-gray-200 rounded-full md:h-2.5 h-1">
                    <div
                      className="bg-blue-500 md:h-2.5 h-1 rounded-full"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-gray-600">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Ratings */}
          {product.categoryRatings.length > 0 && (
            <div className="grid grid-cols-4 gap-4 ">
              {product.categoryRatings.map((category) => (
                <div key={category.name} className="flex flex-col items-center justify-end">
                  <div className="relative md:w-20 md:h-20 w-13 h-13">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" strokeWidth="10" />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="8"
                        strokeDasharray="282.7"
                        strokeDashoffset={282.7 - (282.7 * category.value) / 5}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center md:text-xl font-bold">
                      {category.value.toFixed(1)}
                    </div>
                  </div>
                  <p className="mt-2 text-center font-medium text-xs md:text-base">{category.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Images */}
        {customerImages.length > 0 && (
          <div className="mt-14 mb-8">
            <div className="flex overflow-x-auto gap-4 pb-4">
              {customerImages.map((image, index) => (
                <div
                  key={index}
                  className="w-28 h-28 flex-shrink-0 relative border rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => handleCustomerImageClick(image)}
                >
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
          <div className="relative md:w-48 w-32 text-xs">
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
          {product.reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-start gap-4">
                <div className="md:w-12 md:h-12 w-8 h-8 rounded-full overflow-hidden relative bg-gray-200">
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
                      <h4 className="font-semibold text-xs md:text-base">{review.author.name}</h4>
                      <p className=" text-gray-500 text-xs md:text-sm">{review.author.date}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-xs md:text-base">{review.rating.toFixed(1)}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`md:w-4 md:h-4 w-3 h-3 ${star <= review.rating ? "fill-black" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm md:text-base">{review.comment}</p>
                </div>
              </div>
              {review.images && review.images.length > 0 && (
                <div className="mt-4 ml-16 flex gap-2 overflow-x-auto">
                  {review.images.map((image, index) => (
                    <div
                      key={index}
                      className="md:w-28 md:h-28 w-16 h-16 relative border rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleImageClick(review, index)}
                    >
                      <Image src={image.src || "/placeholder.svg"} alt={image.alt} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Review Image Modal */}
      <ReviewImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        review={selectedReview}
        initialImageIndex={selectedImageIndex}
      />
    </div>
  )
}
