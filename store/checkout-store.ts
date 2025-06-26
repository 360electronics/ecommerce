// app/store/checkout-store.ts
'use client';

import { create } from 'zustand';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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
    mrp: number;
    productImages: string[];
  };
}

interface CheckoutState {
  checkoutItems: CheckoutItem[];
  isLoading: boolean;
  error: string | null;
  fetchCheckoutItems: (userId: string) => Promise<void>;
  addToCheckout: (item: {
    userId: string;
    productId: string;
    variantId: string;
    totalPrice: number;
    quantity: number;
  }) => Promise<void>;
  removeFromCheckout: (id: string, userId: string) => Promise<void>;
  clearCheckout: (userId: string) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  checkoutItems: [],
  isLoading: false,
  error: null,
  fetchCheckoutItems: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/checkout?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch checkout items');
      const data: CheckoutItem[] = await response.json();
      set({ checkoutItems: data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch checkout items';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },
  addToCheckout: async (item) => {
    set({ isLoading: true, error: null });
    const router = useRouter();
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to add to checkout');
      await get().fetchCheckoutItems(item.userId);
      router.push('/checkout');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add to checkout';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },
  removeFromCheckout: async (id: string, userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/checkout?id=${id}&userId=${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove from checkout');
      set((state) => ({
        checkoutItems: state.checkoutItems.filter((item) => item.variantId !== id),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove from checkout';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },
  clearCheckout: async (userId: string) => {
    set({ isLoading: true, error: null });
    const router = useRouter();
    try {
      const response = await fetch(`/api/checkout/clear?userId=${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear checkout');
      set({ checkoutItems: [], isLoading: false });
      router.push('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear checkout';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },
  setError: (error) => set({ error }),
}));