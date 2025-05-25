'use client';

import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useState, useCallback } from 'react';

interface CheckoutItem {
  userId: string;
  productId: string;
  variantId: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  product: {
    shortName: string;
    brand: string;
    deliveryMode: string;
  };
  variant: {
    name: string;
    ourPrice: number;
    mrp:number;
    productImages: string[];
  };
}

interface CheckoutContextType {
  checkoutItems: CheckoutItem[];
  addToCheckout: (item: {
    userId: string;
    productId: string;
    variantId: string;
    totalPrice: number;
    quantity: number;
  }) => Promise<void>;
  removeFromCheckout: (id: string, userId: string) => Promise<void>;
  fetchCheckoutItems: (userId: string) => Promise<void>;
  clearCheckout: (userId: string) => Promise<void>;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export const CheckoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const router = useRouter();

  const fetchCheckoutItems = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/checkout?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch checkout items');
      const data = await response.json();
      setCheckoutItems(data);
    } catch (error) {
      console.error('Error fetching checkout items:', error);
    }
  }, []);

  const addToCheckout = useCallback(
    async (item: { userId: string; productId: string; variantId: string; totalPrice: number; quantity: number }) => {
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (!response.ok) throw new Error('Failed to add to checkout');
        router.push('/checkout');
        await fetchCheckoutItems(item.userId);
      } catch (error) {
        console.error('Error adding to checkout:', error);
      }
    },
    [fetchCheckoutItems]
  );

  const removeFromCheckout = useCallback(async (id: string, userId: string) => {
    try {
      const response = await fetch(`/api/checkout?id=${id}&userId=${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove from checkout');
      setCheckoutItems((prev) => prev.filter((item) => item.variantId !== id));
    } catch (error) {
      console.error('Error removing from checkout:', error);
    }
  }, []);

  const clearCheckout = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/checkout/clear?userId=${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear checkout');
      setCheckoutItems([]);
      router.push('/'); // Redirect to homepage after clearing
    } catch (error) {
      console.error('Error clearing checkout:', error);
    }
  }, [router]);

  return (
    <CheckoutContext.Provider
      value={{ checkoutItems, addToCheckout, removeFromCheckout, fetchCheckoutItems, clearCheckout }}
    >
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
};