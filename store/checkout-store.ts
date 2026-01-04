"use client";

import { create } from "zustand";
import { fetchWithRetry, logError, AppError } from "./store-utils";

interface CheckoutItem {
  id: string;
  productId: string;
  variantId: string;
  cartOfferProductId?: string;
  quantity: number;
  totalPrice: number;
  product: any;
  variant: any;
  offerProduct?: any;
  offerProductPrice?: string;
}

interface CheckoutState {
  checkoutItems: CheckoutItem[];
  checkoutSessionId: string | null;
  isLoading: boolean;
  error: AppError | null;
  lastFetched: number | null;

  fetchCheckoutItems: (userId: string) => Promise<void>;
  addToCheckout: (item: {
    userId: string;
    productId: string;
    variantId: string;
    quantity: number;
    totalPrice: number;
    cartOfferProductId?: string;
  }) => Promise<void>;
  syncCheckout: (userId: string, items: any[]) => Promise<void>;
  removeFromCheckout: (id: string, userId: string) => Promise<void>;
  clearCheckout: (userId: string) => Promise<void>;
  setError: (error: AppError | null) => void;
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  checkoutItems: [],
  checkoutSessionId: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  /* 🔒 Ensure checkout session always exists */
  async fetchCheckoutItems(userId) {
    try {
      set({ isLoading: true });

      // 🔥 FETCH ONLY — do NOT create
      const sessionRes = await fetch(`/api/checkout/session?userId=${userId}`);
      const session = await sessionRes.json();

      if (!session) {
        // No session → user came directly → bounce
        set({ checkoutItems: [] });
        return;
      }

      set({ checkoutSessionId: session.id });

      const res = await fetch(`/api/checkout?userId=${userId}`);
      const data = await res.json();

      set({
        checkoutItems: data,
        isLoading: false,
      });
    } catch {
      set({ checkoutItems: [], isLoading: false });
    }
  },

  /* Used only if UI directly adds single item */
  async addToCheckout(item) {
    try {
      set({ isLoading: true });

      await fetchWithRetry(() =>
        fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        })
      );

      await get().fetchCheckoutItems(item.userId);
    } catch (error) {
      logError("addToCheckout", error);
      set({ error: error as AppError });
    } finally {
      set({ isLoading: false });
    }
  },

  /* ✅ THIS IS WHAT CartPage USES */
  async syncCheckout(userId, items) {
    try {
      set({ isLoading: true });

      // Ensure session
      const sessionRes = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!sessionRes.ok) {
        throw new Error("Failed to create checkout session");
      }

      const session = await sessionRes.json();
      set({ checkoutSessionId: session.id });

      // Add all items (backend enforces uniqueness)
      for (const item of items) {
        await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            ...item,
          }),
        });
      }

      // Fetch final checkout
      await get().fetchCheckoutItems(userId);
    } catch (error) {
      logError("syncCheckout", error);
      set({ error: error as AppError });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  async removeFromCheckout(id, userId) {
    try {
      set({ isLoading: true });

      await fetchWithRetry(() =>
        fetch(`/api/checkout?id=${id}&userId=${userId}`, {
          method: "DELETE",
        })
      );

      await get().fetchCheckoutItems(userId);
    } catch (error) {
      logError("removeFromCheckout", error);
      set({ error: error as AppError });
    } finally {
      set({ isLoading: false });
    }
  },

  async clearCheckout(userId) {
    try {
      await fetch(`/api/checkout/session?userId=${userId}`, {
        method: "DELETE",
      });

      set({
        checkoutItems: [],
        checkoutSessionId: null,
      });
    } catch (error) {
      logError("clearCheckout", error);
      set({ error: error as AppError });
    }
  },

  setError(error) {
    set({ error });
  },
}));
