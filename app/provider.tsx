"use client";

import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { useHomeStore } from "@/store/home-store";
import { useProfileStore } from "@/store/profile-store";
import { logError } from "@/store/store-utils";
import { useWishlistStore } from "@/store/wishlist-store";
import { useEffect, useRef, type ReactNode } from "react";

export const refetchWishlist = async () => {
  const { isLoggedIn, user } = useAuthStore.getState();
  const { fetchWishlist } = useWishlistStore.getState();
  try {
    if (isLoggedIn && user?.id) {
      await fetchWishlist(true);
    }
  } catch (error) {
    logError("refetchWishlist", error);
  }
};

export const refetchCart = async () => {
  const { isLoggedIn, user } = useAuthStore.getState();
  const { fetchCart } = useCartStore.getState();
  try {
    if (isLoggedIn && user?.id) {
      await fetchCart();
      console.log("refetch success for cart");
    }
  } catch (error) {
    logError("refetchCart", error);
  }
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const abortControllerRef = useRef<AbortController | null>(null);
  const { fetchAuthStatus, isLoggedIn, user } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { fetchCheckoutItems } = useCheckoutStore();
  const { fetchHomeData } = useHomeStore();
  const { fetchProfileData, fetchOrders, fetchReferrals, fetchTickets } =
    useProfileStore();

  /**
   * 1. Always check auth on mount
   */
  useEffect(() => {
    abortControllerRef.current = new AbortController();

    const initAuth = async () => {
      try {
        await fetchAuthStatus();
      } catch (error) {
        logError("initAuth", error);
      }
    };

    initAuth();

    return () => {
      abortControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Only run once

  /**
   * 2. Only fetch user-related data once auth is resolved
   */
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    const controller = new AbortController();

    const initUserStores = async () => {
      try {
        const results = await Promise.allSettled([
          fetchCart(),
          fetchCheckoutItems(user.id),
          fetchProfileData(user.id, true, controller.signal),
          // fetchOrders(user.id, true, controller.signal),
          // fetchReferrals(user.id, true, controller.signal),
          // fetchTickets(user.id, true, controller.signal),
          // wishlist intentionally excluded — call with refetchWishlist() manually
        ]);

        results.forEach((res, i) => {
          if (res.status === "rejected") {
            logError(`userStore[${i}]`, res.reason);
          }
        });
      } catch (error) {
        logError("initUserStores", error);
      }
    };

    initUserStores();

    return () => controller.abort();
  }, [
    isLoggedIn,
    user?.id,
    fetchCart,
    fetchCheckoutItems,
    fetchProfileData,
    // fetchOrders,
    // fetchReferrals,
    // fetchTickets,
  ]);

  /**
   * 3. Fetch home data only on homepage
   */
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      fetchHomeData();
    }
  }, []);

  return <>{children}</>;
};
