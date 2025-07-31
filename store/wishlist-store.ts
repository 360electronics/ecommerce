'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { useEffect } from 'react';
import { useAuthStore } from './auth-store';
import { fetchWithRetry, logError, AppError } from './store-utils';

interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
}

interface Variant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  slug: string;
  dimensions: Dimensions;
  weight: number;
  stock: number;
  mrp: number;
  ourPrice: number;
  productImages: string[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  variants: Variant[];
}

interface WishlistItem {
  productId: string;
  variantId: string;
  createdAt: string;
  product: Product;
  variant: Variant;
}

interface WishlistState {
  wishlist: WishlistItem[];
  wishlistCount: number;
  isLoading: boolean;
  isRefetching: boolean;
  errors: Partial<Record<'fetch' | 'add' | 'remove', AppError>>;
  lastFetched: number | null;
  isInWishlist: (productId: string, variantId: string) => boolean;
  fetchWishlist: (force?: boolean) => Promise<void>;
  reset: () => void;
  addToWishlist: (productId: string, variantId: string, onSuccess?: () => void) => Promise<boolean>;
  removeFromWishlist: (productId: string, variantId: string, onSuccess?: () => void) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

const INITIAL_STATE: WishlistState = {
  wishlist: [],
  wishlistCount: 0,
  isLoading: false,
  isRefetching: false,
  errors: {},
  lastFetched: null,
  isInWishlist: () => false,
  fetchWishlist: async () => {},
  reset: () => {},
  addToWishlist: async () => false,
  removeFromWishlist: async () => false,
  refreshWishlist: async () => {},
};

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ...INITIAL_STATE,
  isInWishlist: (productId: string, variantId: string) =>
    get().wishlist.some((item) => item.productId === productId && item.variantId === variantId),
  fetchWishlist: async (force = false) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      console.log('[fetchWishlist] User not logged in, resetting wishlist');
      set({ wishlist: [], wishlistCount: 0, lastFetched: Date.now() });
      return;
    }

    const cacheDuration = 10 * 60 * 1000; // 10 minutes
    const lastFetched = get().lastFetched;
    if (!force && lastFetched && Date.now() - lastFetched < cacheDuration) {
      console.log('[fetchWishlist] Cache hit, skipping fetch');
      return;
    }

    try {
      console.log('[fetchWishlist] Fetching wishlist for user:', user.id);
      set({ isLoading: true, isRefetching: force, errors: { ...get().errors, fetch: undefined } });
      const data = await fetchWithRetry<WishlistItem[]>(() =>
        fetch(`/api/users/wishlist?userId=${user.id}`, { credentials: 'include' })
      );
      console.log('[fetchWishlist] Fetched data:', data);
      const validatedData = Array.isArray(data) ? data : [];
      set({
        wishlist: validatedData,
        wishlistCount: validatedData.length,
        isLoading: false,
        isRefetching: false,
        lastFetched: Date.now(),
      });
      console.log('[fetchWishlist] State updated:', { wishlistCount: validatedData.length });
    } catch (error) {
      logError('fetchWishlist', error);
      set({
        errors: { ...get().errors, fetch: error as AppError },
        isLoading: false,
        isRefetching: false,
      });
      console.log('[fetchWishlist] Error:', error);
    }
  },
  addToWishlist: async (productId, variantId, onSuccess) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      logError('addToWishlist', new Error('User not logged in'));
      return false;
    }

    if (!productId || !variantId) {
      logError('addToWishlist', new Error('Invalid product or variant'));
      return false;
    }

    if (get().isInWishlist(productId, variantId)) {
      console.log('[addToWishlist] Item already in wishlist:', { productId, variantId });
      return true;
    }

    set(
      produce((state: WishlistState) => {
        state.isLoading = true;
        state.errors.add = undefined;
      })
    );

    try {
      const { item } = await fetchWithRetry<{ item: WishlistItem }>(() =>
        fetch('/api/users/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: user.id, productId, variantId }),
        })
      );
      set(
        produce((state: WishlistState) => {
          state.wishlist.push(item);
          state.wishlistCount = state.wishlist.length;
          state.isLoading = false;
          state.lastFetched = Date.now();
        })
      );
      console.log('[addToWishlist] Success:', { productId, variantId });
      onSuccess?.();
      return true;
    } catch (error) {
      logError('addToWishlist', error);
      set(
        produce((state: WishlistState) => {
          state.errors.add = error as AppError;
          state.isLoading = false;
        })
      );
      console.log('[addToWishlist] Error:', error);
      return false;
    }
  },
  removeFromWishlist: async (productId, variantId, onSuccess) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      logError('removeFromWishlist', new Error('User not logged in'));
      return false;
    }

    const itemToRemove = get().wishlist.find((item) => item.productId === productId && item.variantId === variantId);
    if (!itemToRemove) {
      console.log('[removeFromWishlist] Item not in wishlist:', { productId, variantId });
      return true;
    }

    set(
      produce((state: WishlistState) => {
        state.wishlist = state.wishlist.filter((i) => !(i.productId === productId && i.variantId === variantId));
        state.wishlistCount = state.wishlist.length;
        state.isLoading = true;
        state.errors.remove = undefined;
        state.lastFetched = Date.now();
      })
    );

    try {
      await fetchWithRetry(() =>
        fetch(`/api/users/wishlist?userId=${user.id}&productId=${productId}&variantId=${variantId}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      );
      set(
        produce((state: WishlistState) => {
          state.isLoading = false;
        })
      );
      console.log('[removeFromWishlist] Success:', { productId, variantId });
      onSuccess?.();
      return true;
    } catch (error) {
      logError('removeFromWishlist', error);
      set(
        produce((state: WishlistState) => {
          state.wishlist = [...state.wishlist, itemToRemove].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          state.wishlistCount = state.wishlist.length;
          state.errors.remove = error as AppError;
          state.isLoading = false;
        })
      );
      console.log('[removeFromWishlist] Error:', error);
      return false;
    }
  },
  refreshWishlist: async () => {
    console.log('[refreshWishlist] Triggered');
    set({ isRefetching: true });
    await get().fetchWishlist(true);
  },
  reset: () => {
    console.log('[resetWishlist] Resetting wishlist state');
    set(INITIAL_STATE);
  },
}));

export const useWishlistAuthSync = () => {
  useEffect(() => {
    const { isLoggedIn, user } = useAuthStore.getState();
    const { fetchWishlist, reset } = useWishlistStore.getState();

    // Initial fetch if logged in
    if (isLoggedIn && user?.id) {
      console.log('[useWishlistAuthSync] Initial fetch for logged-in user:', user.id);
      fetchWishlist(); // No force=true to respect cache
    } else {
      console.log('[useWishlistAuthSync] User not logged in, resetting wishlist');
      reset();
    }

    // Subscribe to auth state changes
    const unsubscribe = useAuthStore.subscribe((state, prevState) => {
      if (state.isLoggedIn !== prevState.isLoggedIn) {
        if (state.isLoggedIn && state.user?.id) {
          console.log('[useWishlistAuthSync] Auth state changed to logged in, fetching wishlist');
          fetchWishlist(); // No force=true to respect cache
        } else {
          console.log('[useWishlistAuthSync] Auth state changed to logged out, resetting wishlist');
          reset();
        }
      }
    });

    return () => {
      console.log('[useWishlistAuthSync] Unsubscribing from auth store');
      unsubscribe();
    };
  }, []);
};