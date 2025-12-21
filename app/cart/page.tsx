"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumbs from "@/components/Reusable/BreadScrumb";
import toast from "react-hot-toast";
import { CartItemComponent } from "@/components/Cart/CartItem";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { useCartStore } from "@/store/cart-store";
import { CartItem } from "@/store/cart-store";

const CartPage: React.FC = ({ initialCartItems }: any) => {
  const {
    cartItems,
    coupon,
    couponStatus,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    addOfferProductToCart,
    getCartSubtotal,
    getCartTotal,
    getItemCount,
    getSavings,
    initializeCart, // New action to initialize cart
  } = useCartStore();
  const { isLoggedIn, user } = useAuthStore();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const { addToCheckout } = useCheckoutStore();
  const [offerProducts, setOfferProducts] = useState<any[]>([]);
  const [isFetchingOffers, setIsFetchingOffers] = useState(false);
  const [effectiveRange, setEffectiveRange] = useState<string | null>(null);

  // Initialize cart with server-fetched data
  useEffect(() => {
    if (initialCartItems) {
      initializeCart(initialCartItems);
    }
  }, [initialCartItems, initializeCart]);

  // Calculate totals including offer products
  const calculateTotals = () => {
    const regularProductsSubtotal = cartItems.reduce((sum, item) => {
      if (item.id.startsWith("temp-")) return sum;
      const itemPrice = Number(item.variant.ourPrice) || 0;
      return sum + itemPrice * item.quantity;
    }, 0);

    const offerProductsTotal = cartItems.reduce((sum, item) => {
      if (item.id.startsWith("temp-") || !item.cartOfferProductId) return sum;
      const offerPrice = Number(item.offerProductPrice) || 0;
      return sum + offerPrice;
    }, 0);

    const subtotal = regularProductsSubtotal + offerProductsTotal;

    const savings = cartItems.reduce((sum, item) => {
      if (item.id.startsWith("temp-")) return sum;
      const originalPrice =
        Number(item.variant.mrp) || Number(item.variant.ourPrice) || 0;
      const ourPrice = Number(item.variant.ourPrice) || 0;
      return sum + (originalPrice - ourPrice) * item.quantity;
    }, 0);

    const discountAmount =
      coupon && couponStatus === "applied"
        ? coupon.type === "amount"
          ? coupon.value || 0
          : (subtotal * (coupon.value || 0)) / 100
        : 0;

    const shippingAmount =
      subtotal > 500
        ? 0
        : cartItems.reduce(
            (sum, item) =>
              sum + 50 * (item.cartOfferProductId ? 1 : item.quantity),
            0
          );
    const grandTotal = subtotal - discountAmount;

    return {
      subtotal,
      regularProductsSubtotal,
      offerProductsTotal,
      savings,
      discountAmount,
      shippingAmount,
      grandTotal,
    };
  };

  const {
    subtotal,
    regularProductsSubtotal,
    offerProductsTotal,
    savings,
    discountAmount,
    shippingAmount,
    grandTotal,
  } = calculateTotals();

  const formatCurrency = (value: number | null | undefined): string => {
    return (value ?? 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    });
  };

  const getCartValueForOffers = () => {
    return cartItems.reduce((sum, item) => {
      if (item.id.startsWith("temp-")) return sum;
      const itemPrice = Number(item.variant.ourPrice) || 0;
      const offerPrice = item.cartOfferProductId
        ? Number(item.offerProductPrice) || 0
        : 0;
      return sum + itemPrice * item.quantity + offerPrice;
    }, 0);
  };

  const getEligibleRange = (cartValue: number): string | null => {
    if (cartValue >= 25000) return "25000";
    if (cartValue >= 10000) return "10000";
    if (cartValue >= 5000) return "5000";
    if (cartValue >= 1000) return "1000";
    return null;
  };

  const cartValueForOffers = getCartValueForOffers();
  const eligibleRange = getEligibleRange(cartValueForOffers);

  const hasRegularProduct = cartItems.some((item) => !item.cartOfferProductId);
  const hasOfferProductInCart = cartItems.some(
    (item) => item.cartOfferProductId
  );

  useEffect(() => {
    const fetchOfferProducts = async () => {
      if (!eligibleRange || !hasRegularProduct || hasOfferProductInCart) {
        setOfferProducts([]);
        setEffectiveRange(null);
        return;
      }

      setIsFetchingOffers(true);
      try {
        const ranges = ["25000", "10000", "5000", "1000"];
        let products: any[] = [];
        let selectedRange: string | null = null;

        for (const range of ranges) {
          if (ranges.indexOf(range) >= ranges.indexOf(eligibleRange)) {
            const response = await fetch(
              `/api/cart/range-offers?range=${range}`
            );
            if (!response.ok) {
              console.error(
                `Failed to fetch offer products for range ${range}`
              );
              continue;
            }
            const fetchedProducts: any[] = await response.json();
            if (fetchedProducts.length > 0) {
              products = fetchedProducts;
              selectedRange = range;
              break;
            }
          }
        }

        setOfferProducts(products);
        setEffectiveRange(selectedRange);
      } catch (error) {
        console.error("Error fetching offer products:", error);
        toast.error("Failed to load offer products");
        setOfferProducts([]);
        setEffectiveRange(null);
      } finally {
        setIsFetchingOffers(false);
      }
    };

    fetchOfferProducts();
  }, [eligibleRange, hasRegularProduct, hasOfferProductInCart]);

  const handleAddOfferProduct = async (offerProduct: any) => {
    if (!isLoggedIn || !user?.id) {
      toast.error("Please log in to add offer products");
      return;
    }

    if (!hasRegularProduct) {
      toast.error("Add a regular product to your cart first");
      return;
    }

    if (hasOfferProductInCart) {
      toast.error("Only one offer product can be added to the cart");
      return;
    }

    const regularItem = cartItems.find((item) => !item.cartOfferProductId);
    if (!regularItem) {
      toast.error("No regular product found in cart");
      return;
    }

    try {
      await addOfferProductToCart(
        regularItem.id,
        offerProduct.id,
        offerProduct.ourPrice
      );
      toast.success(`${offerProduct.productName} added to cart!`);
    } catch (error) {
      console.error("Error adding offer product:", error);
      toast.error("Failed to add offer product");
    }
  };

  const handleRemoveOfferProduct = async (cartItemId: string) => {
    if (!isLoggedIn || !user?.id) {
      toast.error("Please log in to remove offer products");
      return;
    }

    setIsUpdating(cartItemId);
    try {
      const response = await fetch("/api/cart/offer", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          cartItemId: cartItemId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to remove offer product");
      }

      await useCartStore.getState().fetchCart();
      toast.success("Offer product removed from cart");
    } catch (error) {
      console.error("Error removing offer product:", error);
      toast.error("Failed to remove offer product");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) {
      toast.error("Please enter a coupon code");
      return;
    }
    await applyCoupon(couponCode);
    const { couponStatus: status, coupon } = useCartStore.getState();
    if (status === "applied" && coupon) {
      toast.success(
        `Coupon ${coupon.code} applied (${
          coupon.type === "amount"
            ? formatCurrency(coupon.value)
            : `${coupon.value}%`
        })`
      );
    } else if (status === "invalid") {
      toast.error("Invalid coupon code");
    } else if (status === "invalid_amount") {
      toast.error("Coupon has an invalid discount value");
    } else if (status === "expired") {
      toast.error("Coupon has expired");
    } else if (status === "used") {
      toast.error("Coupon has already been used");
    }
    setCouponCode("");
  };

  const handleCheckout = async () => {
    if (!isLoggedIn || !user?.id) {
      toast.error("Please log in to proceed to checkout");
      router.push("/signin");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    try {
      for (const item of cartItems) {
        const itemPrice = Number(item.variant.ourPrice) || 0;
        const offerPrice = item.cartOfferProductId
          ? Number(item.offerProductPrice) || 0
          : 0;
        const totalPrice = item.cartOfferProductId
          ? itemPrice * item.quantity + offerPrice
          : itemPrice * item.quantity;
        if (isNaN(totalPrice)) {
          throw new Error(`Invalid price for item ${item.productId}`);
        }
        await addToCheckout({
          userId: user.id,
          productId: item.productId,
          variantId: item.variantId,
          totalPrice,
          quantity: item.quantity,
          cartOfferProductId: item.cartOfferProductId,
        });
      }

      toast.success("Items added to checkout");
      router.push(
        coupon && couponStatus === "applied" && coupon.value != null
          ? `/checkout?coupon=${coupon.code}&discountType=${coupon.type}&discountValue=${coupon.value}`
          : "/checkout"
      );
      await clearCart();
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error("Failed to proceed to checkout. Please try again.");
    }
  };

  const handleRemoveFromCart = async (productId: string, variantId: string) => {
    setIsUpdating(variantId);
    try {
      await removeFromCart(productId, variantId);
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Failed to remove item from cart");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleUpdateQuantity = async (cartItemId: string, quantity: number) => {
    setIsUpdating(cartItemId);
    try {
      await updateQuantity(cartItemId, quantity);
      toast.success("Quantity updated");
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    } finally {
      setIsUpdating(null);
    }
  };

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Cart", path: "/cart" },
  ];

  const rangeDisplayNames: Record<string, string> = {
    "1000": "Above ₹1,000",
    "5000": "Above ₹5,000",
    "10000": "Above ₹10,000",
    "25000": "Above ₹25,000",
  };

  return (
    <div className="mx-auto">
      <Breadcrumbs breadcrumbs={breadcrumbItems} />
      <h1 className="text-2xl font-bold text-gray-900 my-6 nohemi-bold">
        Shopping Cart
      </h1>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-6">
            Looks like you haven&apos;t added any items yet.
          </p>
          <Link
            href="/"
            className="bg-primary text-white px-6 py-3 rounded-full hover:bg-primary-HOVER transition-colors text-base font-medium"
            aria-label="Continue shopping"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="space-y-4 mb-8">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <CartItemComponent
                    item={item}
                    isUpdating={isUpdating}
                    handleUpdateQuantity={handleUpdateQuantity}
                    handleRemoveFromCart={handleRemoveFromCart}
                  />
                  {item.cartOfferProductId && item.offerProduct && (
                    <div className="mt-4 border-t pt-4 bg-green-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold bg-green-600 text-white px-2 py-0.5 rounded-full">
                            OFFER
                          </span>
                          <h4 className="text-sm font-semibold text-green-700">
                            Offer Product Added
                          </h4>
                        </div>

                        <button
                          onClick={() => handleRemoveOfferProduct(item.id)}
                          disabled={isUpdating === item.id}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          title="Remove offer product"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16">
                          <img
                            src={
                              item.offerProduct.productImage ||
                              "/placeholder.png"
                            }
                            alt={item.offerProduct.productName}
                            className="object-cover rounded-md w-full h-full"
                          />
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {item.offerProduct.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Offer product • 1 unit
                          </p>
                          <p className="text-sm font-semibold text-green-600">
                            +{formatCurrency(Number(item.offerProductPrice))}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {effectiveRange && hasRegularProduct && !hasOfferProductInCart && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 nohemi-bold">
                  Eligible Offer Products
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  • Cart Value:{" "}
                  <span className="font-medium text-green-700">
                    {formatCurrency(cartValueForOffers)}
                  </span>
                </p>

                {isFetchingOffers ? (
                  <p className="text-gray-600">Loading offer products...</p>
                ) : offerProducts.length > 0 ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Add one offer product to your cart:
                    </p>
                    <div className="space-y-3">
                      {offerProducts.map((product) => (
                        <div
                          key={product.id}
                          className="group flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3
                 hover:border-green-300 hover:bg-green-50/40 transition-all"
                        >
                          {/* IMAGE */}
                          <div className="relative shrink-0">
                            <img
                              src={product.productImage || "/placeholder.png"}
                              alt={product.productName}
                              className="h-14 w-14 rounded-md object-cover border"
                            />
                            <span className="absolute -top-1 -left-1 text-[9px] font-semibold bg-green-600 text-white px-1.5 py-0.5 rounded">
                              OFFER
                            </span>
                          </div>

                          {/* INFO */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate leading-snug">
                              {product.productName}
                            </p>

                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-sm font-semibold text-green-700">
                                {formatCurrency(Number(product.ourPrice))}
                              </span>
                              <span className="text-xs text-gray-500">
                                • 1 unit only
                              </span>
                            </div>
                          </div>

                          {/* CTA */}
                          <Button
                            onClick={() => handleAddOfferProduct(product)}
                            disabled={
                              hasOfferProductInCart || !hasRegularProduct
                            }
                            className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-white
                   hover:bg-primary-HOVER disabled:opacity-50"
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-600">
                    No offer products available for this cart value.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="lg:w-1/3 pb-10">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-32">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 nohemi-bold">
                Order Summary
              </h2>
              <div className="space-y-4">
                {/* <div>
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
                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-HOVER transition-colors text-sm font-medium"
                        >
                          Apply
                        </button>
                      )}
                    </div>
                    {couponStatus === 'applied' && coupon && (
                      <p className="text-sm text-green-600 mt-2">
                        Coupon {coupon.code} applied (
                        {coupon.type === 'amount'
                          ? formatCurrency(coupon.value)
                          : coupon.value != null
                          ? `${coupon.value}%`
                          : 'Invalid discount'}
                        )
                      </p>
                    )}
                    {couponStatus === 'invalid' && (
                      <p className="text-sm text-red-600 mt-2">Invalid coupon code</p>
                    )}
                    {couponStatus === 'invalid_amount' && (
                      <p className="text-sm text-red-600 mt-2">Coupon has an invalid discount value</p>
                    )}
                    {couponStatus === 'used' && (
                      <p className="text-sm text-red-600 mt-2">Coupon has already been used</p>
                    )}
                    {couponStatus === 'expired' && (
                      <p className="text-sm text-red-600 mt-2">Coupon has expired</p>
                    )}
                  </div> */}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Regular Products (
                      {cartItems
                        .filter((item) => !item.isOfferProduct)
                        .reduce((sum, item) => sum + item.quantity, 0)}{" "}
                      items)
                    </span>
                    <span className="text-gray-900">
                      {formatCurrency(regularProductsSubtotal)}
                    </span>
                  </div>
                  {offerProductsTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Offer Product (1 item)
                      </span>
                      <span className="text-green-600">
                        +{formatCurrency(offerProductsTotal)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium border-t pt-2">
                    <span className="text-gray-700">Subtotal</span>
                    <span className="text-gray-900">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Charges</span>
                    <span className="text-gray-900">
                      {formatCurrency(shippingAmount)}
                    </span>
                  </div>
                  {savings > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">You Save</span>
                      <span className="text-green-600">
                        -{formatCurrency(savings)}
                      </span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Coupon Discount ({coupon?.code})
                      </span>
                      <span className="text-green-600">
                        -{formatCurrency(discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total Amount</span>
                    <span>{formatCurrency(grandTotal + shippingAmount)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full mt-6 bg-primary text-white py-3 rounded-full hover:bg-primary-HOVER transition-colors disabled:opacity-50 text-base font-medium cursor-pointer"
                disabled={cartItems.length === 0 || isUpdating !== null}
                aria-label="Proceed to checkout"
              >
                Proceed to Checkout
              </button>
              <Link
                href="/"
                className="block text-center text-sm text-primary hover:text-primary-HOVER mt-4"
                aria-label="Continue shopping"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
