'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { fetchWithRetry, logError, debounce, AppError } from './store-utils';
import { useAuthStore } from './auth-store';
import { ProductImage, ProductVariant } from '@/types/product';
import { useRouter } from 'next/navigation';

// Utility to generate unique temporary IDs
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface CartItem {
  offerProduct?: any;
  id: string;
  userId: string;
  productId: string;
  variantId: string;
  cartOfferProductId?: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
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
  offerProductPrice?: string;
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
  couponStatus: 'none' | 'applied' | 'expired' | 'used' | 'invalid' | 'invalid_amount';
  error: AppError | null;
  lastFetched: number | null;
  loading: boolean;
  reset: () => void;
  fetchCart: () => Promise<void>;
  addToCart: (
    productId: string,
    variantId: string,
    quantity?: number,
    productData?: Partial<CartItem['product']>,
    variantData?: Partial<CartItem['variant']>
  ) => Promise<void>;
  addOfferProductToCart: (cartItemId: string, cartOfferProductId: string, offerPrice: string) => Promise<void>;
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
  loading: false,

  reset: () => set({ cartItems: [], coupon: null, couponStatus: 'none', error: null, lastFetched: null, loading: false }),

  fetchCart: async () => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      set({ cartItems: [], lastFetched: Date.now(), loading: false });
      return;
    }

    const cacheDuration = 10 * 60 * 1000;
    const lastFetched = get().lastFetched;
    if (lastFetched && Date.now() - lastFetched < cacheDuration && !get().loading) return;

    try {
      set({ loading: true });
      const data = await fetchWithRetry<CartItem[]>(() => fetch(`/api/cart?userId=${user.id}`));
      const sanitizedItems = Array.isArray(data)
        ? data.map((item) => ({
            ...item,
            quantity: sanitizeQuantity(item.quantity),
            variant: {
              ...item.variant,
              ourPrice: item.variant.ourPrice ?? '0',
              mrp: item.variant.mrp ?? item.variant.ourPrice ?? '0',
            },
            offerProductPrice: item.cartOfferProductId ? item.offerProductPrice : undefined,
          }))
        : [];
      set({ cartItems: sanitizedItems, lastFetched: Date.now(), error: null, loading: false });
    } catch (error) {
      logError('fetchCart', error);
      set({ error: error as AppError, loading: false });
    }
  },

  addToCart: async (productId, variantId, quantity = 1, productData = {}, variantData = {}) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      logError('addToCart', new Error('User not logged in'));
      throw new Error('User not logged in');
    }

    if (!productId || !variantId) {
      logError('addToCart', new Error('Invalid product or variant'));
      throw new Error('Invalid product or variant');
    }

    if (get().loading) {
      logError('addToCart', new Error('Cart operation in progress'));
      throw new Error('Cart operation in progress');
    }

    const sanitizedQuantity = sanitizeQuantity(quantity);
    const tempId = generateTempId();

    // Optimistic update
    set(
      produce((state: CartState) => {
        state.error = null;
        state.loading = true;
        const existingItem = state.cartItems.find(
          (item) => item.productId === productId && item.variantId === variantId && !item.id.startsWith('temp-')
        );
        if (existingItem) {
          existingItem.quantity += sanitizedQuantity;
        } else {
          state.cartItems.push({
            id: tempId,
            userId: user.id,
            productId,
            variantId,
            quantity: sanitizedQuantity,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            product: {
              id: productId,
              shortName: productData.shortName || 'Loading...',
              description: productData.description || null,
              category: productData.category || '',
              brand: productData.brand || '',
              status: productData.status || 'active',
              subProductStatus: productData.subProductStatus || 'active',
              totalStocks: productData.totalStocks || '0',
              averageRating: productData.averageRating || '0',
              ratingCount: productData.ratingCount || '0',
              createdAt: productData.createdAt || new Date().toISOString(),
              updatedAt: productData.updatedAt || new Date().toISOString(),
            },
            variant: {
              id: variantId,
              productId,
              name: variantData.name || 'Loading...',
              sku: variantData.sku || '',
              slug: variantData.slug || '',
              color: variantData.color || null,
              material: variantData.material || null,
              dimensions: variantData.dimensions || null,
              weight: variantData.weight || null,
              storage: variantData.storage || null,
              stock: variantData.stock || '0',
              mrp: variantData.mrp || '0',
              ourPrice: variantData.ourPrice || '0',
              productImages: variantData.productImages || [],
              createdAt: variantData.createdAt || new Date().toISOString(),
              updatedAt: variantData.updatedAt || new Date().toISOString(),
            },
          });
        }
      })
    );

    try {
      await fetchWithRetry(() =>
        fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            productId,
            variantId,
            quantity: sanitizedQuantity,
          }),
        })
      );
      // Force fetchCart to sync with server
      set({ lastFetched: null });
      await get().fetchCart();
    } catch (error) {
      logError('addToCart', error);
      // Revert optimistic update
      set(
        produce((state: CartState) => {
          const existingItem = state.cartItems.find(
            (item) => item.productId === productId && item.variantId === variantId && !item.id.startsWith('temp-')
          );
          if (existingItem) {
            existingItem.quantity = Math.max(1, existingItem.quantity - sanitizedQuantity);
          } else {
            state.cartItems = state.cartItems.filter((item) => item.id !== tempId);
          }
          state.error = error as AppError;
          state.loading = false;
        })
      );
      throw error;
    }
  },

  addOfferProductToCart: async (cartItemId, cartOfferProductId, offerPrice) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      logError('addOfferProductToCart', new Error('User not logged in'));
      throw new Error('User not logged in');
    }

    if (get().loading) {
      logError('addOfferProductToCart', new Error('Cart operation in progress'));
      throw new Error('Cart operation in progress');
    }

    const currentItem = get().cartItems.find((item) => item.id === cartItemId);
    if (!currentItem) {
      logError('addOfferProductToCart', new Error('Cart item not found'));
      throw new Error('Cart item not found');
    }

    try {
      set({ loading: true });
      await fetchWithRetry(() =>
        fetch('/api/cart/offer', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            cartItemId,
            cartOfferProductId,
            offerPrice,
          }),
        })
      );
      set({ lastFetched: null });
      await get().fetchCart();
    } catch (error) {
      logError('addOfferProductToCart', error);
      set({ loading: false });
      throw error;
    }
  },

  updateQuantity: debounce(async (cartItemId: string, quantity: number | string) => {
    const { user } = useAuthStore.getState();
    if (!user?.id) {
      logError('updateQuantity', new Error('User not logged in'));
      return;
    }

    if (get().loading) {
      logError('updateQuantity', new Error('Cart operation in progress'));
      return;
    }

    const sanitizedQuantity = sanitizeQuantity(quantity);
    const currentItem = get().cartItems.find((item) => item.id === cartItemId);
    if (!currentItem) return;

    set(
      produce((state: CartState) => {
        const item = state.cartItems.find((i) => i.id === cartItemId);
        if (item) item.quantity = sanitizedQuantity;
        state.loading = true;
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
          state.loading = false;
        })
      );
    } catch (error) {
      logError('updateQuantity', error);
      set(
        produce((state: CartState) => {
          const item = state.cartItems.find((i) => i.id === cartItemId);
          if (item) item.quantity = currentItem.quantity;
          state.error = error as AppError;
          state.loading = false;
        })
      );
    }
  }, 300),

  removeFromCart: async (productId, variantId) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      logError('removeFromCart', new Error('User not logged in'));
      return;
    }

    if (get().loading) {
      logError('removeFromCart', new Error('Cart operation in progress'));
      return;
    }

    const currentItems = get().cartItems;
    set(
      produce((state: CartState) => {
        state.cartItems = state.cartItems.filter(
          (item) => !(item.productId === productId && item.variantId === variantId)
        );
        state.loading = true;
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
      set({ loading: false });
    } catch (error) {
      logError('removeFromCart', error);
      set({ cartItems: currentItems, error: error as AppError, loading: false });
    }
  },

  clearCart: async () => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      logError('clearCart', new Error('User not logged in'));
      return;
    }

    if (get().loading) {
      logError('clearCart', new Error('Cart operation in progress'));
      return;
    }

    try {
      set({ loading: true });
      await fetchWithRetry(() =>
        fetch('/api/cart/clear', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
      );
      set({ cartItems: [], lastFetched: Date.now(), error: null, loading: false });
    } catch (error) {
      logError('clearCart', error);
      set({ error: error as AppError, loading: false });
    }
  },

  applyCoupon: async (code) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id || !code) {
      logError('applyCoupon', new Error('Invalid user or coupon code'));
      set({ couponStatus: 'none', error: new Error('Invalid user or coupon code'), loading: false });
      return;
    }

    if (get().loading) {
      logError('applyCoupon', new Error('Cart operation in progress'));
      return;
    }

    const upperCaseCode = code.toUpperCase();
    try {
      set({ loading: true });
      const data = await fetchWithRetry<{ amount: number; id: string; type: 'amount' | 'percentage' }>(() =>
        fetch(`/api/discount/coupons?code=${upperCaseCode}&userId=${user.id}`)
      );
      if (data.amount == null || isNaN(data.amount)) {
        throw new Error('Invalid coupon amount');
      }
      set({
        coupon: {
          code: upperCaseCode,
          type: data.type,
          value: data.amount,
          couponId: data.id,
          couponType: 'individual',
        },
        couponStatus: 'applied',
        error: null,
        loading: false,
      });
    } catch (error) {
      const appError = error as AppError;
      if (appError.status === 410) {
        set({ couponStatus: 'expired', error: appError, loading: false });
        return;
      }
      if (appError.status === 409) {
        set({ couponStatus: 'used', error: appError, loading: false });
        return;
      }
      try {
        const specialData = await fetchWithRetry<{
          amount: number | null;
          percentage: number | null;
          id: string;
          type: 'amount' | 'percentage';
        }>(() => fetch(`/api/discount/special-coupons?code=${upperCaseCode}&userId=${user.id}`));
        if (
          (specialData.type === 'amount' && (specialData.amount == null || isNaN(specialData.amount))) ||
          (specialData.type === 'percentage' && (specialData.percentage == null || isNaN(specialData.percentage)))
        ) {
          throw new Error('Invalid special coupon amount');
        }
        set({
          coupon: {
            code: upperCaseCode,
            type: specialData.type,
            value: specialData.type === 'amount' ? specialData.amount! : specialData.percentage!,
            couponId: specialData.id,
            couponType: 'special',
          },
          couponStatus: 'applied',
          error: null,
          loading: false,
        });
      } catch (specialError) {
        const specialAppError = specialError as AppError;
        logError('applyCoupon', specialError);
        set({
          couponStatus:
            specialAppError.status === 410
              ? 'expired'
              : specialAppError.status === 409
              ? 'used'
              : specialAppError.message === 'Invalid special coupon amount'
              ? 'invalid_amount'
              : 'invalid',
          error: specialAppError,
          loading: false,
        });
      }
    }
  },

  removeCoupon: () => set({ coupon: null, couponStatus: 'none', error: null, loading: false }),

  markCouponUsed: async (code) => {
    const { user } = useAuthStore.getState();
    if (!user?.id) {
      logError('markCouponUsed', new Error('User not logged in'));
      return;
    }

    if (get().loading) {
      logError('markCouponUsed', new Error('Cart operation in progress'));
      return;
    }

    try {
      set({ loading: true });
      const endpoint = get().coupon?.couponType === 'individual' ? '/api/discount/coupons/use' : '/api/discount/special-coupons/use';
      await fetchWithRetry(() =>
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, userId: user.id }),
        })
      );
      set({ couponStatus: 'used', error: null, loading: false });
    } catch (error) {
      logError('markCouponUsed', error);
      set({ error: error as AppError, loading: false });
    }
  },

  clearCoupon: () => set({ coupon: null, couponStatus: 'none', error: null, loading: false }),

  getCartSubtotal: () =>
    get().cartItems.reduce((total, item) => {
      // Skip temporary items to avoid incorrect calculations
      if (item.id.startsWith('temp-')) return total;
      const price = Number(item.variant.ourPrice) || 0;
      const offerPrice = Number(item.offerProductPrice) || 0;
      return total + (price + offerPrice) * item.quantity;
    }, 0),

  getCartTotal: () => {
    const subtotal = get().getCartSubtotal();
    const coupon = get().coupon;
    if (!coupon || get().couponStatus !== 'applied') return subtotal;
    const discount = coupon.type === 'amount' ? coupon.value || 0 : (subtotal * (coupon.value || 0)) / 100;
    return Math.max(0, subtotal - discount);
  },

  getItemCount: () =>
    get().cartItems.reduce((count, item) => (item.id.startsWith('temp-') ? count : count + item.quantity), 0),

  getSavings: () =>
    get().cartItems.reduce((total, item) => {
      if (item.id.startsWith('temp-')) return total;
      const mrp = Number(item.variant.mrp || item.variant.ourPrice) || 0;
      const ourPrice = Number(item.variant.ourPrice) || 0;
      return total + (mrp - ourPrice) * item.quantity;
    }, 0),
}));