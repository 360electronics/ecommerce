import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchWithRetry, logError, AppError } from './store-utils';
import { User } from './types';
import { useCartStore } from './cart-store';
import { useCheckoutStore } from './checkout-store';
import { useWishlistStore } from './wishlist-store';
import { useProfileStore } from './profile-store';

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  error: AppError | null;
  fetchAuthStatus: () => Promise<void>;
  setAuth: (isLoggedIn: boolean, user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      isLoading: false,
      error: null,
      fetchAuthStatus: async () => {
        const { isLoading } = get();
        if (isLoading) return;
      
        try {
          set({ isLoading: true, error: null });
          const data = await fetchWithRetry<{ isAuthenticated: boolean; user: User | null }>(
            () => fetch('/api/auth/status', { credentials: 'include' })
          );
      
          set({
            isLoggedIn: data.isAuthenticated,
            user: data.user,
            isLoading: false,
            error: data.isAuthenticated ? null : null // Don't set error if just logged out
          });
        } catch (error) {
          logError('fetchAuthStatus', error);
          set({ isLoggedIn: false, user: null, isLoading: false, error: error as AppError });
        }
      },
      
      setAuth: (isLoggedIn, user) => set({ isLoggedIn, user, isLoading: false, error: null }),
      logout: async () => {
        try {
          await fetchWithRetry(() =>
            fetch('/api/auth/logout', {
              method: 'POST',
              credentials: 'include',
            })
          );
          set({ isLoggedIn: false, user: null, isLoading: false, error: null });
          // Reset all stores
          useCartStore.getState().reset();
          useCheckoutStore.getState().clearCheckout('');
          useWishlistStore.getState().reset();
          useProfileStore.getState().reset();
        } catch (error) {
          logError('logout', error);
          set({ error: error as AppError });
        }
      },
    }),
    {
      name: 'g36-auth-status',
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user
          ? {
              id: state.user.id,
              firstName: state.user.firstName,
              lastName: state.user.lastName,
            }
          : null,
      }),
    }
  )
);