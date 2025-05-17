// store/profile-store.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import toast from 'react-hot-toast';
import { Address, Coupon, Order, Referral, Ticket } from './types';

interface ProfileState {
  profileData: {
    name: string;
    email: string;
    phoneNumber: string;
    addresses: Address[];
  };
  orders: Order[];
  referrals: {
    referralLink: string;
    referrals: Referral[];
    coupons: Coupon[];
    stats: {
      totalReferrals: number;
      completedReferrals: number;
      totalCoupons: number;
      availableCoupons: number;
    };
  };
  tickets: Ticket[];
  isLoading: boolean;
  isRefetching: boolean;
  errors: Partial<Record<'profile' | 'orders' | 'referrals' | 'tickets', string>>;
  lastFetched: Partial<Record<'profile' | 'orders' | 'referrals' | 'tickets', number>>;
  fetchProfileData: (userId: string) => Promise<void>;
  fetchOrders: (userId: string) => Promise<void>;
  fetchReferrals: (userId: string) => Promise<void>;
  fetchTickets: (userId: string) => Promise<void>;
  refetch: (section: 'profile' | 'orders' | 'referrals' | 'tickets', userId: string, force?: boolean) => Promise<void>;
  shareCurrentPage: (section: string) => void;
  reset: () => void;
}

const fetchProfile = async (userId: string) => {
  try {
    const response = await fetch(`/api/users/${userId}`, { credentials: 'include' });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to fetch profile');
    }
    const data = await response.json();
    return {
      name: data.user.firstName || '',
      email: data.user.email || '',
      phoneNumber: data.user.phoneNumber || '',
      addresses: data.addresses || [],
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch profile');
  }
};

const fetchOrders = async (userId: string): Promise<Order[]> => {
  try {
    const response = await fetch(`/api/users/orders?userId=${userId}`, { credentials: 'include' });
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Error fetching orders: ${response.status}`);
    }
    const ordersData = await response.json();
    return Array.isArray(ordersData) ? ordersData : [];
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch orders');
  }
};

const fetchTickets = async (userId: string): Promise<Ticket[]> => {
  try {
    const response = await fetch(`/api/tickets/${userId}`, { credentials: 'include' });
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Error fetching tickets: ${response.status}`);
    }
    const ticketsData = await response.json();
    return Array.isArray(ticketsData) ? ticketsData : [];
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tickets');
  }
};

const fetchReferralsData = async (userId: string) => {
  try {
    const referralLinkRes = await fetch(`/api/referrals/link?userId=${userId}`, { credentials: 'include' });
    if (!referralLinkRes.ok) {
      throw new Error(`Error fetching referral link: ${referralLinkRes.status}`);
    }
    const linkData = await referralLinkRes.json();

    const referralsRes = await fetch(`/api/referrals?userId=${userId}`, { credentials: 'include' });
    const referralsData = await referralsRes.json();
    if (!referralsRes.ok) {
      throw new Error(`Error fetching referrals: ${referralsRes.status}`);
    }

    const couponsRes = await fetch(`/api/coupons?userId=${userId}`, { credentials: 'include' });
    const couponsData = await couponsRes.json();
    if (!couponsRes.ok) {
      throw new Error(`Error fetching coupons: ${couponsRes.status}`);
    }

    const completedReferrals = Array.isArray(referralsData)
      ? referralsData.filter((r: Referral) => r.status === 'completed').length
      : 0;
    const availableCoupons = Array.isArray(couponsData)
      ? couponsData.filter((c: Coupon) => !c.isUsed && new Date(c.expiryDate) > new Date()).length
      : 0;

    return {
      referralLink: linkData.referralLink || '',
      referrals: Array.isArray(referralsData) ? referralsData : [],
      coupons: Array.isArray(couponsData) ? couponsData : [],
      stats: {
        totalReferrals: Array.isArray(referralsData) ? referralsData.length : 0,
        completedReferrals,
        totalCoupons: Array.isArray(couponsData) ? couponsData.length : 0,
        availableCoupons,
      },
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch referrals');
  }
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profileData: {
        name: '',
        email: '',
        phoneNumber: '',
        addresses: [],
      },
      orders: [],
      referrals: {
        referralLink: '',
        referrals: [],
        coupons: [],
        stats: {
          totalReferrals: 0,
          completedReferrals: 0,
          totalCoupons: 0,
          availableCoupons: 0,
        },
      },
      tickets: [],
      isLoading: false,
      isRefetching: false,
      errors: {},
      lastFetched: {},
      fetchProfileData: async (userId) => {
        const { lastFetched, profileData } = get();
        const now = Date.now();
        const cacheDuration = 5 * 60 * 1000; // 5 minutes
        if (lastFetched.profile && now - lastFetched.profile < cacheDuration && profileData.name) {
          return;
        }
        try {
          set({ isLoading: true, errors: { ...get().errors, profile: undefined } });
          const data = await fetchProfile(userId);
          set({
            profileData: data,
            lastFetched: { ...lastFetched, profile: now },
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch profile';
          set({
            errors: { ...get().errors, profile: message },
            isLoading: false,
          });
          toast.error(message);
        }
      },
      fetchOrders: async (userId) => {
        const { lastFetched, orders } = get();
        const now = Date.now();
        const cacheDuration = 5 * 60 * 1000; // 5 minutes
        if (lastFetched.orders && now - lastFetched.orders < cacheDuration && orders.length > 0) {
          return;
        }
        try {
          set({ isLoading: true, errors: { ...get().errors, orders: undefined } });
          const data = await fetchOrders(userId);
          set({
            orders: data,
            lastFetched: { ...lastFetched, orders: now },
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch orders';
          set({
            errors: { ...get().errors, orders: message },
            isLoading: false,
          });
          toast.error(message);
        }
      },
      fetchReferrals: async (userId) => {
        const { lastFetched, referrals } = get();
        const now = Date.now();
        const cacheDuration = 5 * 60 * 1000; // 5 minutes
        if (
          lastFetched.referrals &&
          now - lastFetched.referrals < cacheDuration &&
          (referrals.referrals.length > 0 || referrals.coupons.length > 0)
        ) {
          return;
        }
        try {
          set({ isLoading: true, errors: { ...get().errors, referrals: undefined } });
          const data = await fetchReferralsData(userId);
          set({
            referrals: data,
            lastFetched: { ...lastFetched, referrals: now },
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch referrals';
          set({
            errors: { ...get().errors, referrals: message },
            isLoading: false,
          });
          toast.error(message);
        }
      },
      fetchTickets: async (userId) => {
        const { lastFetched, tickets } = get();
        const now = Date.now();
        const cacheDuration = 5 * 60 * 1000; // 5 minutes
        if (lastFetched.tickets && now - lastFetched.tickets < cacheDuration && tickets.length > 0) {
          return;
        }
        try {
          set({ isLoading: true, errors: { ...get().errors, tickets: undefined } });
          const data = await fetchTickets(userId);
          set({
            tickets: data,
            lastFetched: { ...lastFetched, tickets: now },
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch tickets';
          set({
            errors: { ...get().errors, tickets: message },
            isLoading: false,
          });
          toast.error(message);
        }
      },
      refetch: async (section, userId, force = false) => {
        const { lastFetched, fetchProfileData, fetchOrders, fetchReferrals, fetchTickets } = get();
        const now = Date.now();
        const cacheDuration = 5 * 60 * 1000; // 5 minutes
        set({ isRefetching: true });

        try {
          switch (section) {
            case 'profile':
              if (force || !lastFetched.profile || now - (lastFetched.profile || 0) >= cacheDuration) {
                await fetchProfileData(userId);
              }
              break;
            case 'orders':
              if (force || !lastFetched.orders || now - (lastFetched.orders || 0) >= cacheDuration) {
                await fetchOrders(userId);
              }
              break;
            case 'referrals':
              if (force || !lastFetched.referrals || now - (lastFetched.referrals || 0) >= cacheDuration) {
                await fetchReferrals(userId);
              }
              break;
            case 'tickets':
              if (force || !lastFetched.tickets || now - (lastFetched.tickets || 0) >= cacheDuration) {
                await fetchTickets(userId);
              }
              break;
          }
        } finally {
          set({ isRefetching: false });
        }
      },
      shareCurrentPage: (section) => {
        const url = new URL(window.location.href);
        url.pathname = `/profile/${section}`;
        navigator.clipboard.writeText(url.toString())
          .then(() => {
            toast.success('Link copied to clipboard!');
          })
          .catch((err) => {
            console.error('Failed to copy URL:', err);
            const textArea = document.createElement('textarea');
            textArea.value = url.toString();
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            toast.success('Link copied to clipboard!');
          });
      },
      reset: () => {
        set({
          profileData: { name: '', email: '', phoneNumber: '', addresses: [] },
          orders: [],
          referrals: {
            referralLink: '',
            referrals: [],
            coupons: [],
            stats: { totalReferrals: 0, completedReferrals: 0, totalCoupons: 0, availableCoupons: 0 },
          },
          tickets: [],
          isLoading: false,
          isRefetching: false,
          errors: {},
          lastFetched: {},
        });
      },
    }),
    {
      name: 'profile-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profileData: state.profileData,
        orders: state.orders,
        referrals: state.referrals,
        tickets: state.tickets,
        lastFetched: state.lastFetched,
      }),
    }
  )
);


// store/profile-store.ts (useProfileInitializer)
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export const useProfileInitializer = (section: 'profile' | 'orders' | 'referrals' | 'tickets') => {
  const { user, isLoading: authLoading, isLoggedIn } = useAuthStore();
  const { fetchProfileData, refetch, orders, referrals, tickets } = useProfileStore();

  useEffect(() => {
    if (authLoading || !isLoggedIn || !user?.id) {
      return; // Wait until auth is resolved
    }

    // Fetch profile data for 'profile' section
    if (section === 'profile') {
      fetchProfileData(user.id);
    }

    // Force refetch if section data is empty
    const isSectionEmpty:any = {
      orders: orders.length === 0,
      referrals: referrals.referrals.length === 0 && referrals.coupons.length === 0,
      tickets: tickets.length === 0,
    };

    refetch(section, user.id, isSectionEmpty[section]);
  }, [authLoading, isLoggedIn, user?.id, section, fetchProfileData, refetch, orders, referrals, tickets]);
};