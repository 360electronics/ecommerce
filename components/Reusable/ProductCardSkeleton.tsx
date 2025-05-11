export const ProductCardSkeleton = () => {
    return (
      <div className="w-full rounded-lg animate-pulse">
        <div className="relative">
          {/* Skeleton image with square aspect ratio */}
          <div className="mb-4 relative w-full aspect-square border border-gray-100 rounded-md bg-gray-200 overflow-hidden"></div>
  
          {/* Skeleton product info */}
          <div className="space-y-3">
            {/* Title skeleton */}
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            
            {/* Rating skeleton */}
            <div className="flex items-center">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            
            {/* Price skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-5 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded-full w-12"></div>
            </div>
            
            {/* View details skeleton */}
            <div className="pt-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  