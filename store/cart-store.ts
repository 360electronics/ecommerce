// app/store/cart-store.ts
'use client';

import { create } from 'zustand';
import toast from 'react-hot-toast';
import { useAuthStore } from './auth-store';
import { ProductVariant } from '@/types/product';

// Utility function for quantity sanitization
const sanitizeQuantity = (quantity: number | string): number => Math.max(1, Math.floor(Number(quantity)));

// Define CartItem interface
interface CartItem {
  id: string;
  userId: string;
  productId: string;
  variantId: string;
  quantity: number;
  variant: ProductVariant;
}

// Define CartState interface
interface CartState {
  cartItems: CartItem[];
  error: string | null;
  reset: () => void;
  coupon: { code: string; type: 'amount' | 'percentage'; value: number; couponId: string; couponType: 'individual' | 'special' } | null;
  couponStatus: 'none' | 'applied' | 'expired' | 'used' | 'invalid';
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number | string) => Promise<void>;
  removeFromCart: (productId: string, variantId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
  markCouponUsed: (code: string) => Promise<void>;
  clearCoupon: () => void;
  getCartSubtotal: () => number;
  getCartTotal: () => number;
  getItemCount: () => number;
  getSavings: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  coupon: null,
  couponStatus: 'none',
  error: null,
  fetchCart: async () => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      set({ cartItems: [] });
      return;
    }

    try {
      const response = await fetch(`/api/cart?userId=${user.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch cart (Status: ${response.status})`);
      }
      const data = await response.json();
      const sanitizedItems = data.map((item: CartItem) => ({
        ...item,
        quantity: sanitizeQuantity(item.quantity),
      }));
      set({ cartItems: sanitizedItems });
    } catch (error) {
      console.error('fetchCart error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load cart');
    }
  },
  reset: () => set({ cartItems: [], coupon: null, couponStatus: 'none' }),
  addToCart: async (productId, variantId, quantity = 1) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to add items to cart');
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId, variantId, quantity: sanitizeQuantity(quantity) }),
      });
      if (!response.ok) {
        throw new Error(`Failed to add to cart (Status: ${response.status})`);
      }
      await get().fetchCart();
      toast.success('Item added to cart');
    } catch (error) {
      console.error('addToCart error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add item to cart');
    }
  },
  updateQuantity: async (cartItemId, quantity) => {
    const { user } = useAuthStore.getState();
    const sanitizedQuantity = sanitizeQuantity(quantity);
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, cartItemId, quantity: sanitizedQuantity }),
      });
      if (!response.ok) {
        throw new Error(`Failed to update quantity (Status: ${response.status})`);
      }
      const updatedItem = await response.json();
      set((state) => ({
        cartItems: state.cartItems.map((item) =>
          item.id === cartItemId ? { ...item, quantity: updatedItem.quantity } : item
        ),
      }));
      toast.success('Quantity updated');
    } catch (error) {
      console.error('updateQuantity error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update quantity');
    }
  },
  removeFromCart: async (productId, variantId) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to remove items from cart');
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, productId, variantId }),
      });
      if (!response.ok) {
        throw new Error(`Failed to remove item (Status: ${response.status})`);
      }
      set((state) => ({
        cartItems: state.cartItems.filter(
          (item) => !(item.productId === productId && item.variantId === variantId)
        ),
      }));
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('removeFromCart error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove item from cart');
    }
  },
  clearCart: async () => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to clear cart');
      return;
    }

    try {
      const response = await fetch('/api/cart/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      if (!response.ok) {
        throw new Error(`Failed to clear cart (Status: ${response.status})`);
      }
      set({ cartItems: [] });
      toast.success('Cart cleared');
    } catch (error) {
      console.error('clearCart error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to clear cart');
    }
  },
  applyCoupon: async (code) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!code) {
      toast.error('Please enter a coupon code');
      set({ couponStatus: 'none' });
      return;
    }
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to apply a coupon');
      set({ couponStatus: 'none' });
      return;
    }

    const upperCode = code.toUpperCase();
    try {
      const response = await fetch(`/api/discount/coupons?code=${upperCode}&userId=${user.id}`);
      if (response.ok) {
        const { amount, id } = await response.json();
        set({
          coupon: { code: upperCode, type: 'amount', value: amount, couponId: id, couponType: 'individual' },
          couponStatus: 'applied',
        });
        toast.success(`Coupon ${upperCode} applied! ₹${amount} off`);
      } else {
        const errorData = await response.json();
        if (errorData.error.includes('expired')) {
          set({ couponStatus: 'expired' });
          toast.error('Coupon has expired');
        } else if (errorData.error.includes('used')) {
          set({ couponStatus: 'used' });
          toast.error('Coupon has already been used');
        } else {
          set({ couponStatus: 'invalid' });
          toast.error('Invalid coupon code');
        }
      }
    } catch (error) {
      console.error('applyCoupon error:', error);
      set({ couponStatus: 'invalid' });
      toast.error(error instanceof Error ? error.message : 'Failed to apply coupon');
    }
  },
  removeCoupon: () => {
    set({ coupon: null, couponStatus: 'none' });
    toast.success('Coupon removed');
  },
  markCouponUsed: async (code) => {
    const { user } = useAuthStore.getState();
    try {
      const endpoint = get().coupon?.couponType === 'individual' ? '/api/discount/coupons/use' : '/api/discount/special-coupons/use';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: user?.id }),
      });
      if (!response.ok) {
        throw new Error(`Failed to mark coupon as used (Status: ${response.status})`);
      }
      set({ couponStatus: 'used' });
    } catch (error) {
      console.error('markCouponUsed error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to mark coupon as used');
    }
  },
  clearCoupon: () => {
    set({ coupon: null, couponStatus: 'none' });
  },
  getCartSubtotal: () => {
    return get().cartItems.reduce(
      (total, item) => total + Number(item.variant.ourPrice) * item.quantity,
      0
    );
  },
  getCartTotal: () => {
    const subtotal = get().getCartSubtotal();
    const coupon = get().coupon;
    if (!coupon || get().couponStatus !== 'applied') return subtotal;
    const discount = coupon.type === 'amount' ? coupon.value : (subtotal * coupon.value) / 100;
    return Math.max(0, subtotal - discount);
  },
  getItemCount: () => {
    return get().cartItems.reduce((count, item) => count + item.quantity, 0);
  },
  getSavings: () => {
    return get().cartItems.reduce(
      (total, item) =>
        total +
        (Number(item.variant.mrp || item.variant.ourPrice) - Number(item.variant.ourPrice)) * item.quantity,
      0
    );
  },
}));