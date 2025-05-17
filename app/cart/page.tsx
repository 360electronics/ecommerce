'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UserLayout from '@/components/Layouts/UserLayout';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';
import toast from 'react-hot-toast';
import { CartItemComponent } from '@/components/Cart/CartItem';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useCheckoutStore } from '@/store/checkout-store';
import { useCartStore } from '@/store/cart-store';

type CartOfferProduct = {
  id: string;
  productName: string;
  productImage: string;
  range: string;
  ourPrice: string;
  quantity: number;
};

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
    addToCart,
    getCartSubtotal,
    getCartTotal,
    getItemCount,
    getSavings,
  } = useCartStore();
  const { isLoggedIn, isLoading, user } = useAuthStore();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const { addToCheckout } = useCheckoutStore();
  const [offerProducts, setOfferProducts] = useState<CartOfferProduct[]>([]);
  const [selectedOfferProduct, setSelectedOfferProduct] = useState<string | null>(null);
  const [isFetchingOffers, setIsFetchingOffers] = useState(false);

  // Calculate totals
  const subtotal = getCartSubtotal();
  const grandTotal = getCartTotal();
  const savings = getSavings();
  const shippingAmount = subtotal > 500 ? 0 : cartItems.reduce((sum, item) => sum + 50 * item.quantity, 0);
  const discountAmount =
    coupon && couponStatus === 'applied'
      ? coupon.type === 'amount'
        ? coupon.value
        : (subtotal * coupon.value) / 100
      : 0;

  // Determine eligible offer range based on cart subtotal
  const getEligibleRange = (subtotal: number): string | null => {
    if (subtotal >= 25000) return '25000';
    if (subtotal >= 10000) return '10000';
    if (subtotal >= 5000) return '5000';
    if (subtotal >= 1000) return '1000';
    return null;
  };

  const eligibleRange = getEligibleRange(subtotal);

  // Fetch offer products based on eligible range
  useEffect(() => {
    const fetchOfferProducts = async () => {
      if (!eligibleRange) {
        setOfferProducts([]);
        return;
      }

      setIsFetchingOffers(true);
      try {
        const response = await fetch(`/api/cart/offer-products?range=${eligibleRange}`);
        if (!response.ok) throw new Error('Failed to fetch offer products');
        const products: CartOfferProduct[] = await response.json();
        setOfferProducts(products);
      } catch (error) {
        console.error('Error fetching offer products:', error);
        toast.error('Failed to load offer products');
        setOfferProducts([]);
      } finally {
        setIsFetchingOffers(false);
      }
    };

    fetchOfferProducts();
  }, [eligibleRange]);

  // Check if an offer product is already in the cart
  const hasOfferProductInCart = cartItems.some((item) => item.productId.startsWith('offer_'));

  // Handle selecting an offer product
  const handleSelectOfferProduct = (productId: string) => {
    setSelectedOfferProduct(productId);
  };

  // Handle adding the selected offer product to the cart
  const handleAddOfferProduct = async () => {
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to add offer products');
      return;
    }

    if (!selectedOfferProduct) {
      toast.error('Please select an offer product');
      return;
    }

    if (hasOfferProductInCart) {
      toast.error('You have already added an offer product');
      return;
    }

    try {
      // Map offer product to CartItem structure
      const offerProduct = offerProducts.find((p) => p.id === selectedOfferProduct);
      if (!offerProduct) {
        toast.error('Selected offer product not found');
        return;
      }

      // Use a unique productId for offer products (e.g., prefix with 'offer_')
      const pseudoProductId = `offer_${offerProduct.id}`;
      const pseudoVariantId = `offer_variant_${offerProduct.id}`;

      await addToCart(pseudoProductId, pseudoVariantId, 1);

      // Update cart items locally to reflect the offer product
      // const pseudoCartItem: any = {
      //   id: `temp_${pseudoProductId}`, // Temporary ID, will be updated by fetchCart
      //   userId: user.id,
      //   productId: pseudoProductId,
      //   variantId: pseudoVariantId,
      //   quantity: offerProduct.quantity,
      //   createdAt: new Date().toISOString(),
      //   updatedAt: new Date().toISOString(),
      //   product: {
      //     id: pseudoProductId,
      //     shortName: offerProduct.productName,
      //     description: null,
      //     category: 'offer',
      //     brand: 'Offer',
      //     status: 'active',
      //     subProductStatus: 'active',
      //     totalStocks: offerProduct.quantity.toString(),
      //     averageRating: '0',
      //     ratingCount: '0',
      //     createdAt: new Date().toISOString(),
      //     updatedAt: new Date().toISOString(),
      //   },
      //   variant: {
      //     id: pseudoVariantId,
      //     productId: pseudoProductId,
      //     name: offerProduct.productName,
      //     sku: `OFFER-${offerProduct.id}`,
      //     slug: `offer-${offerProduct.id}`,
      //     color: '',
      //     material: null,
      //     dimensions: null,
      //     weight: null,
      //     storage: null,
      //     stock: offerProduct.quantity.toString(),
      //     mrp: offerProduct.ourPrice,
      //     ourPrice: offerProduct.ourPrice,
      //     productImages: [offerProduct.productImage],
      //     createdAt: new Date().toISOString(),
      //     updatedAt: new Date().toISOString(),
      //   },
      // };

      toast.success(`${offerProduct.productName} added to cart!`);
      setSelectedOfferProduct(null);
    } catch (error) {
      console.error('Error adding offer product:', error);
      toast.error('Failed to add offer product');
    }
  };

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
      <div className="mx-auto max-w-7xl">
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
            {/* Cart Items and Offer Products */}
            <div className="flex-1">
              {/* Cart Items */}
              <div className="space-y-4 mb-8">
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

              {/* Offer Products Section */}
              {eligibleRange && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 nohemi-bold">
                    Eligible Offer Products (Cart Value: ₹{subtotal.toLocaleString('en-IN')})
                  </h2>
                  {isFetchingOffers ? (
                    <p className="text-gray-600">Loading offer products...</p>
                  ) : offerProducts.length > 0 ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-4">
                        Select one offer product to add to your cart:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {offerProducts.map((product) => (
                          <div
                            key={product.id}
                            className={`relative bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedOfferProduct === product.id
                                ? 'border-blue-500 shadow-md'
                                : 'border-gray-200 hover:border-gray-300'
                            } ${hasOfferProductInCart ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() =>
                              !hasOfferProductInCart && handleSelectOfferProduct(product.id)
                            }
                          >
                            <div className="relative w-full aspect-square mb-2">
                              <Image
                                src={product.productImage || '/placeholder.png'}
                                alt={product.productName}
                                fill
                                className="object-cover rounded-md"
                              />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                              {product.productName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              ₹{Number(product.ourPrice).toLocaleString('en-IN')}
                            </p>
                            <p className="text-sm text-gray-600">Quantity: {product.quantity}</p>
                            {selectedOfferProduct === product.id && !hasOfferProductInCart && (
                              <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {!hasOfferProductInCart && (
                        <Button
                          onClick={handleAddOfferProduct}
                          className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
                          disabled={!selectedOfferProduct}
                        >
                          Add Selected Offer Product
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">No offer products available for this cart value.</p>
                  )}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 nohemi-bold">
                  Order Summary
                </h2>
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
                        <span className="text-green-600">
                          -₹{discountAmount.toLocaleString('en-IN')}
                        </span>
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