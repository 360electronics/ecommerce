// context/wishlist-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';

interface WishlistContextType {
  wishlist: any[];
  wishlistCount: number;
  isInWishlist: (productId: string, variantId: string) => boolean;
  refreshWishlist: () => Promise<void>;
  setWishlist: React.Dispatch<React.SetStateAction<any[]>>;
}

const WishlistContext = createContext<WishlistContextType>({
  wishlist: [],
  wishlistCount: 0,
  isInWishlist: () => false,
  refreshWishlist: async () => {},
  setWishlist: () => {},
});

export const WishlistProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);

  const fetchWishlist = async () => {
    if (!user?.id) {
      setWishlist([]);
      setWishlistCount(0);
      return;
    }

    try {
      const res = await fetch(`/api/users/wishlist?userId=${user.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch wishlist');
      }

      const data: any[] = await res.json();
      setWishlist(data);
      setWishlistCount(data.length);
    } catch (err) {
      console.error('[FETCH_WISHLIST_ERROR]', err);
      setWishlist([]);
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user?.id]);

  const isInWishlist = (productId: string, variantId: string): boolean => {
    return wishlist.some(
      (item) => item.productId === productId && item.variantId === variantId
    );
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount,
        isInWishlist,
        refreshWishlist: fetchWishlist,
        setWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);