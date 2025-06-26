'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useWishlistStore } from '@/store/wishlist-store';

const WishlistButton = () => {
  const { wishlistCount } = useWishlistStore(); 

  // console.log(wishlistCount)

 

  return (
    <div className="relative">
      <Link
        href="/profile/wishlist"
        className="flex items-center bg-slate-200 rounded-full p-2"
        aria-label="View wishlist"
      >
        <div className="relative">
          <Heart size={24} />
          {wishlistCount > 0 && (
            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {wishlistCount}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

export default WishlistButton;
