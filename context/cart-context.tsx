'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './auth-context';

interface CartItem {
  id: string;
  userId: string;
  productId: string;
  variantId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    shortName: string;
    description: string | null;
    category: string;
    brand: string;
    status: 'active' | 'inactive';
    subProductStatus: 'active' | 'inactive';
    totalStocks: string;
    averageRating: string;
    ratingCount: string;
    createdAt: string;
    updatedAt: string;
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
    createdAt: string;
    updatedAt: string;
  };
}

interface Coupon {
  code: string;
  type: 'amount' | 'percentage';
  value: number;
  couponId: string;
  couponType: 'individual' | 'special';
}

interface CartContextType {
  cartItems: CartItem[];
  coupon: Coupon | null;
  couponStatus: 'none' | 'applied' | 'invalid' | 'used' | 'expired';
  addToCart: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string, variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  markCouponUsed: (code: string, userId: string) => Promise<void>;
  clearCoupon: () => void;
  refreshCart: () => Promise<void>;
  getCartSubtotal: () => number;
  getCartTotal: () => number;
  getItemCount: () => number;
  getSavings: () => number;
  error?: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponStatus, setCouponStatus] = useState<'none' | 'applied' | 'invalid' | 'used' | 'expired'>('none');
  const { user, isLoggedIn, isLoading } = useAuth();

  const fetchCart = async () => {
    if (!isLoggedIn || !user?.id || isLoading) return;

    try {
      const response = await fetch(`/api/cart?userId=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const sanitizedItems = (data || []).map((item: CartItem) => ({
          ...item,
          quantity: Number.isNaN(Number(item.quantity)) || item.quantity <= 0 ? 1 : Math.floor(Number(item.quantity)),
        })).filter((item: CartItem) => item.variant && item.variant.ourPrice);
        setCartItems(sanitizedItems);
      } else {
        toast.error('Failed to load cart.');
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart.');
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isLoggedIn, user?.id, isLoading]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    if (coupon) {
      localStorage.setItem('coupon', JSON.stringify(coupon));
      localStorage.setItem('couponStatus', couponStatus);
    } else {
      localStorage.removeItem('coupon');
      localStorage.removeItem('couponStatus');
    }
  }, [cartItems, coupon, couponStatus]);

  const addToCart = async (productId: string, variantId: string, quantity: number = 1) => {
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to add items to cart');
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          productId,
          variantId,
          quantity: quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add item to cart.');
        return;
      }

      await fetchCart();
      toast.success('Item added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart.');
    }
  };

  const refreshCart = async () => {
    await fetchCart();
    toast.success('Cart refreshed');
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    const sanitizedQuantity = Math.max(1, Math.floor(Number(quantity)));
    const item = cartItems.find((item) => item.id === cartItemId);
    if (!item) {
      toast.error('Cart item not found.');
      return;
    }

    if (sanitizedQuantity < 1) {
      await removeFromCart(item.productId, item.variantId);
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          cartItemId,
          quantity: sanitizedQuantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update quantity.');
        return;
      }

      const updatedItem = await response.json();
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === cartItemId ? { ...item, quantity: updatedItem.quantity } : item
        )
      );
      toast.success('Quantity updated.');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity.');
    }
  };

  const removeFromCart = async (productId: string, variantId: string) => {
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to remove items from cart');
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          productId,
          variantId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to remove item from cart.');
        return;
      }

      setCartItems((prevItems) => {
        const updatedItems = prevItems.filter(
          (item) => !(item.productId === productId && item.variantId === variantId)
        );
        toast.success('Item removed from cart.');
        return updatedItems;
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart.');
    }
  };

  const clearCart = async () => {
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to clear cart');
      return;
    }

    try {
      const response = await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to clear cart.');
        return;
      }

      setCartItems([]);
      toast.success('Cart cleared.');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart.');
    }
  };

  const applyCoupon = async (code: string) => {
    if (!code) {
      toast.error('Please enter a coupon code');
      setCouponStatus('none');
      return;
    }

    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to apply a coupon');
      setCouponStatus('none');
      return;
    }

    const upperCode = code.toUpperCase();
    try {
      let response = await fetch(`/api/discount/coupons?code=${upperCode}&userId=${user.id}`);
      if (response.ok) {
        const { amount, id } = await response.json();
        setCoupon({
          code: upperCode,
          type: 'amount',
          value: amount,
          couponId: id,
          couponType: 'individual',
        });
        setCouponStatus('applied');
        toast.success(`Coupon ${upperCode} applied! ₹${amount} off`);
        return;
      } else {
        const errorData = await response.json();
        if (errorData.error.includes('expired')) {
          setCouponStatus('expired');
          toast.error('Coupon has expired');
        } else if (errorData.error.includes('used')) {
          setCouponStatus('used');
          toast.error('Coupon has already been used');
        } else {
          setCouponStatus('invalid');
          toast.error('Invalid coupon code');
        }
      }

      response = await fetch(`/api/discount/special-coupons?code=${upperCode}&userId=${user.id}`);
      if (response.ok) {
        const { amount, percentage, id } = await response.json();
        if (amount) {
          setCoupon({
            code: upperCode,
            type: 'amount',
            value: amount,
            couponId: id,
            couponType: 'special',
          });
          setCouponStatus('applied');
          toast.success(`Coupon ${upperCode} applied! ₹${amount} off`);
        } else if (percentage) {
          setCoupon({
            code: upperCode,
            type: 'percentage',
            value: percentage,
            couponId: id,
            couponType: 'special',
          });
          setCouponStatus('applied');
          toast.success(`Coupon ${upperCode} applied! ${percentage}% off`);
        }
        return;
      } else {
        const errorData = await response.json();
        if (errorData.error.includes('expired')) {
          setCouponStatus('expired');
          toast.error('Coupon has expired');
        } else if (errorData.error.includes('used')) {
          setCouponStatus('used');
          toast.error('Coupon has already been used');
        } else {
          setCouponStatus('invalid');
          toast.error('Invalid coupon code');
        }
        return;
      }
  

    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponStatus('invalid');
      toast.error('Failed to apply coupon');
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponStatus('none');
    toast.success('Coupon removed');
  };

  const clearCoupon = () => {
    setCoupon(null);
    setCouponStatus('none');
  };

  const markCouponUsed = async (code: string, userId: string) => {
    if (!code || !userId) {
      return;
    }

    try {
      const endpoint = coupon?.couponType === 'individual' ? '/api/discount/coupons/use' : '/api/discount/special-coupons/use';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark coupon as used');
      }
      setCouponStatus('used');
    } catch (error) {
      console.error('Error marking coupon as used:', error);
      throw error;
    }
  };

  const getCartSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + parseFloat(item.variant.ourPrice) * item.quantity,
      0
    );
  };

  const getCartTotal = () => {
    const subtotal = getCartSubtotal();
    if (!coupon || couponStatus !== 'applied') return subtotal;
    const discount = coupon.type === 'amount' ? coupon.value : (subtotal * coupon.value) / 100;
    return Math.max(0, subtotal - discount);
  };

  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const getSavings = () => {
    return cartItems.reduce(
      (total, item) =>
        total + (parseFloat(item.variant.mrp) - parseFloat(item.variant.ourPrice)) * item.quantity,
      0
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        coupon,
        couponStatus,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        clearCoupon,
        markCouponUsed,
        refreshCart,
        getCartSubtotal,
        getCartTotal,
        getItemCount,
        getSavings,
        error: undefined,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};