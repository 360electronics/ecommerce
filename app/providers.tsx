// components/StoreProvider.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useHomeStore } from '@/store/home-store';
import { useProfileStore, useProfileInitializer } from '@/store/profile-store';
import { useWishlistStore } from '@/store/wishlist-store';
import { useCartStore } from '@/store/cart-store';

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoggedIn, isLoading: authLoading, fetchAuthStatus } = useAuthStore();
  const { fetchHomeData } = useHomeStore();
  const { reset: resetProfile } = useProfileStore();
  const { fetchWishlist, reset: resetWishlist } = useWishlistStore();
  const { fetchCart, reset: resetCart } = useCartStore();

  // Initialize auth status on mount
  useEffect(() => {
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  // Initialize profile sections
  useProfileInitializer('profile');
  useProfileInitializer('orders');
  useProfileInitializer('referrals');
  useProfileInitializer('tickets');

  // Fetch home data
  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // Fetch auth-dependent data and handle reset
  useEffect(() => {
    if (authLoading) return; // Wait for auth to resolve

    if (isLoggedIn && user?.id) {
      fetchWishlist();
      fetchCart();
    } else {
      // Reset auth-dependent stores only when explicitly not logged in
      resetProfile();
      resetWishlist();
      resetCart();
    }
  }, [authLoading, isLoggedIn, user?.id, fetchWishlist, fetchCart, resetProfile, resetWishlist, resetCart]);

  return <>{children}</>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return <StoreProvider>{children}</StoreProvider>;
};