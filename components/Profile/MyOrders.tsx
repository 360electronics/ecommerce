// components/Profile/MyOrders.tsx
'use client';
import { useAuth } from '@/context/auth-context';
import { useProfileContext } from '@/components/Profile/ProfileContext';
import { AlertCircle, ShoppingBag, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function Orders() {
  const { user, isLoading: authLoading } = useAuth();
  const { orders, isLoading, error } = useProfileContext();

  // Function to format date nicely
  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.log(e)
      return dateString;
    }
  };

  // Function to get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            <p className="text-sm text-yellow-700 mt-1">Please log in to view your orders.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <span className="text-sm text-gray-500">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'}
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

      {orders.length > 0 && (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white shadow sm:rounded-lg overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Order #{order.id.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Order Status: <span className="font-medium">{order.status}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-bold">${order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-right">
                <a
                  href={`/orders/${order.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  View Order Details →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {!error && orders.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No orders found for this user. Check out our products and start shopping!
          </p>
          <div className="mt-6">
            <Link
              href="/category/all"
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