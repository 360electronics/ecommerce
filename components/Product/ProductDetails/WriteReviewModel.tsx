"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { X, Upload, Star } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reviewData: ReviewFormData) => void;
  initialData?: ReviewFormData;
}

export interface ReviewFormData {
  name: string;
  review: string;
  rating: number;
  images: File[];
}

export default function WriteReviewModal({ isOpen, onClose, onSubmit, initialData }: WriteReviewModalProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [review, setReview] = useState(initialData?.review || "");
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [images, setImages] = useState<File[]>(initialData?.images || []);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData?.images) {
      const newPreviewUrls = initialData.images.map((file) => URL.createObjectURL(file));
      setImagePreviewUrls(newPreviewUrls);
      return () => newPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    }
  }, [initialData]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRatingClick = (value: number) => setRating(value);
  const handleRatingHover = (value: number) => setHoveredRating(value);
  const handleRatingLeave = () => setHoveredRating(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const newImages = [...images, ...newFiles].slice(0, 5);
      setImages(newImages);
      const newPreviewUrls = newImages.map((file) => URL.createObjectURL(file));
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setImagePreviewUrls(newPreviewUrls);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      const newImages = [...images, ...newFiles].slice(0, 5);
      setImages(newImages);
      const newPreviewUrls = newImages.map((file) => URL.createObjectURL(file));
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setImagePreviewUrls(newPreviewUrls);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    URL.revokeObjectURL(imagePreviewUrls[index]);
    const newPreviewUrls = [...imagePreviewUrls];
    newPreviewUrls.splice(index, 1);
    setImagePreviewUrls(newPreviewUrls);
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = "Required";
    if (!review.trim()) newErrors.review = "Required";
    if (rating === 0) newErrors.rating = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({ name, review, rating, images });
      setName("");
      setReview("");
      setRating(0);
      setImages([]);
      setErrors({});
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
      setImagePreviewUrls([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-md rounded shadow-lg">
        <div className="flex justify-between items-center p-3 border-b">
          <h2 className="text-lg font-medium">{initialData ? "Edit Review" : "Write Review"}</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 text-sm">
          <div>
            <label className="block mb-1">Title *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn("w-full p-2 border rounded", errors.name ? "border-red-500" : "border-gray-300")}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>

          <div>
            <label className="block mb-1">Review *</label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              className={cn("w-full p-2 border rounded h-20", errors.review ? "border-red-500" : "border-gray-300")}
            />
            {errors.review && <p className="text-red-500 text-xs">{errors.review}</p>}
          </div>

          <div>
            <label className="block mb-1">Rating *</label>
            <div className="flex gap-1" onMouseLeave={handleRatingLeave}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleRatingClick(value)}
                  onMouseEnter={() => handleRatingHover(value)}
                >
                  <Star
                    className={cn(
                      "w-5 h-5",
                      hoveredRating >= value || (!hoveredRating && rating >= value)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300",
                    )}
                  />
                </button>
              ))}
            </div>
            {errors.rating && <p className="text-red-500 text-xs">{errors.rating}</p>}
          </div>

          <div>
            <div
              className="border-2 border-dashed border-blue-300 rounded p-2 flex items-center justify-center cursor-pointer hover:bg-blue-50"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-blue-500 text-xs">Upload Images (max 5)</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            {imagePreviewUrls.length > 0 && (
              <div className="mt-2 flex gap-2">
                {imagePreviewUrls.map((url, index) => (
                  <div key={index} className="relative w-12 h-12 border rounded overflow-hidden">
                    <Image src={url} alt={`Preview ${index + 1}`} fill className="object-cover" />
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white p-0.5 text-xs"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit}>
              {initialData ? "Update" : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}