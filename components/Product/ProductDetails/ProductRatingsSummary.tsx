import { Star } from "lucide-react"

interface CategoryRating {
  name: string
  value: number
}

interface ProductRatingsSummaryProps {
  averageRating: number
  totalRatings: number
  totalReviews: number
  ratingDistribution: {
    value: number
    count: number
  }[]
  categoryRatings?: CategoryRating[]
  className?: string
}

export default function ProductRatingsSummary({
  averageRating,
  totalRatings,
  totalReviews,
  ratingDistribution,
  categoryRatings = [],
  className,
}: ProductRatingsSummaryProps) {
  // Calculate the maximum count for scaling the rating bars
  const maxCount = Math.max(...ratingDistribution.map((item) => item.count))

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${className}`}>
      {/* Overall Rating */}
      <div className="flex flex-col items-center">
        <div className="flex items-center mb-2">
          <span className="text-5xl font-bold mr-2">{averageRating.toFixed(1)}</span>
          <Star className="w-8 h-8 fill-black" />
        </div>
        <p className="text-gray-600">
          {totalRatings} Ratings & {totalReviews} Reviews
        </p>
      </div>

      {/* Rating Breakdown */}
      <div className="space-y-2">
        {ratingDistribution.map((item) => (
          <div key={item.value} className="flex items-center gap-2">
            <span className="w-8 text-right">{item.value}.0</span>
            <Star className="w-4 h-4 fill-black" />
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              ></div>
            </div>
            <span className="text-gray-600">{item.count}</span>
          </div>
        ))}
      </div>

      {/* Category Ratings */}
      {categoryRatings.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {categoryRatings.map((category) => (
            <div key={category.name} className="flex flex-col items-center">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e6e6e6" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="10"
                    strokeDasharray="282.7"
                    strokeDashoffset={282.7 - (282.7 * category.value) / 5}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xl font-bold">
                  {category.value.toFixed(1)}
                </div>
              </div>
              <p className="mt-2 text-center">{category.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
