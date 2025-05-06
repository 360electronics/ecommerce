"use client"

import type React from "react"

import { useState, useRef, type ChangeEvent } from "react"
import { X, Camera, Upload, Star } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useProductContext } from "@/context/product-context"

interface WriteReviewModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reviewData: ReviewFormData) => void
}

export interface ReviewFormData {
  name: string
  review: string
  rating: number
  images: File[]
}

export default function WriteReviewModal({ isOpen, onClose, onSubmit }: WriteReviewModalProps) {
  const { product } = useProductContext()
  const [name, setName] = useState("")
  const [review, setReview] = useState("")
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [images, setImages] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Prevent body scroll when modal is open
  if (typeof window !== "undefined") {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
  }

  if (!isOpen) return null

  const handleRatingClick = (value: number) => {
    setRating(value)
  }

  const handleRatingHover = (value: number) => {
    setHoveredRating(value)
  }

  const handleRatingLeave = () => {
    setHoveredRating(0)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      const newImages = [...images, ...newFiles].slice(0, 5) // Limit to 5 images
      setImages(newImages)

      // Create preview URLs
      const newPreviewUrls = newImages.map((file) => URL.createObjectURL(file))

      // Revoke old URLs to prevent memory leaks
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url))

      setImagePreviewUrls(newPreviewUrls)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      const newImages = [...images, ...newFiles].slice(0, 5) // Limit to 5 images
      setImages(newImages)

      // Create preview URLs
      const newPreviewUrls = newImages.map((file) => URL.createObjectURL(file))

      // Revoke old URLs to prevent memory leaks
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url))

      setImagePreviewUrls(newPreviewUrls)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)

    // Revoke the URL of the removed image
    URL.revokeObjectURL(imagePreviewUrls[index])

    const newPreviewUrls = [...imagePreviewUrls]
    newPreviewUrls.splice(index, 1)
    setImagePreviewUrls(newPreviewUrls)
  }

  const handleTakePhoto = () => {
    // This would typically open the device camera
    // For now, we'll just open the file picker
    fileInputRef.current?.click()
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!review.trim()) {
      newErrors.review = "Review is required"
    }

    if (rating === 0) {
      newErrors.rating = "Please rate the product"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        name,
        review,
        rating,
        images,
      })

      // Reset form
      setName("")
      setReview("")
      setRating(0)
      setImages([])

      // Revoke all image URLs
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url))
      setImagePreviewUrls([])

      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Write a Review</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block mb-2">
              <span className="text-gray-700">
                <span className="text-red-500">*</span>Enter your name
              </span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn("w-full p-2 border rounded-md", errors.name ? "border-red-500" : "border-gray-300")}
              placeholder="Your name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="mb-4">
            <label className="block mb-2">
              <span className="text-gray-700">
                <span className="text-red-500">*</span>Your Review
              </span>
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className={cn(
                "w-full p-2 border rounded-md min-h-[150px]",
                errors.review ? "border-red-500" : "border-gray-300",
              )}
              placeholder="Write your review here..."
            />
            {errors.review && <p className="text-red-500 text-sm mt-1">{errors.review}</p>}
          </div>

          <div className="mb-6">
            <label className="block mb-2">
              <span className="text-gray-700">
                <span className="text-red-500">*</span>Rate a product
              </span>
            </label>
            <div className="flex gap-2" onMouseLeave={handleRatingLeave}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleRatingClick(value)}
                  onMouseEnter={() => handleRatingHover(value)}
                  className="focus:outline-none"
                >
                  <Star
                    className={cn(
                      "w-6 h-6 transition-colors",
                      hoveredRating >= value || (!hoveredRating && rating >= value)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300",
                    )}
                  />
                </button>
              ))}
            </div>
            {errors.rating && <p className="text-red-500 text-sm mt-1">{errors.rating}</p>}
          </div>

          <div className="mb-6">
            <div className="flex gap-4">
              {/* Image upload area */}
              <div
                className={cn(
                  "border-2 border-dashed border-blue-300 rounded-md p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors",
                  "w-32 h-32",
                )}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="w-6 h-6 text-blue-500 mb-2" />
                <span className="text-sm text-center text-blue-500">Upload Image</span>
                <span className="text-xs text-gray-500">or drop a file</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Take a photo button */}
              <button
                type="button"
                onClick={handleTakePhoto}
                className="bg-blue-500 text-white rounded-md px-4 py-2 flex items-center gap-2 hover:bg-blue-600 transition-colors h-12 self-center"
              >
                <Camera className="w-5 h-5" />
                Take a Photo
              </button>
            </div>

            {/* Image previews */}
            {imagePreviewUrls.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative w-20 h-20 border rounded-md overflow-hidden">
                    <Image src={url || "/placeholder.svg"} alt={`Preview ${index + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md p-1"
                      aria-label="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="px-6">
              Back
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600 text-white px-6">
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
