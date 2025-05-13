'use client';

import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import UserLayout from '@/components/Layouts/UserLayout';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';

// Type definitions based on api/cart/route.ts and schemas
interface CartItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  product: {
    id: string;
    shortName: string;
    description: string | null;
    category: string;
    brand: string;
    status: 'active' | 'inactive';
    subProductStatus: 'active' | 'inactive';
    totalStocks: string;
    deliveryMode: 'standard' | 'express';
    tags: string | null;
    averageRating: string;
    ratingCount: string;
    createdAt: Date;
    updatedAt: Date;
  };
  variant: {
    id: string;
    productId: string;
    name: string;
    sku: string;
    slug: string;
    color: string;
    material: string | null;
    dimensions: string | null;
    weight: string | null;
    storage: string | null;
    stock: string;
    mrp: string;
    ourPrice: string;
    productImages: string[];
    createdAt: Date;
    updatedAt: Date;
  };
}

const TAX_RATE = 0.1; // 10% tax, configurable

const CartPage: React.FC = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    getCartSubtotal,
    getItemCount,
  } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    router.push('/checkout');
  };

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Cart', path: '/cart' },
  ];

  return (
    <UserLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs breadcrumbs={breadcrumbItems} />
        <h1 className="text-2xl font-bold text-gray-800 my-6">
          Your Cart ({getItemCount()} {getItemCount() === 1 ? 'item' : 'items'})
        </h1>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="text-4xl mb-4">🛒</div>
            <h2 className="text-xl font-medium text-gray-800 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-4">
              Looks like you haven’t added any items yet.
            </p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm">
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                          Product
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                          Price
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                          Quantity
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                          Subtotal
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(cartItems as unknown as CartItem[]).map((item) => (
                        <tr key={item.id} className="border-b border-gray-200">
                          <td className="py-4 px-4 flex items-center">
                            <Image
                              src={item.variant.productImages?.[0] ?? '/placeholder.svg'}
                              alt={item.product.shortName}
                              width={80}
                              height={80}
                              className="rounded-md mr-4"
                            />
                            <div>
                              <Link
                                href={`/products/${item.variant.slug}`}
                                className="text-sm font-medium text-gray-800 hover:text-blue-600"
                              >
                                {item.product.shortName} - {item.variant.name}
                              </Link>
                              <p className="text-xs text-gray-500">
                                Color: {item.variant.color}
                                {item.variant.storage && `, Storage: ${item.variant.storage}`}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-800">
                            ${parseFloat(item.variant.ourPrice).toFixed(2)}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                disabled={item.quantity <= 1}
                                aria-label={`Decrease quantity of ${item.product.shortName}`}
                              >
                                <Minus size={16} />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateQuantity(item.id, parseInt(e.target.value) || 1)
                                }
                                className="w-12 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                                min="1"
                                max={parseInt(item.variant.stock)}
                                aria-label={`Quantity of ${item.product.shortName}`}
                              />
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                                disabled={item.quantity >= parseInt(item.variant.stock)}
                                aria-label={`Increase quantity of ${item.product.shortName}`}
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-800">
                            ${(parseFloat(item.variant.ourPrice) * item.quantity).toFixed(2)}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 hover:text-red-800"
                              aria-label={`Remove ${item.product.shortName} from cart`}
                            >
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4 p-4">
                  {(cartItems as unknown as CartItem[]).map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <Image
                          src={item.variant.productImages?.[0] ?? '/placeholder.svg'}
                          alt={item.product.shortName}
                          width={80}
                          height={80}
                          className="rounded-md"
                        />
                        <div className="flex-1">
                          <Link
                            href={`/products/${item.variant.slug}`}
                            className="text-sm font-medium text-gray-800 hover:text-blue-600"
                          >
                            {item.product.shortName} - {item.variant.name}
                          </Link>
                          <p className="text-xs text-gray-500">
                            Color: {item.variant.color}
                            {item.variant.storage && `, Storage: ${item.variant.storage}`}
                          </p>
                          <p className="text-sm text-gray-800 mt-1">
                            ${parseFloat(item.variant.ourPrice).toFixed(2)} x {item.quantity} = $
                            {(parseFloat(item.variant.ourPrice) * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                            disabled={item.quantity <= 1}
                            aria-label={`Decrease quantity of ${item.product.shortName}`}
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(item.id, parseInt(e.target.value) || 1)
                            }
                            className="w-12 text-center border border-gray-300 rounded px-2 py-1 text-sm"
                            min="1"
                            max={parseInt(item.variant.stock)}
                            aria-label={`Quantity of ${item.product.shortName}`}
                          />
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                            disabled={item.quantity >= parseInt(item.variant.stock)}
                            aria-label={`Increase quantity of ${item.product.shortName}`}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-800"
                          aria-label={`Remove ${item.product.shortName} from cart`}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Order Summary</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal ({getItemCount()} items)
                    </span>
                    <span className="text-gray-800">${getCartSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({TAX_RATE * 100}%)</span>
                    <span className="text-gray-800">
                      ${(getCartSubtotal() * TAX_RATE).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-medium">
                    <span className="text-gray-800">Total</span>
                    <span className="text-gray-800">
                      ${(getCartSubtotal() * (1 + TAX_RATE)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={cartItems.length === 0}
                  aria-label="Proceed to checkout"
                >
                  Proceed to Checkout
                </button>
                <Link
                  href="/"
                  className="block text-center text-sm text-blue-600 hover:text-blue-800 mt-4"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default CartPage;