import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchWithRetry, logError, AppError } from './store-utils';
import { User } from './types';

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  error: AppError | null;
  fetchAuthStatus: () => Promise<void>;
  setAuth: (isLoggedIn: boolean, user: User | null) => void;
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
          set({ isLoggedIn: data.isAuthenticated, user: data.user, isLoading: false });
        } catch (error) {
          logError('fetchAuthStatus', error);
          set({ isLoggedIn: false, user: null, isLoading: false, error: error as AppError });
        }
      },
      setAuth: (isLoggedIn, user) => set({ isLoggedIn, user, isLoading: false, error: null }),
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