'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { fetchWithRetry, logError, debounce, AppError } from './store-utils';
import { useAuthStore } from './auth-store';
import { ProductImage, ProductVariant } from '@/types/product';

// In cart-store.ts
interface CartItem {
  id: string;
  userId: string;
  productId: string;
  variantId: string;
  quantity: number;
  createdAt: string; // Add createdAt
  updatedAt: string; // Add updatedAt
  isOfferProduct?: boolean;
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
    color: string | null;
    material: string | null;
    dimensions: string | null;
    weight: string | null;
    storage: string | null;
    stock: string;
    mrp: string;
    ourPrice: string;
    productImages: ProductImage[];
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

interface CartState {
  cartItems: CartItem[];
  coupon: Coupon | null;
  couponStatus: 'none' | 'applied' | 'expired' | 'used' | 'invalid';
  error: AppError | null;
  lastFetched: number | null;
  reset: () => void;
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

const sanitizeQuantity = (quantity: number | string): number => Math.max(1, Math.floor(Number(quantity)));

export const useCartStore = create<CartState>((set, get) => ({
  cartItems: [],
  coupon: null,
  couponStatus: 'none',
  error: null,
  lastFetched: null,
  reset: () => set({ cartItems: [], coupon: null, couponStatus: 'none', error: null, lastFetched: null }),
  fetchCart: async () => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      set({ cartItems: [], lastFetched: Date.now() });
      return;
    }

    const cacheDuration = 10 * 60 * 1000; // 10 minutes
    const lastFetched = get().lastFetched;
    if (lastFetched && Date.now() - lastFetched < cacheDuration) return;

    try {
      const data = await fetchWithRetry<CartItem[]>(() => fetch(`/api/cart?userId=${user.id}`));
      const sanitizedItems = Array.isArray(data)
        ? data.map((item) => ({ ...item, quantity: sanitizeQuantity(item.quantity) }))
        : [];
      set({ cartItems: sanitizedItems, lastFetched: Date.now(), error: null });
    } catch (error) {
      logError('fetchCart', error);
      set({ error: error as AppError });
    }
  },
  addToCart: async (productId, variantId, quantity = 1) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      logError('addToCart', new Error('User not logged in'));
      return;
    }

    try {
      await fetchWithRetry(() =>
        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, productId, variantId, quantity: sanitizeQuantity(quantity) }),
        })
      );
      await get().fetchCart();
    } catch (error) {
      logError('addToCart', error);
      set({ error: error as AppError });
    }
  },
  updateQuantity: debounce(async (cartItemId: string, quantity: number | string) => {
    const { user } = useAuthStore.getState();
    if (!user?.id) {
      logError('updateQuantity', new Error('User not logged in'));
      return;
    }

    const sanitizedQuantity = sanitizeQuantity(quantity);
    const currentItem = get().cartItems.find((item) => item.id === cartItemId);
    if (!currentItem) return;

    set(
      produce((state: CartState) => {
        const item = state.cartItems.find((i) => i.id === cartItemId);
        if (item) item.quantity = sanitizedQuantity;
      })
    );

    try {
      const updatedItem = await fetchWithRetry<{ quantity: number }>(() =>
        fetch('/api/cart', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, cartItemId, quantity: sanitizedQuantity }),
        })
      );
      set(
        produce((state: CartState) => {
          const item = state.cartItems.find((i) => i.id === cartItemId);
          if (item) item.quantity = updatedItem.quantity;
        })
      );
    } catch (error) {
      logError('updateQuantity', error);
      set(
        produce((state: CartState) => {
          const item = state.cartItems.find((i) => i.id === cartItemId);
          if (item) item.quantity = currentItem.quantity;
        })
      );
      set({ error: error as AppError });
    }
  }, 300),
  removeFromCart: async (productId, variantId) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      logError('removeFromCart', new Error('User not logged in'));
      return;
    }

    const currentItems = get().cartItems;
    set(
      produce((state: CartState) => {
        state.cartItems = state.cartItems.filter(
          (item) => !(item.productId === productId && item.variantId === variantId)
        );
      })
    );

    try {
      await fetchWithRetry(() =>
        fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, productId, variantId }),
        })
      );
    } catch (error) {
      logError('removeFromCart', error);
      set({ cartItems: currentItems, error: error as AppError });
    }
  },
  clearCart: async () => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      logError('clearCart', new Error('User not logged in'));
      return;
    }

    try {
      await fetchWithRetry(() =>
        fetch('/api/cart/clear', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
      );
      set({ cartItems: [], lastFetched: Date.now(), error: null });
    } catch (error) {
      logError('clearCart', error);
      set({ error: error as AppError });
    }
  },
  applyCoupon: async (code) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id || !code) {
      logError('applyCoupon', new Error('Invalid user or coupon code'));
      set({ couponStatus: 'none', error: new Error('Invalid user or coupon code') });
      return;
    }

    try {
      const data = await fetchWithRetry<{ amount: number; id: string }>(() =>
        fetch(`/api/discount/coupons?code=${code.toUpperCase()}&userId=${user.id}`)
      );
      set({
        coupon: {
          code: code.toUpperCase(),
          type: 'amount',
          value: data.amount,
          couponId: data.id,
          couponType: 'individual',
        },
        couponStatus: 'applied',
        error: null,
      });
    } catch (error) {
      logError('applyCoupon', error);
      const appError = error as AppError;
      const status = appError.status || 500;
      set({
        couponStatus: status === 410 ? 'expired' : status === 409 ? 'used' : 'invalid',
        error: appError,
      });
    }
  },
  removeCoupon: () => set({ coupon: null, couponStatus: 'none', error: null }),
  markCouponUsed: async (code) => {
    const { user } = useAuthStore.getState();
    if (!user?.id) return;

    try {
      const endpoint = get().coupon?.couponType === 'individual' ? '/api/discount/coupons/use' : '/api/discount/special-coupons/use';
      await fetchWithRetry(() =>
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, userId: user.id }),
        })
      );
      set({ couponStatus: 'used', error: null });
    } catch (error) {
      logError('markCouponUsed', error);
      set({ error: error as AppError });
    }
  },
  clearCoupon: () => set({ coupon: null, couponStatus: 'none', error: null }),
  getCartSubtotal: () =>
    get().cartItems.reduce((total, item) => total + Number(item.variant.ourPrice) * item.quantity, 0),
  getCartTotal: () => {
    const subtotal = get().getCartSubtotal();
    const coupon = get().coupon;
    if (!coupon || get().couponStatus !== 'applied') return subtotal;
    const discount = coupon.type === 'amount' ? coupon.value : (subtotal * coupon.value) / 100;
    return Math.max(0, subtotal - discount);
  },
  getItemCount: () => get().cartItems.reduce((count, item) => count + item.quantity, 0),
  getSavings: () =>
    get().cartItems.reduce(
      (total, item) =>
        total + (Number(item.variant.mrp || item.variant.ourPrice) - Number(item.variant.ourPrice)) * item.quantity,
      0
    ),
}));