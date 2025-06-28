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
  addToWishlist: (
    productId: string,
    variantId: string,
    tempData?: { product: Partial<Product>; variant: Partial<Variant> },
    onSuccess?: () => void
  ) => Promise<boolean>;
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
      set({ wishlist: [], wishlistCount: 0, lastFetched: Date.now() });
      return;
    }

    const cacheDuration = 10 * 60 * 1000;
    const lastFetched = get().lastFetched;
    if (!force && lastFetched && Date.now() - lastFetched < cacheDuration) return;

    try {
      set({ isLoading: true, isRefetching: force, errors: { ...get().errors, fetch: undefined } });
      const data = await fetchWithRetry<WishlistItem[]>(() => fetch(`/api/users/wishlist?userId=${user.id}`));
      const validatedData = Array.isArray(data) ? data : [];
      set({
        wishlist: validatedData,
        wishlistCount: validatedData.length,
        isLoading: false,
        isRefetching: false,
        lastFetched: Date.now(),
      });
    } catch (error) {
      logError('fetchWishlist', error);
      set({
        errors: { ...get().errors, fetch: error as AppError },
        isLoading: false,
        isRefetching: false,
      });
    }
  },
  addToWishlist: async (productId, variantId, tempData, onSuccess) => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      logError('addToWishlist', new Error('User not logged in'));
      return false;
    }

    if (!productId || !variantId) {
      logError('addToWishlist', new Error('Invalid product or variant'));
      return false;
    }

    if (get().isInWishlist(productId, variantId)) return true;

    const optimisticItem: WishlistItem = {
      productId,
      variantId,
      createdAt: new Date().toISOString(),
      product: {
        id: productId,
        name: tempData?.product.name ?? '',
        slug: tempData?.product.slug ?? '',
        description: tempData?.product.description ?? '',
        variants: tempData?.product.variants ?? [],
      },
      variant: {
        id: variantId,
        productId,
        name: tempData?.variant.name ?? '',
        sku: tempData?.variant.sku ?? '',
        slug: tempData?.variant.slug ?? '',
        dimensions: tempData?.variant.dimensions ?? {},
        weight: tempData?.variant.weight ?? 0,
        stock: tempData?.variant.stock ?? 0,
        mrp: tempData?.variant.mrp ?? 0,
        ourPrice: tempData?.variant.ourPrice ?? 0,
        productImages: tempData?.variant.productImages ?? [],
      },
    };

    // Apply optimistic update
    set(
      produce((state: WishlistState) => {
        state.wishlist.push(optimisticItem);
        state.wishlistCount += 1;
        state.isLoading = true;
        state.errors.add = undefined;
        state.lastFetched = Date.now(); // Prevent redundant fetches
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
          const index = state.wishlist.findIndex((i) => i.productId === productId && i.variantId === variantId);
          if (index !== -1) {
            state.wishlist[index] = item; // Replace optimistic item with server response
          } else {
            state.wishlist.push(item); // Fallback: add if not found
          }
          state.wishlistCount = state.wishlist.length;
          state.isLoading = false;
        })
      );
      onSuccess?.();
      return true;
    } catch (error) {
      logError('addToWishlist', error);
      set(
        produce((state: WishlistState) => {
          state.wishlist = state.wishlist.filter((i) => !(i.productId === productId && i.variantId === variantId));
          state.wishlistCount = state.wishlist.length;
          state.errors.add = error as AppError;
          state.isLoading = false;
        })
      );
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
    if (!itemToRemove) return true;

    set(
      produce((state: WishlistState) => {
        state.wishlist = state.wishlist.filter((i) => !(i.productId === productId && i.variantId === variantId));
        state.wishlistCount = state.wishlist.length;
        state.isLoading = true;
        state.errors.remove = undefined;
        state.lastFetched = Date.now(); // Prevent redundant fetches
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
      return false;
    }
  },
  refreshWishlist: async () => {
    set({ isRefetching: true });
    await get().fetchWishlist(true);
  },
  reset: () => set(INITIAL_STATE),
}));

export const useWishlistAuthSync = () => {
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (!state.isLoggedIn) {
        useWishlistStore.getState().reset();
      } else {
        useWishlistStore.getState().fetchWishlist(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const { isLoggedIn } = useAuthStore.getState();
    if (isLoggedIn) {
      useWishlistStore.getState().fetchWishlist(true);
    }
  }, []);
};