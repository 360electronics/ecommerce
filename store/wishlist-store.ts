// app/store/wishlist-store.ts
'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './auth-store';
import { useEffect } from 'react';

// Define types
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
  errors: Partial<Record<'fetch' | 'add' | 'remove', string>>;
  lastFetched: number | undefined;
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
  lastFetched: undefined,
  isInWishlist: () => false,
  fetchWishlist: async () => {},
  reset: () => {},
  addToWishlist: async () => false,
  removeFromWishlist: async () => false,
  refreshWishlist: async () => {},
};

// Simple retry logic for API calls
const fetchWithRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> => {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
};

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ...INITIAL_STATE,

  isInWishlist: (productId: string, variantId: string): boolean =>
    get().wishlist.some((item) => item.productId === productId && item.variantId === variantId),

  fetchWishlist: async (force = false): Promise<void> => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      set({
        wishlist: [],
        wishlistCount: 0,
        errors: {},
        isLoading: false,
        isRefetching: false,
        lastFetched: undefined,
      });
      return;
    }

    const { lastFetched } = get();
    const now = Date.now();
    const cacheDuration = 5 * 60 * 1000; // 5 minutes cache duration
    if (!force && lastFetched && now - lastFetched < cacheDuration) {
      return; // Use cached data
    }

    try {
      set({
        isLoading: true,
        isRefetching: force,
        errors: { ...get().errors, fetch: undefined },
      });
      const response = await fetchWithRetry(() =>
        fetch(`/api/users/wishlist?userId=${user.id}`, { credentials: 'include' })
      );
      if (!response.ok) {
        if (response.status === 404) {
          set({
            wishlist: [],
            wishlistCount: 0,
            isLoading: false,
            isRefetching: false,
            lastFetched: now,
            errors: { ...get().errors, fetch: undefined },
          });
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch wishlist (Status: ${response.status})`);
      }
      const data: WishlistItem[] = await response.json();
      set({
        wishlist: Array.isArray(data) ? data : [],
        wishlistCount: Array.isArray(data) ? data.length : 0,
        isLoading: false,
        isRefetching: false,
        lastFetched: now,
        errors: { ...get().errors, fetch: undefined },
      });
    } catch (error) {
      console.error('Fetch wishlist error:', error);
      const message = error instanceof Error ? error.message : 'Failed to load wishlist';
      set({
        errors: { ...get().errors, fetch: message },
        isLoading: false,
        isRefetching: false,
      });
      toast.error(message);
    }
  },

  addToWishlist: async (
    productId: string,
    variantId: string,
    tempData?: { product: Partial<Product>; variant: Partial<Variant> },
    onSuccess?: () => void
  ): Promise<boolean> => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id) {
      toast.error('Please log in to add to wishlist');
      set({ errors: { ...get().errors, add: 'Please log in to add to wishlist' } });
      return false;
    }

    if (!productId || !variantId) {
      toast.error('Invalid product or variant');
      set({ errors: { ...get().errors, add: 'Invalid product or variant' } });
      return false;
    }

    const { wishlist } = get();
    if (wishlist.some((item) => item.productId === productId && item.variantId === variantId)) {
      return true; // Item already in wishlist
    }

    // Optimistic update
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

    set(
      produce((state: WishlistState) => {
        state.wishlist.push(optimisticItem);
        state.wishlistCount += 1;
        state.isLoading = true;
        state.errors.add = undefined;
      })
    );

    try {
      const response = await fetchWithRetry(() =>
        fetch('/api/users/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ userId: user.id, productId, variantId }),
        })
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add to wishlist (Status: ${response.status})`);
      }
      const { item }: { item: WishlistItem } = await response.json();
      set(
        produce((state: WishlistState) => {
          const index = state.wishlist.findIndex(
            (i) => i.productId === productId && i.variantId === variantId
          );
          if (index !== -1) state.wishlist[index] = item;
          state.wishlistCount = state.wishlist.length;
          state.isLoading = false;
          state.errors.add = undefined;
          state.lastFetched = Date.now(); // Update cache timestamp
        })
      );
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Add to wishlist error:', error);
      set(
        produce((state: WishlistState) => {
          state.wishlist = state.wishlist.filter(
            (i) => !(i.productId === productId && i.variantId === variantId)
          );
          state.wishlistCount = state.wishlist.length;
          state.errors.add = error instanceof Error ? error.message : 'Failed to add to wishlist';
          state.isLoading = false;
        })
      );
      toast.error(error instanceof Error ? error.message : 'Failed to add to wishlist');
      return false;
    }
  },

  removeFromWishlist: async (productId: string, variantId: string, onSuccess?: () => void): Promise<boolean> => {
    const { user, isLoggedIn } = useAuthStore.getState();
    if (!isLoggedIn || !user?.id || user.id === '') {
      toast.error('Please log in to remove from wishlist');
      set({ errors: { ...get().errors, remove: 'Please log in to remove from wishlist' } });
      return false;
    }

    if (!productId || !variantId || productId === '' || variantId === '') {
      console.error('Invalid product or variant in removeFromWishlist:', { productId, variantId });
      toast.error('Invalid product or variant');
      set({ errors: { ...get().errors, remove: 'Invalid product or variant' } });
      return false;
    }

    const { wishlist } = get();
    const itemToRemove = wishlist.find(
      (item) => item.productId === productId && item.variantId === variantId
    );
    if (!itemToRemove) {
      return true; // Item not in wishlist
    }

    // Optimistic update
    set(
      produce((state: WishlistState) => {
        state.wishlist = state.wishlist.filter(
          (i) => !(i.productId === productId && i.variantId === variantId)
        );
        state.wishlistCount = state.wishlist.length;
        state.isLoading = true;
        state.errors.remove = undefined;
      })
    );

    try {
      const response = await fetchWithRetry(() =>
        fetch(`/api/users/wishlist?userId=${user.id}&productId=${productId}&variantId=${variantId}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to remove from wishlist (Status: ${response.status})`);
      }
      await response.json(); // Parse response to confirm success
      set(
        produce((state: WishlistState) => {
          state.isLoading = false;
          state.errors.remove = undefined;
          state.lastFetched = Date.now(); // Update cache timestamp
        })
      );
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      set(
        produce((state: WishlistState) => {
          state.wishlist = [...state.wishlist, itemToRemove].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          state.wishlistCount = state.wishlist.length;
          state.errors.remove = error instanceof Error ? error.message : 'Failed to remove from wishlist';
          state.isLoading = false;
        })
      );
      toast.error(error instanceof Error ? error.message : 'Failed to remove from wishlist');
      return false;
    }
  },

  refreshWishlist: async (): Promise<void> => {
    set({ isRefetching: true });
    await get().fetchWishlist(true);
  },

  reset: (): void => {
    set(INITIAL_STATE);
  },
}));

// Sync wishlist with auth state
export const useWishlistAuthSync = (): void => {
  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((state) => {
      if (!state.isLoggedIn) {
        useWishlistStore.getState().reset();
      } else {
        // Fetch wishlist when user logs in
        useWishlistStore.getState().fetchWishlist(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Initial fetch when component mounts
  useEffect(() => {
    const { isLoggedIn } = useAuthStore.getState();
    if (isLoggedIn) {
      useWishlistStore.getState().fetchWishlist(true);
    }
  }, []);
};