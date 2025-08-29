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
        throw new Error(errorData.error || `Failed to fetch reviews (Status: ${response.status})`);
      }
      const data = await response.json();
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
    .slice(0, 4); // Reduced to 4 images

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
          title: reviewData.name,
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
    <div className={cn("mb-6", className)}>
      {/* Error Message */}
      {error && (
        <div className="mb-2 p-2 bg-red-100 text-red-700 rounded text-sm">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-900 text-xs">Dismiss</button>
        </div>
      )}

      {/* Reviews Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-medium">
            Ratings & Reviews
          </h2>
        </div>

        {/* Ratings Summary */}
        <div className=" flex justify-between  gap-20 mb-4">
          <div className="w-full max-w-xs ">
            <div className="flex items-center">
              <span className="text-2xl font-semibold mr-1">
                {Number(product?.averageRating || 0).toFixed(1)}
              </span>
              <Star className="w-5 h-5 fill-black" />
              <p className="ml-2 text-sm text-gray-600">
                ({product?.ratingCount || 0} ratings, {totalReviews} reviews)
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-1 text-xs  py-4">
              {product?.ratingDistribution?.length ? (
                product.ratingDistribution.map((item: RatingDistribution) => (
                  <div key={item.value} className="flex items-center gap-2">
                    <span className="w-6 flex items-center gap-1"><Star className="w-3 h-3 fill-black" />{item.value}</span>
                    <div className="flex-1 bg-gray-200 rounded h-1">
                      <div
                        className="bg-blue-500 h-1 rounded"
                        style={{ width: `${(item.count / maxCount) * 100}%` }}
                      />
                    </div>
                    <span>{item.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No ratings</p>
              )}
            </div>

            <div className=" py-2">

              <Button
                size="sm"
                className="text-sm px-3 py-1"
                onClick={handleWriteReview}
                disabled={isLoading}
              >
                Write Review
              </Button>
            </div>
          </div>

          <div className="w-full">

            {/* Customer Images */}
            {customerImages.length > 0 && (
              <div className="mb-4 w-full">
                <h3 className="text-lg font-medium mb-4">Reviews with Images</h3>
                <div className="flex gap-2 ">
                  {customerImages.map((image: ReviewImage, index: number) => (
                    <div
                      key={index}
                      className="w-40 h-40 border rounded overflow-hidden cursor-pointer relative"
                      onClick={() => handleCustomerImageClick(image)}
                    >
                      <Image
                        src={image.url || DEFAULT_IMAGE}
                        alt={image.alt}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4 w-full py-4">
              {isLoading ? (
                <p className="text-center text-gray-500">Loading...</p>
              ) : sortedReviews.length > 0 ? (
                sortedReviews.map((review: Review) => (
                  <div key={review.id} className="border-b pb-2">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 relative">
                        <Image
                          src={DEFAULT_AVATAR}
                          alt="Avatar"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <div>
                            <h4 className="font-medium">
                              {review.userFirstName ? `${review.userFirstName} ${review.userLastName || ''}` : 'Anonymous'}
                            </h4>

                            <p className="text-gray-500 text-xs">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex items-center gap-1">
                              <span>{parseFloat(review.rating).toFixed(1)}</span>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${star <= parseFloat(review.rating) ? 'fill-black' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                        </div>
                        {review.title && <p className="mt-1 text-sm font-medium">{review.title}</p>}
                        {review.comment && <p className="mt-1 text-sm">{review.comment}</p>}

                        {/* Review Actions */}
                        {review.canEdit && (
                          <div className="mt-1 flex gap-2 text-xs">
                            <Button variant="outline" size="sm" onClick={() => handleEditReview(review)} disabled={isLoading}>
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteReview(review.id)} disabled={isLoading}>
                              <Trash className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        )}

                        {/* Review Images */}
                        {review.images && review.images.length > 0 && (
                          <div className="mt-2 flex gap-2 overflow-x-auto">
                            {review.images.map((image: ReviewImage, index: number) => (
                              <div
                                key={index}
                                className="w-16 h-16 border rounded overflow-hidden cursor-pointer relative"
                                onClick={() => handleImageClick(review, index)}
                              >
                                <Image
                                  src={image.url || DEFAULT_IMAGE}
                                  alt={image.alt}
                                  fill
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
                <p className="text-center text-gray-500 text-sm">No reviews yet.</p>
              )}
            </div>

            {/* Load More Button */}
            {totalReviews > reviews.length && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={isLoading}>
                  Load More
                </Button>
              </div>
            )}
          </div>


        </div>





      </div>

      {/* Modals */}
      <ReviewImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        review={selectedReview}
        initialImageIndex={selectedImageIndex}
      />

      <WriteReviewModal
        isOpen={isWriteReviewModalOpen}
        onClose={() => setIsWriteReviewModalOpen(false)}
        onSubmit={handleReviewSubmit}
      />

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
  );
}