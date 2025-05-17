'use client';

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { useCartStore } from '@/store/cart-store';

const CartButton = () => {
  const { getItemCount, getCartTotal } = useCartStore();

  const cartItems = getItemCount();
  const cartTotal = getCartTotal();

  // Format total for display (e.g., ₹1,234 → ₹1.23k, ₹12,345 → ₹12.35k)
  const formatCartTotal = (total:any) => {
    if (total >= 1000) {
      return `₹${(total / 1000).toFixed(2)}k`;
    }
    return `₹${total.toLocaleString('en-IN')}`;
  };

  return (
    <div className="relative">
      <Link href="/cart" className="flex items-center gap-2">
        <div className="relative">
          <ShoppingCart size={28} className=" text-primary hover:text-primary-hover transition-colors" />
          {cartItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center">
              {cartItems}
            </span>
          )}
        </div>

        <span className=" text-sm font-medium text-gray-900">
          {formatCartTotal(cartTotal)}
        </span>

        <div className="hidden md:block border-l border-gray-200 ml-2 pl-2">
          <span className="text-sm  hover:underline transition-colors">
            View Cart
          </span>
        </div>
      </Link>
    </div>
  );
};

export default CartButton;