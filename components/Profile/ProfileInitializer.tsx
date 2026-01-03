'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useProfileStore } from '@/store/profile-store';
import { useWishlistStore } from '@/store/wishlist-store';

export const useProfileInitializer = () => {
  const { user, isLoading: authLoading, isLoggedIn } = useAuthStore();
  const { fetchAll } = useProfileStore();
  const { fetchWishlist } = useWishlistStore();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    // ⏳ Still resolving auth
    if (authLoading) {
      return;
    }

    // 🔓 Auth resolved, user NOT logged in
    if (!isLoggedIn || !user?.id) {
      setReady(true);
      return;
    }

    // ✅ Auth resolved & logged in → fetch data
    const abortController = new AbortController();

    Promise.all([
      fetchAll(user.id, false, abortController.signal),
      fetchWishlist(true),
    ])
      .catch(() => {
        // swallow errors – handled in stores
      })
      .finally(() => {
        setReady(true);
      });

    return () => {
      abortController.abort();
    };
  }, [authLoading, isLoggedIn, user?.id, fetchAll, fetchWishlist]);

  return {
    ready,
    isAuthenticated: Boolean(isLoggedIn && user?.id),
  };
};
