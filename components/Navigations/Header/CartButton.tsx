// CartButton.jsx
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';

const CartButton = () => {
  const cartItems = 2; 
  const cartTotal = '₹1.99k'; 

  return (
    <div className="relative">
      <Link href="/cart" className="flex items-center">
        <div className="relative">
          <ShoppingCart size={24} className="text-primary" />
          {cartItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {cartItems}
            </span>
          )}
        </div>
        
        <span className="hidden xs:inline-block ml-1 text-sm font-medium">
          {cartTotal}
        </span>
        
        <div className="hidden md:block border-l border-gray-300 ml-2 pl-2">
          <span className="text-sm underline">View Cart</span>
        </div>
      </Link>
    </div>
  );
};

export default CartButton;