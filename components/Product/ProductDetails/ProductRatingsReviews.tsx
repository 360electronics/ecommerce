"use client";

import Image from "next/image";
import { Star, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ReviewImageModal from "./ReviewImageModal";
import { useState, useEffect, useMemo } from "react";
import { useProductStore } from "@/store/product-store";
import { useAuthStore } from "@/store/auth-store";
import WriteReviewModal from "./WriteReviewModel";

// Define TypeScript types aligned with API and database schema
export interface ReviewImage {
  url: string;
  alt: string;
  displayOrder: number;
}

export interface Review {
  id: string;
  productId: string;
  variantId?: string;
  userId: string;
  userFirstName: string;
  userLastName: string;
  rating: string; // Stored as string in DB (e.g., "4.5")
  title?: string;
  comment?: string;
  images?: ReviewImage[];
  isApproved: boolean;
  helpfulVotes: string;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
}

export interface RatingDistribution {
  value: number;
  count: number;
}

export interface CategoryRating {
  name: string;
  value: number;
}

interface ProductRatingsReviewsProps {
  className?: string;
}

// Define constants for default images
const DEFAULT_AVATAR = "https://img.icons8.com/?size=100&id=kDoeg22e5jUY&format=png&color=000000";
const DEFAULT_IMAGE = "/assets/images/placeholder.png";

// Define ReviewFormData type
export interface ReviewFormData {
  name: string;
  review: string;
  rating: number;
  images: File[];
}

// Define utility function for parsing ratings
const parseRating = (rating: string): number => {
  const parsed = parseFloat(rating);
  return isNaN(parsed) ? 0 : parsed;
};

export default function ProductRatingsReviews({ className }: ProductRatingsReviewsProps) {
  const { product, setProduct } = useProductStore();
  const { isLoggedIn, user, fetchAuthStatus } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [limit] = useState(5);
  const [offset, setOffset] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isWriteReviewModalOpen, setIsWriteReviewModalOpen] = useState(false);
  const [isEditReviewModalOpen, setIsEditReviewModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [reviewSort, setReviewSort] = useState("mostRecent");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product?.id) {
      fetchReviews();
      fetchAuthStatus();
    }

  }, [product?.id, offset, reviewSort]);

  const fetchReviews = async (variantId?: string) => {
    if (!product || !product.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        variantId: product.id,
      });
      const url = `/api/reviews/${product.productId}?${query}`;
      console.log('Fetching reviews from:', url);
      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404) {
          setError('Product or variant not found');
          setReviews([]);
          setTotalReviews(0);
          return;
        }

        console.error('API Error:', errorData);
        throw new Error(errorData.error || `Failed to fetch reviews (Status: ${response.status})`);
      }
      const data = await response.json();
      console.log("reviews", data)
      setReviews(data.reviews);
      setTotalReviews(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch reviews");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate the maximum count for scaling the rating bars
  const maxCount = Math.max(...(product?.ratingDistribution?.map((item: RatingDistribution) => item.count) || [1]));

  // Prepare customer images from reviews
  const customerImages = reviews
    .filter((review: Review) => review.images && review.images.length > 0)
    .flatMap((review: Review) => review.images || [])
    .slice(0, 6);

  const handleWriteReview = () => {
    if (!isLoggedIn) {
      setError("Please log in to write a review");
      return;
    }
    setIsWriteReviewModalOpen(true);
  };

  const handleEditReview = (review: Review) => {
    if (!isLoggedIn || !review.canEdit) {
      setError("You are not authorized to edit this review");
      return;
    }
    setSelectedReview(review);
    setIsEditReviewModalOpen(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!isLoggedIn) {
      setError("Please log in to delete a review");
      return;
    }
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || "Failed to delete review");
      }
      setReviews(reviews.filter((review) => review.id !== reviewId));
      setTotalReviews(totalReviews - 1);
      await updateProductRating();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete review");
    }
  };

  const handleImageClick = (review: Review, imageIndex: number) => {
    setSelectedReview(review);
    setSelectedImageIndex(imageIndex);
    setIsImageModalOpen(true);
  };



  const handleCustomerImageClick = (image: ReviewImage) => {
    for (const review of reviews) {
      if (review.images) {
        const imageIndex = review.images.findIndex((img: ReviewImage) => img.url === image.url);
        if (imageIndex !== -1) {
          handleImageClick(review, imageIndex);
          return;
        }
      }
    }
  };

  const handleReviewSubmit = async (reviewData: ReviewFormData) => {
    if (!isLoggedIn || !user?.id) {
      setError("Please log in to submit a review");
      return;
    }

    try {
      // Convert images to base64
      const imagePromises = reviewData.images.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return {
          file: base64,
          alt: `User uploaded image for ${reviewData.name}`,
          mimeType: file.type,
          fileName: file.name,
        };
      });
      const images = await Promise.all(imagePromises);

      const response = await fetch(`/api/reviews/${product?.productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rating: reviewData.rating,
          title: reviewData.name, // Using name as title for consistency
          comment: reviewData.review,
          images,
          variantId: product?.id,
        }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).error || "Failed to submit review");
      }

      const newReview = await response.json();
      setReviews([newReview, ...reviews]);
      setTotalReviews(totalReviews + 1);
      setIsWriteReviewModalOpen(false);
      await updateProductRating();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    }
  };

  const handleEditReviewSubmit = async (reviewData: ReviewFormData) => {
    if (!isLoggedIn || !user?.id || !selectedReview) {
      setError("Please log in to edit a review");
      return;
    }

    try {
      // Convert images to base64
      const imagePromises = reviewData.images.map(async (file) => {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        return {
          file: base64,
          alt: `User uploaded image for ${reviewData.name}`,
          mimeType: file.type,
          fileName: file.name,
        };
      });
      const images = await Promise.all(imagePromises);

      const response = await fetch(`/api/reviews/${selectedReview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          rating: reviewData.rating,
          title: reviewData.name,
          comment: reviewData.review,
          images,
          variantId: product?.id,
        }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).error || "Failed to update review");
      }

      const updatedReview = await response.json();
      setReviews(reviews.map((r) => (r.id === updatedReview.id ? updatedReview : r)));
      setIsEditReviewModalOpen(false);
      setSelectedReview(null);
      await updateProductRating();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update review");
    }
  };

  const updateProductRating = async () => {
    try {
      const response = await fetch(`/api/products/${product?.id}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error((await response.json()).error || "Failed to fetch product data");
      }
      const updatedProduct = await response.json();
      setProduct(updatedProduct);
    } catch (err) {
      console.error("Failed to update product rating:", err);
    }
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReviewSort(e.target.value);
    setOffset(0); // Reset offset when sorting changes
  };

  const handleLoadMore = () => {
    setOffset(offset + limit);
  };

  // Sort reviews based on selected option
  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      switch (reviewSort) {
        case "mostRecent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "highestRating":
          return parseFloat(b.rating) - parseFloat(a.rating);
        case "lowestRating":
          return parseFloat(a.rating) - parseFloat(b.rating);
        default: // topReviews
          const aVotes = parseInt(a.helpfulVotes) || 0;
          const bVotes = parseInt(b.helpfulVotes) || 0;
          return bVotes - aVotes;
      }
    });
  }, [reviews, reviewSort]);

  return (
    <div className={cn("mb-12", className)}>
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-red-900">Dismiss</button>
        </div>
      )}

      {/* Reviews Section */}
      <div>
        <div className="flex flex-col md:flex-row justify-between md:items-center my-8 md:my-16">
          <h2 className="text-2xl md:text-4xl font-medium md:font-bold">
            Ratings & <span className="text-primary">Reviews</span>
          </h2>
          <Button
            className="hidden md:flex items-center gap-2 text-black border hover:bg-gray-100 px-4 py-2 font-medium"
            onClick={handleWriteReview}
            disabled={isLoading}
          >
            Write a Review
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
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

        {/* Ratings & Reviews Section */}
        <section className="w-full mx-auto px-4 md:px-8 py-8 md:py-12">
          {/* Ratings Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
            <div className="grid grid-cols-2 items-end">
              {/* Average Rating */}
              <div className="flex flex-col justify-end">
                <div className="flex items-center mb-2">
                  <span className="text-3xl md:text-5xl font-semibold text-gray-900 mr-2">
                    {Number(product?.averageRating || 0).toFixed(1)}
                  </span>
                  <Star className="w-6 h-6 md:w-10 md:h-10 fill-black" />
                </div>
                <p className="text-gray-600 text-sm md:text-base">
                  {product?.ratingCount || 0} Ratings & {totalReviews} Reviews
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-3 text-sm md:text-base ml-4">
                {product?.ratingDistribution?.length ? (
                  product.ratingDistribution.map((item: RatingDistribution) => (
                    <div key={item.value} className="flex items-center gap-3">
                      <span className="w-6 text-right">{item.value}.0</span>
                      <Star className="w-4 h-4 fill-black" />
                      <div className="flex-1 bg-gray-200 rounded-full h-2 md:h-3">
                        <div
                          className="bg-blue-500 h-2 md:h-3 rounded-full"
                          style={{ width: `${(item.count / maxCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-600">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No ratings available</p>
                )}
              </div>
            </div>

            {/* Mobile Write Review Button */}
            <div className="md:hidden mt-6 flex justify-center">
              <Button
                className="bg-blue-600 text-white w-full py-2 rounded-md"
                onClick={handleWriteReview}
                disabled={isLoading}
              >
                Write a Review
              </Button>
            </div>
          </div>

          {/* Customer Images */}
          {customerImages.length > 0 && (
            <div className="mb-12">
              <h3 className="text-lg md:text-xl font-medium mb-4">Customer Photos</h3>
              <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
                {customerImages.slice(0, 6).map((image: ReviewImage, index: number) => (
                  <div
                    key={index}
                    className="relative w-20 h-20 md:w-28 md:h-28 border rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition"
                    onClick={() => handleCustomerImageClick(image)}
                  >
                    <Image
                      src={image.url || DEFAULT_IMAGE}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 768px) 80px, 112px"
                      className="object-cover"
                    />
                    {index === 5 && customerImages.length > 6 && (
                      <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center text-lg md:text-xl font-semibold">
                        +{customerImages.length - 6}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews Filter */}
          <div className="flex justify-end mb-4">
            <div className="relative w-40 md:w-48 text-sm">
              <select
                className="w-full border rounded-md py-2 px-3 appearance-none pr-10"
                value={reviewSort}
                onChange={handleSortChange}
                disabled={isLoading}
              >
                <option value="mostRecent">Most Recent</option>
                <option value="highestRating">Highest Rating</option>
                <option value="lowestRating">Lowest Rating</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {isLoading ? (
              <p className="text-center text-gray-500 py-8">Loading reviews...</p>
            ) : sortedReviews.length > 0 ? (
              sortedReviews.map((review: Review) => (
                <div key={review.id} className="border-b pb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden relative bg-gray-200 flex-shrink-0">
                      <Image
                        src={DEFAULT_AVATAR}
                        alt={`${review.userFirstName || 'User'} avatar`}
                        fill
                        sizes="(max-width: 768px) 40px, 48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-0">
                        <div>
                          <h4 className="font-semibold text-sm md:text-base">
                            {review.userFirstName && review.userLastName
                              ? `${review.userFirstName} ${review.userLastName}`
                              : 'Anonymous'}
                          </h4>
                          <p className="text-gray-500 text-xs md:text-sm">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm md:text-base">{parseFloat(review.rating).toFixed(1)}</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 md:w-4 md:h-4 ${star <= parseFloat(review.rating) ? 'fill-black' : 'text-gray-300'
                                  }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      {review.title && <p className="mt-2 font-medium text-sm md:text-base">{review.title}</p>}
                      {review.comment && <p className="mt-2 text-sm md:text-base">{review.comment}</p>}

                      {/* Review Actions */}
                      {review.canEdit && (
                        <div className="mt-2 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditReview(review)} disabled={isLoading}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteReview(review.id)} disabled={isLoading}>
                            <Trash className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      )}

                      {/* Review Images */}
                      {review.images && review.images.length > 0 && (
                        <div className="mt-3 ml-12 flex gap-2 overflow-x-auto scrollbar-hide">
                          {review.images.map((image: ReviewImage, index: number) => (
                            <div
                              key={index}
                              className="w-16 h-16 md:w-28 md:h-28 relative border rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition"
                              onClick={() => handleImageClick(review, index)}
                            >
                              <Image
                                src={image.url || DEFAULT_IMAGE}
                                alt={image.alt}
                                fill
                                sizes="(max-width: 768px) 64px, 112px"
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No reviews yet. Be the first to write one!</p>
            )}
          </div>

          {/* Load More Button */}
          {totalReviews > reviews.length && (
            <div className="mt-10 flex justify-center">
              <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
                Load More Reviews
              </Button>
            </div>
          )}
        </section>




        {/* Review Image Modal */}
        <ReviewImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          review={selectedReview}
          initialImageIndex={selectedImageIndex}
        />

        {/* Write Review Modal */}
        <WriteReviewModal
          isOpen={isWriteReviewModalOpen}
          onClose={() => setIsWriteReviewModalOpen(false)}
          onSubmit={handleReviewSubmit}
        />

        {/* Edit Review Modal */}
        <WriteReviewModal
          isOpen={isEditReviewModalOpen}
          onClose={() => {
            setIsEditReviewModalOpen(false);
            setSelectedReview(null);
          }}
          onSubmit={handleEditReviewSubmit}
          initialData={
            selectedReview
              ? {
                name: selectedReview.title || "",
                review: selectedReview.comment || "",
                rating: parseFloat(selectedReview.rating),
                images: [],
              }
              : undefined
          }
        />
      </div>
    </div>
  );
}