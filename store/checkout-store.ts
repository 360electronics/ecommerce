'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { fetchWithRetry, logError, AppError } from './store-utils';
import { ProductImage } from '@/types/product';

interface CheckoutItem {
  [x: string]: any;
  userId: string;
  productId: string;
  variantId: string;
  cartOfferProductId: string;
  offerProduct: any;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  product: { shortName: string; brand: string; deliveryMode: string };
  variant: { name: string; ourPrice: number; mrp: number; productImages: ProductImage[] };
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
    cartOfferProductId?: string;
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
  fetchCheckoutItems: async (userId) => {
    try {
      const response = await fetch(`/api/checkout?userId=${userId}`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch checkout items');
      const data = await response.json();
      // console.log('Fetched checkout items:', data); // Log the API response
      set({ checkoutItems: data });
    } catch (error) {
      console.error('Error fetching checkout items:', error);
      set({ checkoutItems: [] }); // Ensure state is not corrupted
    }
  },
  addToCheckout: async (item) => {
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
      set({ isLoading: false }); // Ensure loading state is reset
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
    try {
      await fetchWithRetry(() => fetch(`/api/checkout/clear?userId=${userId}`, { method: 'DELETE' }));
      set({ checkoutItems: [], isLoading: false, lastFetched: Date.now() });
    } catch (error) {
      logError('clearCheckout', error);
      set({ error: error as AppError, isLoading: false });
    }
  },
  setError: (error) => set({ error }),
}));