"use client";

import { useAuth } from '@/context/auth-context';
import { useState } from 'react';

interface CartItemResponse {
  id: string;
  userId: string;
  productId: string;
  variantId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export const useCart = () => {
  const { user, isLoggedIn, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const addToCart = async (
    productId: string,
    variantId: string,
    quantity: number = 1
  ): Promise<CartItemResponse | null> => {
    if (!isLoggedIn || !user?.id || isLoading) {
      setError('User must be logged in to add items to cart');
      return null;
    }

    setIsAdding(true);
    setError(null);

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken') || ''}`,
        },
        body: JSON.stringify({
          userId: user.id,
          productId,
          variantId,
          quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add item to cart');
        return null;
      }

      const cartItem = await response.json();
      return cartItem;
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('An unexpected error occurred');
      return null;
    } finally {
      setIsAdding(false);
    }
  };

  return { addToCart, error, isAdding };
};