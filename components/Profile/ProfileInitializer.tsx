'use client';

import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useProfileStore } from '@/store/profile-store';
import { useWishlistStore } from '@/store/wishlist-store';

export const useProfileInitializer = () => {
  const { user, isLoading: authLoading, isLoggedIn } = useAuthStore();
  const { fetchAll } = useProfileStore();
  const { fetchWishlist } = useWishlistStore();

  useEffect(() => {
    if (authLoading || !isLoggedIn || !user?.id) {
      return;
    }

    const abortController = new AbortController();

    // Fetch all profile data and wishlist
    fetchAll(user.id);
    fetchWishlist(true);

    return () => {
      abortController.abort();
    };
  }, [authLoading, isLoggedIn, user?.id, fetchAll, fetchWishlist]);

  return null; // This hook doesn't return anything
};