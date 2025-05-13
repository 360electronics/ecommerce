'use client';
import { useAuth } from '@/context/auth-context';
import { AlertCircle, Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import WishlistProductCard from '../Product/ProductCards/WishlistProductCard';
import { useProfileContext } from '@/context/profile-context';

export default function Wishlist() {
  const { user, isLoading: authLoading } = useAuth();
  const { wishlistItems, isLoading, error } = useProfileContext();

  


  // Function to calculate discount percentage
  const calculateDiscount = (mrp: string, ourPrice: string | null) => {
    if (!ourPrice) return 0;
    const mrpNum = parseFloat(mrp);
    const ourPriceNum = parseFloat(ourPrice);
    if (isNaN(mrpNum) || isNaN(ourPriceNum) || mrpNum <= 0) return 0;
    return Math.round(((mrpNum - ourPriceNum) / mrpNum) * 100);
  };

  // Function to handle adding item to cart
  // const handleAddToCart = async (productId: string) => {
  //   try {
  //     const res = await fetch('/api/cart', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({
  //         productId,
  //         quantity: 1,
  //         userId: user?.id,
  //       }),
  //     });

  //     if (!res.ok) {
  //       throw new Error('Failed to add item to cart');
  //     }

  //     console.log('Item added to cart successfully');
  //   } catch (error) {
  //     console.error('Error adding item to cart:', error);
  //   }
  // };

  if (authLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 my-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Authentication required</h3>
            <p className="text-sm text-yellow-700 mt-1">Please log in to view your wishlist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6 gap-2">
        <h1 className="text-2xl font-bold text-gray-900 nohemi-bold">My <span className='border-b-3 border-primary text-primary'>Wishlist</span></h1>
        <span className="text-2xl text-gray-500 nohemi-bold">
          ({wishlistItems.length})
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {wishlistItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistItems.map((item) => (
            <div key={item.id} className="relative">
              {item.product ? (
                <WishlistProductCard
                productId={item.product.id}
                variantId={item.variant.id}
                  image={item.variant.productImages[0] || '/default-product.jpg'}
                  name={item.variant.name}
                  rating={parseFloat(item.product.averageRating) || 0}
                  ourPrice={parseFloat(item.variant.ourPrice || item.variant.mrp)}
                  mrp={parseFloat(item.variant.mrp)}
                  discount={calculateDiscount(item.variant.mrp, item.variant.ourPrice)}
                  showViewDetails={true}
                  slug={item.variant.slug}
                  isHeartNeed={true}
                />
              ) : (
                <div className="bg-white shadow rounded-lg border border-gray-200 p-4 text-center">
                  <p className="text-sm text-gray-500">Product not found</p>
                  <button
                    className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                  >
                    Remove
                  </button>
                </div>
              )}
              
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
          <p className="mt-1 text-sm text-gray-500">
            No wishlist items found for this user. Browse our products and add some to your wishlist!
          </p>
          <div className="mt-6">
            <Link
              href="/shop"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse products
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}