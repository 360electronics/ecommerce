'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { useRouter } from 'next/navigation';
import { fetchWithRetry, logError, AppError } from './store-utils';

interface CheckoutItem {
  userId: string;
  productId: string;
  variantId: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  product: { shortName: string; brand: string; deliveryMode: string };
  variant: { name: string; ourPrice: number; mrp: number; productImages: string[] };
}

interface CheckoutState {
  checkoutItems: CheckoutItem[];
  isLoading: boolean;
  error: AppError | null;
  lastFetched: number | null;
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
  setError: (error: AppError | null) => void;
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  checkoutItems: [],
  isLoading: false,
  error: null,
  lastFetched: null,
  fetchCheckoutItems: async (userId: string) => {
    const cacheDuration = 10 * 60 * 1000; // 10 minutes
    const lastFetched = get().lastFetched;
    if (lastFetched && Date.now() - lastFetched < cacheDuration) return;
    
    try {
      set({ isLoading: true, error: null });
      const data = await fetchWithRetry<CheckoutItem[]>(() => fetch(`/api/checkout?userId=${userId}`));
      set({ checkoutItems: Array.isArray(data) ? data : [], isLoading: false, lastFetched: Date.now() });
    } catch (error) {
      logError('fetchCheckoutItems', error);
      set({ error: error as AppError, isLoading: false });
    }
  },
  addToCheckout: async (item) => {
    const router = useRouter();
    const optimisticItem = { ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    set(
      produce((state: CheckoutState) => {
        state.checkoutItems.push(optimisticItem as CheckoutItem);
        state.isLoading = true;
      })
    );

    try {
      await fetchWithRetry(() =>
        fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        })
      );
      await get().fetchCheckoutItems(item.userId);
      router.push('/checkout');
    } catch (error) {
      logError('addToCheckout', error);
      set(
        produce((state: CheckoutState) => {
          state.checkoutItems = state.checkoutItems.filter((i) => i.variantId !== item.variantId);
          state.error = error as AppError;
          state.isLoading = false;
        })
      );
    }
  },
  removeFromCheckout: async (id: string, userId: string) => {
    const currentItems = get().checkoutItems;
    set(
      produce((state: CheckoutState) => {
        state.checkoutItems = state.checkoutItems.filter((item) => item.variantId !== id);
        state.isLoading = true;
      })
    );

    try {
      await fetchWithRetry(() => fetch(`/api/checkout?id=${id}&userId=${userId}`, { method: 'DELETE' }));
      set({ isLoading: false });
    } catch (error) {
      logError('removeFromCheckout', error);
      set({ checkoutItems: currentItems, error: error as AppError, isLoading: false });
    }
  },
  clearCheckout: async (userId: string) => {
    const router = useRouter();
    try {
      await fetchWithRetry(() => fetch(`/api/checkout/clear?userId=${userId}`, { method: 'DELETE' }));
      set({ checkoutItems: [], isLoading: false, lastFetched: Date.now() });
      router.push('/');
    } catch (error) {
      logError('clearCheckout', error);
      set({ error: error as AppError, isLoading: false });
    }
  },
  setError: (error) => set({ error }),
}));