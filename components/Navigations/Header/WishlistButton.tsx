// WishlistButton.jsx
import React from 'react';
import { Heart } from 'lucide-react';
import Link from 'next/link';

const WishlistButton = () => {
  const wishlistCount = 3; // This would come from your wishlist state management

  return (
    <div className="relative">
      <Link
        href="/profile/wishlist"
        className="flex items-center bg-slate-200 rounded-full p-2"
        aria-label="View wishlist"
      >
        <div className="relative">
          <Heart 
            size={24} 
          />
        </div>
      </Link>
    </div>
  );
};

export default WishlistButton;