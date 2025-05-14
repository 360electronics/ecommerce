'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import UserLayout from '@/components/Layouts/UserLayout';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';
import toast from 'react-hot-toast';
import { useCart } from '@/context/cart-context';
import { CartItemComponent } from '@/components/Cart/CartItem';
import { useCheckout } from '@/context/checkout-context';

const CartPage: React.FC = () => {
  const {
    cartItems,
    coupon,
    couponStatus,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    getCartSubtotal,
    getCartTotal,
    getItemCount,
    getSavings,
  } = useCart();
  const { isLoggedIn, isLoading, user } = useAuth();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const { addToCheckout } = useCheckout();

  // Calculate totals
  const subtotal = getCartSubtotal();
  const grandTotal = getCartTotal();
  const savings = getSavings();
  const shippingAmount = subtotal > 500 ? 0 : cartItems.reduce((sum, item) => sum + 50 * item.quantity, 0);
  const discountAmount = coupon && couponStatus === 'applied'
    ? coupon.type === 'amount'
      ? coupon.value
      : (subtotal * coupon.value) / 100
    : 0;

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      toast.error('Please log in to view your cart');
      router.push('/login');
    }
  }, [isLoading, isLoggedIn, router]);

  const handleApplyCoupon = async () => {
    if (!couponCode) {
      toast.error('Please enter a coupon code');
      return;
    }
    await applyCoupon(couponCode);
    setCouponCode('');
  };

  const handleCheckout = async () => {
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to proceed to checkout');
      router.push('/signin');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      // Add each cart item to the checkout
      for (const item of cartItems) {
        await addToCheckout({
          userId: user.id,
          productId: item.productId,
          variantId: item.variantId,
          totalPrice: Number(item.variant.ourPrice) * item.quantity,
          quantity: item.quantity,
        });
      }

      toast.success('Items added to checkout');
      router.push(
        coupon && couponStatus === 'applied'
          ? `/checkout?coupon=${coupon.code}&discountType=${coupon.type}&discountValue=${coupon.value}`
          : '/checkout'
      );
      await clearCart();
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Failed to proceed to checkout. Please try again.');
    }
  };

  const handleRemoveFromCart = async (productId: string, variantId: string) => {
    setIsUpdating(variantId);
    try {
      await removeFromCart(productId, variantId);
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    setIsUpdating(cartItemId);
    try {
      await updateQuantity(cartItemId, quantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    } finally {
      setIsUpdating(null);
    }
  };

  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Cart', path: '/cart' },
  ];

  if (isLoading) {
    return (
      <UserLayout>
        <div className="mx-auto">
          <p className="text-center text-gray-600 text-lg">Loading cart...</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="mx-auto">
        <Breadcrumbs breadcrumbs={breadcrumbItems} />
        <h1 className="text-2xl font-bold text-gray-900 my-6 nohemi-bold">
          Shopping Cart ({getItemCount()} {getItemCount() === 1 ? 'item' : 'items'})
        </h1>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="text-5xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven’t added any items yet.</p>
            <Link
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors text-base font-medium"
              aria-label="Continue shopping"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <CartItemComponent
                    key={item.id}
                    item={item}
                    isUpdating={isUpdating}
                    handleUpdateQuantity={handleUpdateQuantity}
                    handleRemoveFromCart={handleRemoveFromCart}
                  />
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 nohemi-bold">Order Summary</h2>
                <div className="space-y-4">
                  {/* Coupon Section */}
                  <div>
                    <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-1">
                      Coupon Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="coupon"
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={couponStatus === 'applied'}
                      />
                      {coupon && couponStatus === 'applied' ? (
                        <button
                          onClick={removeCoupon}
                          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={handleApplyCoupon}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    {couponStatus === 'applied' && coupon && (
                      <p className="text-sm text-green-600 mt-2">
                        Coupon {coupon.code} applied (
                        {coupon.type === 'amount'
                          ? `₹${coupon.value.toLocaleString('en-IN')}`
                          : `${coupon.value}%`}
                        )
                      </p>
                    )}
                    {couponStatus === 'invalid' && (
                      <p className="text-sm text-red-600 mt-2">Invalid coupon code</p>
                    )}
                    {couponStatus === 'used' && (
                      <p className="text-sm text-red-600 mt-2">Coupon has already been used</p>
                    )}
                    {couponStatus === 'expired' && (
                      <p className="text-sm text-red-600 mt-2">Coupon has expired</p>
                    )}
                  </div>

                  {/* Order Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Price ({getItemCount()} items)</span>
                      <span className="text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Charges</span>
                      <span className="text-gray-900">₹{shippingAmount.toLocaleString('en-IN')}</span>
                    </div>
                    {savings > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">You Save</span>
                        <span className="text-green-600">₹{savings.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Coupon Discount ({coupon?.code})</span>
                        <span className="text-green-600">-₹{discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span>₹{(grandTotal + shippingAmount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 text-base font-medium"
                  disabled={cartItems.length === 0 || isUpdating !== null}
                  aria-label="Proceed to checkout"
                >
                  Proceed to Checkout
                </button>
                <Link
                  href="/"
                  className="block text-center text-sm text-blue-600 hover:text-blue-800 mt-4"
                  aria-label="Continue shopping"
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