"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { AlertCircle, Heart } from "lucide-react";
import Link from "next/link";
import WishlistProductCard from "../Product/ProductCards/WishlistProductCard";
import { ProductCardSkeleton } from "../Reusable/ProductCardSkeleton";
import { showFancyToast } from "../Reusable/ShowCustomToast";

// Define interfaces for type safety
interface WishlistItem {
  productId: string;
  variantId: string;
  variant: {
    name?: string;
    mrp?: number;
    ourPrice?: number;
    slug?: string;
    productImages?: Array<{ url: string }>;
  };
}

export default function Wishlist() {
  const { user, isLoading: authLoading, isLoggedIn } = useAuthStore();
  const { wishlist, errors, fetchWishlist, removeFromWishlist } =
    useWishlistStore();

  // Fetch wishlist data on mount if user is authenticated
  useEffect(() => {
    if (authLoading || !isLoggedIn || !user?.id) {
      return;
    }

    const abortController = new AbortController();
    fetchWishlist(true);

    return () => {
      abortController.abort();
    };
  }, [authLoading, isLoggedIn, user?.id, fetchWishlist]);

  const handleRemoveFromWishlist = async (
    productId: string,
    variantId: string
  ) => {
    try {
      await removeFromWishlist(productId, variantId);
      showFancyToast({
        title: "Item Removed Successfully",
        message: "The item has been removed from your wishlist.",
        type: "success",
      });
    } catch (error) {
      showFancyToast({
        title: "Sorry, Something Went Wrong",
        message: "The item has been removed from your wishlist.",
        type: "error",
      });
    }
  };

  const renderSkeletons = () => {
    // Dynamically adjust skeleton count based on screen size or grid layout
    const skeletonCount = 6; // Adjust based on grid-cols (e.g., 3 for lg, 2 for sm)
    return Array(skeletonCount)
      .fill(0)
      .map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="snap-start flex-shrink-0 w-72"
        >
          <ProductCardSkeleton />
        </div>
      ));
  };

  if (authLoading) {
    return (
      <div className="flex flex-wrap w-full justify-between gap-6 pl-1">
        {renderSkeletons()}
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 my-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Authentication required
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please{" "}
              <Link href="/signin" className="text-primary hover:underline">
                log in
              </Link>{" "}
              to view your wishlist.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const wishlistCount = wishlist.length;
  const wishlistItems = wishlist;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 nohemi-bold">
          My{" "}
          <span className="text-primary border-b-3 border-primary">
            Wishlist
          </span>
        </h1>
        <span className="text-2xl text-gray-500 nohemi-bold">
          ({wishlistCount})
        </span>
      </div>

      {(errors.fetch || errors.add || errors.remove) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">
                {String(
                  errors.fetch ||
                    errors.add ||
                    errors.remove ||
                    "An error occurred. Please try again."
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistItems.map((item) => (
            <div key={`${item.productId}-${item.variantId}`}>
              <WishlistProductCard
                productId={item.productId}
                variantId={item.variantId}
                name={item.variant?.name || "Unknown Product"}
                mrp={Number(item.variant?.mrp || 0)}
                ourPrice={Number(item.variant?.ourPrice || 0)}
                slug={item.variant?.slug || "#"}
                image={(() => {
                  const img = item.variant?.productImages?.[0];
                  if (typeof img === "string") {
                    return img;
                  }
                  if (
                    img &&
                    typeof img === "object" &&
                    img !== null &&
                    typeof (img as { url?: unknown }).url === "string"
                  ) {
                    return (img as { url: string }).url;
                  }
                  return "/placeholder-image.png";
                })()}
                onRemove={() =>
                  handleRemoveFromWishlist(item.productId, item.variantId)
                }
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            Your wishlist is empty
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add some products to your wishlist to see them here.
          </p>
          <div className="mt-6">
            <Link
              href="/category/all"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-[#ff6b00] to-[#ff9f00] hover:to-primary-hover "
              aria-label="Browse products"
            >
              Browse products
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
