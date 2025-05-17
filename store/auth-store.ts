'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { AuthState } from './types';

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
      setAuth: (isLoggedIn, user) => set({ isLoggedIn, user, isLoading: false, error: null }),
    }),
    {
      name: 'user-status',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        user: state.user
          ? {
              id: state.user.id,
              email: state.user.email,
              firstName: state.user.firstName,
              lastName: state.user.lastName,
              role: state.user.role,
            }
          : null,
      }),
    }
  )
);