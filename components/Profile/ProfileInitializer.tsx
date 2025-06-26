'use client';

import { useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useProfileStore } from '@/store/profile-store';

export const useProfileInitializer = () => {
  const { user, isLoading: authLoading, isLoggedIn } = useAuthStore();
  const { profileData, orders, referrals, tickets, fetchProfileData, fetchOrders, fetchReferrals, fetchTickets } = useProfileStore();

  // Check if sections have data
  const hasData = useMemo(
    () => ({
      profile: !!profileData.email,
      orders: orders.length > 0,
      referrals: referrals.referrals.length > 0 || referrals.coupons.length > 0,
      tickets: tickets.length > 0,
    }),
    [profileData.email, orders.length, referrals.referrals.length, referrals.coupons.length, tickets.length]
  );

  useEffect(() => {
    if (authLoading || !isLoggedIn || !user?.id) {
      return;
    }

    const abortController = new AbortController();

    // Fetch only if data is missing
    if (!hasData.profile) {
      fetchProfileData(user.id);
    }
    if (!hasData.orders) {
      fetchOrders(user.id);
    }
    if (!hasData.referrals) {
      fetchReferrals(user.id);
    }
    if (!hasData.tickets) {
      fetchTickets(user.id);
    }

    return () => {
      abortController.abort();
    };
  }, [authLoading, isLoggedIn, user?.id, hasData, fetchProfileData, fetchOrders, fetchReferrals, fetchTickets]);
};