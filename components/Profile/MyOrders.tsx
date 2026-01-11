'use client';

import { useAuthStore } from '@/store/auth-store';
import { useProfileStore } from '@/store/profile-store';
import { AlertCircle, ShoppingBag, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SkeletonLoader from '../Reusable/SkeletonLoader';

export default function Orders() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { orders, loadingStates, isRefetching, errors } = useProfileStore();

  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      return new Date(dateString).toLocaleDateString('en-IN', options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (authLoading || loadingStates.orders) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonLoader count={3} className="space-y-6" />
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 nohemi-bold">
          My <span className="text-primary border-b-3 border-primary">Orders</span>
        </h1>
        <span className="text-2xl text-gray-500 nohemi-bold">({orders.length})</span>
      </div>

     
      {orders.length > 0 ? (
        <div className="mt-6 space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white sm:rounded-lg overflow-hidden border border-gray-200"
            >
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Order #{order.id.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getPaymentStatusColor(
                        String(order.paymentStatus)
                      )}`}
                    >
                      {String(order.paymentStatus)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  {order.items.length > 0 ? (
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div
                          key={`${item.productId}-${item.variantId}`}
                          className="flex items-center space-x-4 border-b border-gray-100 pb-4 last:border-b-0"
                        >
                          <div className="flex-shrink-0">
                            {item.variant && item.variant.productImages?.[0] ? (
                              <img
                                src={item.variant.productImages[0].url}
                                alt={item.variant.name || 'Product'}
                                width={80}
                                height={80}
                                className="rounded-md object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center">
                                <ShoppingBag className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.variant?.name || 'Unknown Product'}
                            </h4>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                            <p className="text-sm text-gray-500">
                              Unit Price: ₹{Number(item.unitPrice).toLocaleString('en-IN')}
                            </p>
                            {item.variant && (
                              <p className="text-sm text-gray-500">SKU: {item.variant.sku}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ₹{(Number(item.unitPrice) * item.quantity).toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No items in this order.</p>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Order Status: <span className="font-medium capitalize">{order.status}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Payment Status: <span className="font-medium capitalize">{String(order.paymentStatus)}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Payment Method: <span className="font-medium capitalize">{String(order.paymentMethod)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-lg font-bold">
                        ₹{Number(order.totalAmount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-right">
                <Link
                  href={`/profile/orders/${order.id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  aria-label={`View details for order ${order.id.substring(0, 8)}`}
                >
                  View Order Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No orders found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No orders found for this user. Check out our products and start shopping!
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