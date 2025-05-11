// components/Profile/Wishlist.tsx
'use client';
import { useAuth } from '@/context/auth-context';
import { useProfileContext } from '@/components/Profile/ProfileContext';
import { AlertCircle, Heart, Loader2, ShoppingCart } from 'lucide-react';

export default function Wishlist() {
  const { user, isLoading: authLoading } = useAuth();
  const { wishlistItems, isLoading, error, refetch } = useProfileContext();

  // Function to format price nicely
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Function to format date nicely
  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.log(e)
      return dateString;
    }
  };

  // Function to handle removing an item from wishlist
  const handleRemoveFromWishlist = async (itemId: string) => {
    try {
      const res = await fetch(`/api/wishlist/${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to remove item from wishlist');
      }

      refetch(); // Refetch data to update context
    } catch (error) {
      console.error('Error removing item from wishlist:', error);
    }
  };

  // Function to handle adding item to cart
  const handleAddToCart = async (productId: string) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          quantity: 1,
          userId: user?.id,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to add item to cart');
      }

      console.log('Item added to cart successfully');
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
        <span className="text-sm text-gray-500">
          {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {wishlistItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wishlistItems.map((item) => (
            <div
              key={item.id}
              className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex h-full">
                {item.imageUrl && (
                  <div className="flex-shrink-0 w-1/3 bg-gray-100 flex items-center justify-center">
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                )}
                <div className="flex-1 p-4 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{item.productName}</h3>
                    <p className="mt-1 text-lg font-bold text-gray-900">{formatPrice(item.price)}</p>
                    <p className="mt-1 text-sm text-gray-500">Added on {formatDate(item.createdAt)}</p>
                    {item.inStock !== undefined && (
                      <span
                        className={`inline-flex mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                          item.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleAddToCart(item.productId)}
                      disabled={item.inStock === false}
                      className={`flex-1 flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                        item.inStock !== false
                          ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                          : 'bg-gray-300 cursor-not-allowed'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => handleRemoveFromWishlist(item.id)}
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!error && wishlistItems.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
          <p className="mt-1 text-sm text-gray-500">
            No wishlist items found for this user. Browse our products and add some to your wishlist!
          </p>
          <div className="mt-6">
            <a
              href="/shop"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Browse products
            </a>
          </div>
        </div>
      )}
    </div>
  );
}