// "use client"

// import Image from "next/image"
// import { Star } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { cn } from "@/lib/utils"
// import { useProductContext } from "@/context/product-context"
// import ReviewImageModal from "./ReviewImageModal"
// import WriteReviewModal, { type ReviewFormData } from "./WriteReviewModel"
// import { useState } from "react"

// // Define proper TypeScript types
// export interface ReviewImage {
//   src: string;
//   alt: string;
// }

// export interface ReviewAuthor {
//   name: string;
//   avatar: string;
//   date: string;
// }

// export interface Review {
//   id: string | number;
//   author: ReviewAuthor;
//   rating: number;
//   comment: string;
//   images?: ReviewImage[];
// }

// export interface RatingDistribution {
//   value: number;
//   count: number;
// }

// export interface CategoryRating {
//   name: string;
//   value: number;
// }

// interface ProductRatingsReviewsProps {
//   className?: string;
// }

// export default function ProductRatingsReviews({ className }: ProductRatingsReviewsProps) {
//   const { product } = useProductContext()
//   const [isImageModalOpen, setIsImageModalOpen] = useState(false)
//   const [isWriteReviewModalOpen, setIsWriteReviewModalOpen] = useState(false)
//   const [selectedReview, setSelectedReview] = useState<Review | null>(null)
//   const [selectedImageIndex, setSelectedImageIndex] = useState(0)
//   const [reviewSort, setReviewSort] = useState("topReviews")

//   // Calculate the maximum count for scaling the rating bars
//   const maxCount = Math.max(...product.ratingDistribution.map((item: RatingDistribution) => item.count))

//   // Prepare customer images from reviews
//   const customerImages = product.reviews
//     .filter((review: Review) => review.images && review.images.length > 0)
//     .flatMap((review: Review) => review.images || [])
//     .slice(0, 6)

//   const handleWriteReview = () => {
//     setIsWriteReviewModalOpen(true)
//   }

//   const handleImageClick = (review: Review, imageIndex: number) => {
//     setSelectedReview(review)
//     setSelectedImageIndex(imageIndex)
//     setIsImageModalOpen(true)
//   }

//   const handleCustomerImageClick = (image: ReviewImage) => {
//     // Find the review that contains this image
//     for (const review of product.reviews) {
//       if (review.images) {
//         const imageIndex = review.images.findIndex((img: ReviewImage) => img.src === image.src)
//         if (imageIndex !== -1) {
//           handleImageClick(review, imageIndex)
//           return
//         }
//       }
//     }
//   }

//   const handleReviewSubmit = (reviewData: ReviewFormData) => {
//     // Here you would typically send the review data to your backend
//     console.log("Review submitted:", reviewData)

//     // For demo purposes, we'll create a new review and add it to the list
//     // In a real app, you would update this after the backend confirms the submission
//     const newReview: Review = {
//       id: `temp-${Date.now()}`,
//       author: {
//         name: reviewData.name,
//         avatar: "/diverse-group.png", // Default avatar
//         date: new Date().toLocaleDateString(),
//       },
//       rating: reviewData.rating,
//       comment: reviewData.review,
//       images:
//         reviewData.images.length > 0
//           ? reviewData.images.map((file, index) => ({
//               src: URL.createObjectURL(file),
//               alt: `User uploaded image ${index + 1}`,
//             }))
//           : undefined,
//     }

//     // In a real app, you would update your state or trigger a refetch
//     // For now, we'll just log the new review
//     console.log("New review created:", newReview)

//     // Close the modal
//     setIsWriteReviewModalOpen(false)
//   }

//   const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     setReviewSort(e.target.value);
//   }

//   // Sort reviews based on selected option
//   const sortedReviews = [...product.reviews].sort((a, b) => {
//     switch(reviewSort) {
//       case "mostRecent":
//         return new Date(b.author.date).getTime() - new Date(a.author.date).getTime();
//       case "highestRating":
//         return b.rating - a.rating;
//       case "lowestRating":
//         return a.rating - b.rating;
//       default: // topReviews - could be based on helpfulness or other criteria
//         return b.rating - a.rating; // Default to highest rating for "top reviews"
//     }
//   });

//   return (
//     <div className={cn("mb-12", className)}>
//       {/* Reviews Section */}
//       <div>
//         <div className="flex flex-col md:flex-row justify-between md:items-center my-8 md:my-16">
//           <h2 className="text-2xl md:text-4xl font-medium md:font-bold">
//             Ratings & <span className="text-primary">Reviews</span>
//           </h2>
//           <Button
//             className="hidden md:flex items-center gap-2 bg-transparent text-black border hover:bg-gray-100 px-4 py-2 font-medium"
//             onClick={handleWriteReview}
//           >
//             Write a Review
//             <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
//               <path
//                 d="M3.75 10H16.25"
//                 stroke="currentColor"
//                 strokeWidth="1.5"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               />
//               <path
//                 d="M11.25 5L16.25 10L11.25 15"
//                 stroke="currentColor"
//                 strokeWidth="1.5"
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//               />
//             </svg>
//           </Button>
//         </div>

//         {/* Ratings Summary Section */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
//           <div className="grid grid-cols-2">
//             {/* Overall Rating */}
//             <div className="flex flex-col items-start md:justify-end">
//               <div className="flex items-center md:items-end mb-2">
//                 <span className="text-2xl md:text-5xl font-medium md:mr-2 mr-1">
//                   {Number(product.averageRating).toFixed(1)}
//                 </span>
//                 <Star className="w-6 h-6 md:w-14 md:h-14 fill-black" />
//               </div>
//               <p className="text-gray-600 text-xs md:text-base">
//                 {product.ratingCount} Ratings & {product.reviews.length} Reviews
//               </p>
//             </div>

//             {/* Rating Breakdown */}
//             <div className="space-y-2 mt-4 text-xs md:text-base">
//               {product.ratingDistribution.map((item: RatingDistribution) => (
//                 <div key={item.value} className="flex items-center gap-2">
//                   <span className="w-6 md:w-8 text-right">{item.value}.0</span>
//                   <Star className="w-4 h-4 fill-black" />
//                   <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2.5">
//                     <div
//                       className="bg-blue-500 h-1.5 md:h-2.5 rounded-full"
//                       style={{ width: `${(item.count / maxCount) * 100}%` }}
//                     />
//                   </div>
//                   <span className="text-gray-600">{item.count}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Category Ratings */}
//           {product.categoryRatings && product.categoryRatings.length > 0 && (
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//               {product.categoryRatings.map((category: CategoryRating) => (
//                 <div key={category.name} className="flex flex-col items-center justify-end">
//                   <div className="relative w-16 h-16 md:w-20 md:h-20">
//                     <svg viewBox="0 0 100 100" className="w-full h-full">
//                       <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" strokeWidth="10" />
//                       <circle
//                         cx="50"
//                         cy="50"
//                         r="45"
//                         fill="none"
//                         stroke="#3b82f6"
//                         strokeWidth="8"
//                         strokeDasharray="282.7"
//                         strokeDashoffset={282.7 - (282.7 * category.value) / 5}
//                         strokeLinecap="round"
//                         transform="rotate(-90 50 50)"
//                       />
//                     </svg>
//                     <div className="absolute inset-0 flex items-center justify-center text-lg md:text-xl font-bold">
//                       {category.value.toFixed(1)}
//                     </div>
//                   </div>
//                   <p className="mt-2 text-center font-medium text-xs md:text-base">{category.name}</p>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Mobile Write Review Button */}
//         <div className="md:hidden flex justify-center mb-6">
//           <Button className="bg-blue-500 text-white w-full py-2" onClick={handleWriteReview}>
//             Write a Review
//           </Button>
//         </div>

//         {/* Customer Images */}
//         {customerImages.length > 0 && (
//           <div className="mt-8 md:mt-14 mb-8">
//             <h3 className="text-lg md:text-xl font-medium mb-4">Customer Photos</h3>
//             <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
//               {customerImages.map((image: ReviewImage, index: number) => (
//                 <div
//                   key={index}
//                   className="w-20 h-20 md:w-28 md:h-28 flex-shrink-0 relative border rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
//                   onClick={() => handleCustomerImageClick(image)}
//                 >
//                   <Image 
//                     src={image.src || "/placeholder.svg"} 
//                     alt={image.alt} 
//                     fill 
//                     sizes="(max-width: 768px) 80px, 112px"
//                     className="object-cover" 
//                   />
//                   {index === 5 && customerImages.length > 6 && (
//                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg md:text-xl">
//                       +{customerImages.length - 6}
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Reviews Filter */}
//         <div className="mt-8 flex justify-end">
//           <div className="relative w-40 md:w-48 text-xs md:text-sm">
//             <select 
//               className="w-full border rounded-md py-2 px-3 appearance-none pr-10"
//               value={reviewSort}
//               onChange={handleSortChange}
//             >
//               <option value="topReviews">Top Reviews</option>
//               <option value="mostRecent">Most Recent</option>
//               <option value="highestRating">Highest Rating</option>
//               <option value="lowestRating">Lowest Rating</option>
//             </select>
//             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
//               <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
//                 <path
//                   d="M4 6L8 10L12 6"
//                   stroke="currentColor"
//                   strokeWidth="1.5"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//               </svg>
//             </div>
//           </div>
//         </div>

//         {/* Reviews List */}
//         <div className="mt-6 space-y-6">
//           {sortedReviews.length > 0 ? (
//             sortedReviews.map((review: Review) => (
//               <div key={review.id} className="border-b pb-6">
//                 <div className="flex items-start gap-3 md:gap-4">
//                   <div className="w-8 h-8 md:w-12 md:h-12 rounded-full overflow-hidden relative bg-gray-200 flex-shrink-0">
//                     {review.author.avatar && (
//                       <Image
//                         src={review.author.avatar}
//                         alt={review.author.name}
//                         fill
//                         sizes="(max-width: 768px) 32px, 48px"
//                         className="object-cover"
//                       />
//                     )}
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-0">
//                       <div>
//                         <h4 className="font-semibold text-xs md:text-base">{review.author.name}</h4>
//                         <p className="text-gray-500 text-xs md:text-sm">{review.author.date}</p>
//                       </div>
//                       <div className="flex items-center gap-1">
//                         <span className="font-medium text-xs md:text-base">{review.rating.toFixed(1)}</span>
//                         <div className="flex">
//                           {[1, 2, 3, 4, 5].map((star) => (
//                             <Star
//                               key={star}
//                               className={`w-3 h-3 md:w-4 md:h-4 ${
//                                 star <= review.rating ? "fill-black" : "text-gray-300"
//                               }`}
//                             />
//                           ))}
//                         </div>
//                       </div>
//                     </div>
//                     <p className="mt-2 text-sm md:text-base">{review.comment}</p>
//                   </div>
//                 </div>
//                 {review.images && review.images.length > 0 && (
//                   <div className="mt-3 md:mt-4 ml-11 md:ml-16 flex gap-2 overflow-x-auto scrollbar-hide">
//                     {review.images.map((image: ReviewImage, index: number) => (
//                       <div
//                         key={index}
//                         className="w-16 h-16 md:w-28 md:h-28 relative border rounded-md overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
//                         onClick={() => handleImageClick(review, index)}
//                       >
//                         <Image 
//                           src={image.src || "/placeholder.svg"} 
//                           alt={image.alt} 
//                           fill 
//                           sizes="(max-width: 768px) 64px, 112px"
//                           className="object-cover" 
//                         />
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             ))
//           ) : (
//             <div className="py-8 text-center">
//               <p className="text-gray-500">No reviews yet. Be the first to write a review!</p>
//             </div>
//           )}
//         </div>
        
//         {/* Load More Button - Show if there are more than 5 reviews */}
//         {sortedReviews.length > 5 && (
//           <div className="mt-8 flex justify-center">
//             <Button variant="outline" className="px-8">
//               Load More Reviews
//             </Button>
//           </div>
//         )}
//       </div>

//       {/* Review Image Modal */}
//       <ReviewImageModal
//         isOpen={isImageModalOpen}
//         onClose={() => setIsImageModalOpen(false)}
//         review={selectedReview as any}
//         initialImageIndex={selectedImageIndex}
//       />

//       {/* Write Review Modal */}
//       <WriteReviewModal
//         isOpen={isWriteReviewModalOpen}
//         onClose={() => setIsWriteReviewModalOpen(false)}
//         onSubmit={handleReviewSubmit}
//       />
//     </div>
//   )
// }

import React from 'react'

const ProductRatingsReviews = () => {
  return (
    <div>
      
    </div>
  )
}

export default ProductRatingsReviews
