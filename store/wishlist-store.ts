// store/wishlist-store.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { useAuthStore } from './auth-store';
import { WishlistItem } from './types';

interface WishlistState {
  wishlist: WishlistItem[];
  wishlistCount: number;
  isLoading: boolean;
  isRefetching: boolean;
  errors: Partial<Record<'fetch' | 'add' | 'remove', string>>;
  lastFetched: number | undefined; // Add lastFetched to track cache
  isInWishlist: (productId: string, variantId: string) => boolean;
  fetchWishlist: (force?: boolean) => Promise<void>;
  reset: () => void;
  addToWishlist: (productId: string, variantId: string) => Promise<void>;
  removeFromWishlist: (productId: string, variantId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishlist: [],
      wishlistCount: 0,
      isLoading: false,
      isRefetching: false,
      errors: {},
      lastFetched: undefined, // Initialize lastFetched
      isInWishlist: (productId, variantId) =>
        get().wishlist.some((item) => item.productId === productId && item.variantId === variantId),
      fetchWishlist: async (force = false) => {
        const { user, isLoggedIn } = useAuthStore.getState();
        if (!isLoggedIn || !user?.id) {
          set({ wishlist: [], wishlistCount: 0, errors: {}, isLoading: false });
          return;
        }

        const { wishlist, lastFetched } = get();
        const now = Date.now();
        const cacheDuration = 5 * 60 * 1000; // 5 minutes
        if (!force && wishlist.length > 0 && lastFetched && now - lastFetched < cacheDuration) {
          return;
        }

        try {
          set({ isLoading: true, errors: { ...get().errors, fetch: undefined } });
          const response = await fetch(`/api/users/wishlist?userId=${user.id}`, {
            credentials: 'include',
          });
          if (!response.ok) {
            if (response.status === 404) {
              set({ wishlist: [], wishlistCount: 0, isLoading: false });
              return;
            }
            throw new Error(`Failed to fetch wishlist (Status: ${response.status})`);
          }
          const data = await response.json();
          set({
            wishlist: Array.isArray(data) ? data : [],
            wishlistCount: Array.isArray(data) ? data.length : 0,
            isLoading: false,
            lastFetched: now,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to load wishlist';
          set({
            errors: { ...get().errors, fetch: message },
            isLoading: false,
          });
          toast.error(message);
        }
      },
      reset: () => set({ wishlist: [], wishlistCount: 0, isLoading: false, isRefetching: false, errors: {}, lastFetched: undefined }),
      addToWishlist: async (productId, variantId) => {
        const { user, isLoggedIn } = useAuthStore.getState();
        if (!isLoggedIn || !user?.id) {
          const message = 'Please log in to add to wishlist';
          set({ errors: { ...get().errors, add: message } });
          toast.error(message);
          return;
        }

        try {
          set({ isLoading: true, errors: { ...get().errors, add: undefined } });
          const response = await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId: user.id, productId, variantId }),
          });
          if (!response.ok) {
            throw new Error(`Failed to add to wishlist (Status: ${response.status})`);
          }
          await get().fetchWishlist(true); // Force refetch
          toast.success('Added to wishlist');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to add to wishlist';
          set({
            errors: { ...get().errors, add: message },
            isLoading: false,
          });
          toast.error(message);
        }
      },
      removeFromWishlist: async (productId, variantId) => {
        const { user, isLoggedIn } = useAuthStore.getState();
        if (!isLoggedIn || !user?.id) {
          const message = 'Please log in to remove from wishlist';
          set({ errors: { ...get().errors, remove: message } });
          toast.error(message);
          return;
        }

        try {
          set({ isLoading: true, errors: { ...get().errors, remove: undefined } });
          const response = await fetch('/api/wishlist', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId: user.id, productId, variantId }),
          });
          if (!response.ok) {
            throw new Error(`Failed to remove from wishlist (Status: ${response.status})`);
          }
          await get().fetchWishlist(true); // Force refetch
          toast.success('Removed from wishlist');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to remove from wishlist';
          set({
            errors: { ...get().errors, remove: message },
            isLoading: false,
          });
          toast.error(message);
        }
      },
    }),
    {
      name: 'wishlist-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        wishlist: state.wishlist,
        wishlistCount: state.wishlistCount,
        lastFetched: state.lastFetched, // Persist lastFetched
      }),
    }
  )
);