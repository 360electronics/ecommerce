import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './types';

export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  fetchAuthStatus: () => Promise<void>;
  setAuth: (isLoggedIn: boolean, user: User | null) => void;
}


export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      user: null,
      isLoading: true,
      error: null,
      fetchAuthStatus: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch('/api/auth/status', {
            credentials: 'include',
          });
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to fetch auth status');
          }
          const data = await response.json();
          set({
            isLoggedIn: data.isAuthenticated,
            user: data.user,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching auth status:', error);
          set({
            isLoggedIn: false,
            user: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch auth status',
          });
        }
      },
      setAuth: (isLoggedIn, user) =>
        set({ isLoggedIn, user, isLoading: false, error: null }),
    }),
    {
      name: 'g36-auth-status', 
      partialize: (state) => ({ isLoggedIn: state.isLoggedIn }),
    }
  )
);
