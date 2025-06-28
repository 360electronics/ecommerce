'use client';

import { create } from 'zustand';
import { produce } from 'immer';
import { fetchWithRetry, logError, AppError } from './store-utils';

interface Address {
  id: string;
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: 'home' | 'work' | 'other';
}

interface Coupon {
  createdAt(createdAt: any): unknown;
  id: string;
  code: string;
  isUsed: boolean;
  expiryDate: string;
  discount: number;
}

interface Order {
  id: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: Array<{ productId: string; variantId: string; quantity: number }>;
}

interface Referral {
  couponGenerated: any;
  id: string;
  referredUserId: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

interface Ticket {
  id: string;
  type: string;
  issueDesc: string;
  status: 'active' | 'inactive' | 'resolved';
  createdAt: string;
  replies: Array<{ id: string; sender: 'user' | 'support'; message: string; createdAt: string }>;
}

interface ProfileState {
  profileData: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    addresses?: Address[];
  };
  orders: Order[];
  referrals: {
    referralLink: string;
    referrals: Referral[];
    coupons: Coupon[];
    stats: { totalReferrals: number; completedReferrals: number; totalCoupons: number; availableCoupons: number };
  };
  tickets: Ticket[];
  loadingStates: Partial<Record<'profile' | 'orders' | 'referrals' | 'tickets', boolean>>;
  isRefetching: boolean;
  errors: Partial<Record<'profile' | 'orders' | 'referrals' | 'tickets', AppError>>;
  lastFetched: Partial<Record<'profile' | 'orders' | 'referrals' | 'tickets', number>>;
  fetchProfileData: (userId: string, force?: boolean, signal?: AbortSignal) => Promise<void>;
  fetchOrders: (userId: string, force?: boolean, signal?: AbortSignal) => Promise<void>;
  fetchReferrals: (userId: string, force?: boolean, signal?: AbortSignal) => Promise<void>;
  fetchTickets: (userId: string, force?: boolean, signal?: AbortSignal) => Promise<void>;
  fetchAll: (userId: string, force?: boolean, signal?: AbortSignal) => Promise<void>;
  refetch: (section: 'profile' | 'orders' | 'referrals' | 'tickets', userId: string, force?: boolean, signal?: AbortSignal) => Promise<void>;
  shareCurrentPage: (section: string) => void;
  reset: () => void;
}

const INITIAL_STATE: ProfileState = {
  profileData: { firstName: null, lastName: null, email: null, phoneNumber: null, addresses: [] },
  orders: [],
  referrals: { referralLink: '', referrals: [], coupons: [], stats: { totalReferrals: 0, completedReferrals: 0, totalCoupons: 0, availableCoupons: 0 } },
  tickets: [],
  loadingStates: {},
  isRefetching: false,
  errors: {},
  lastFetched: {},
  fetchProfileData: async () => {},
  fetchOrders: async () => {},
  fetchReferrals: async () => {},
  fetchTickets: async () => {},
  fetchAll: async () => {},
  refetch: async () => {},
  shareCurrentPage: () => {},
  reset: () => {},
};

const fetchProfile = async (userId: string, signal?: AbortSignal) => {
  const data = await fetchWithRetry<{ user: ProfileState['profileData'] }>(() =>
    fetch(`/api/users/${userId}`, { credentials: 'include', signal })
  );
  return data.user || { firstName: null, lastName: null, email: null, phoneNumber: null, addresses: [] };
};

const fetchOrders = async (userId: string, signal?: AbortSignal) => {
  const data = await fetchWithRetry<Order[]>(() =>
    fetch(`/api/users/orders?userId=${userId}`, { credentials: 'include', signal })
  );
  return Array.isArray(data) ? data : [];
};

const fetchTickets = async (userId: string, signal?: AbortSignal) => {
  const data = await fetchWithRetry<Ticket[]>(() =>
    fetch(`/api/tickets/${userId}`, { credentials: 'include', signal })
  );
  return Array.isArray(data) ? data : [];
};

const fetchReferralsData = async (userId: string, signal?: AbortSignal) => {
  const [referralLink, referrals, coupons] = await Promise.all([
    fetchWithRetry<{ referralLink: string }>(() =>
      fetch(`/api/referrals/link?userId=${userId}`, { credentials: 'include', signal })
    ),
    fetchWithRetry<Referral[]>(() => fetch(`/api/referrals?userId=${userId}`, { credentials: 'include', signal })),
    fetchWithRetry<Coupon[]>(() => fetch(`/api/coupons?userId=${userId}`, { credentials: 'include', signal })),
  ]);

  const parsed = {
    referralLink: referralLink.referralLink || '',
    referrals: Array.isArray(referrals) ? referrals : [],
    coupons: Array.isArray(coupons) ? coupons : [],
  };
  const completedReferrals = parsed.referrals.filter((r) => r.status === 'completed').length;
  const availableCoupons = parsed.coupons.filter((c) => !c.isUsed && new Date(c.expiryDate) > new Date()).length;

  return {
    referralLink: parsed.referralLink,
    referrals: parsed.referrals,
    coupons: parsed.coupons,
    stats: {
      totalReferrals: parsed.referrals.length,
      completedReferrals,
      totalCoupons: parsed.coupons.length,
      availableCoupons,
    },
  };
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  ...INITIAL_STATE,
  fetchProfileData: async (userId, force = false, signal) => {
    const cacheDuration = 10 * 60 * 1000;
    const lastFetchedProfile = get().lastFetched.profile;
    if (lastFetchedProfile && Date.now() - lastFetchedProfile < cacheDuration) return;

    try {
      set(
        produce((state) => {
          state.loadingStates.profile = true;
          state.errors.profile = undefined;
        })
      );
      const data = await fetchProfile(userId, signal);
      set(
        produce((state) => {
          state.profileData = data;
          state.lastFetched.profile = Date.now();
          state.loadingStates.profile = false;
        })
      );
    } catch (error) {
      logError('fetchProfileData', error);
      set(
        produce((state) => {
          state.errors.profile = error as AppError;
          state.loadingStates.profile = false;
        })
      );
    }
  },
  fetchOrders: async (userId, force = false, signal) => {
    const cacheDuration = 10 * 60 * 1000;
    const lastFetchedOrders = get().lastFetched.orders;
    if (lastFetchedOrders && Date.now() - lastFetchedOrders < cacheDuration) return;

    try {
      set(
        produce((state) => {
          state.loadingStates.orders = true;
          state.errors.orders = undefined;
        })
      );
      const data = await fetchOrders(userId, signal);
      set(
        produce((state) => {
          state.orders = data;
          state.lastFetched.orders = Date.now();
          state.loadingStates.orders = false;
        })
      );
    } catch (error) {
      logError('fetchOrders', error);
      set(
        produce((state) => {
          state.errors.orders = error as AppError;
          state.loadingStates.orders = false;
        })
      );
    }
  },
  fetchReferrals: async (userId, force = false, signal) => {
    const cacheDuration = 10 * 60 * 1000;
    const lastFetchedReferrals = get().lastFetched.referrals;
    if (lastFetchedReferrals && Date.now() - lastFetchedReferrals < cacheDuration) return;

    try {
      set(
        produce((state) => {
          state.loadingStates.referrals = true;
          state.errors.referrals = undefined;
        })
      );
      const data = await fetchReferralsData(userId, signal);
      set(
        produce((state) => {
          state.referrals = data;
          state.lastFetched.referrals = Date.now();
          state.loadingStates.referrals = false;
        })
      );
    } catch (error) {
      logError('fetchReferrals', error);
      set(
        produce((state) => {
          state.errors.referrals = error as AppError;
          state.loadingStates.referrals = false;
        })
      );
    }
  },
  fetchTickets: async (userId, force = false, signal) => {
    const cacheDuration = 10 * 60 * 1000;
    const lastFetchedTickets = get().lastFetched.tickets;
    if (lastFetchedTickets && Date.now() - lastFetchedTickets < cacheDuration) return;

    try {
      set(
        produce((state) => {
          state.loadingStates.tickets = true;
          state.errors.tickets = undefined;
        })
      );
      const data = await fetchTickets(userId, signal);
      set(
        produce((state) => {
          state.tickets = data;
          state.lastFetched.tickets = Date.now();
          state.loadingStates.tickets = false;
        })
      );
    } catch (error) {
      logError('fetchTickets', error);
      set(
        produce((state) => {
          state.errors.tickets = error as AppError;
          state.loadingStates.tickets = false;
        })
      );
    }
  },
  fetchAll: async (userId, force = false, signal) => {
    set({ isRefetching: true });
    try {
      const results = await Promise.allSettled([
        get().fetchProfileData(userId, force, signal),
        get().fetchOrders(userId, force, signal),
        get().fetchReferrals(userId, force, signal),
        get().fetchTickets(userId, force, signal),
      ]);

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          logError(`fetchAll[${index}]`, result.reason);
        }
      });
    } finally {
      set({ isRefetching: false });
    }
  },
  refetch: async (section, userId, force = false, signal) => {
    set({ isRefetching: true });
    try {
      const methodName = `fetch${section.charAt(0).toUpperCase() + section.slice(1)}Data` as keyof ProfileState;
      const method = get()[methodName];
      if (typeof method === 'function') {
        await (method as any)(section, userId, force, signal);
      } else {
        throw new Error(`Method ${methodName} not found`);
      }
    } finally {
      set({ isRefetching: false });
    }
  },
  shareCurrentPage: (section) => {
    if (typeof window === 'undefined') {
      logError('shareCurrentPage', new Error('Sharing not available in this environment'));
      return;
    }

    const url = new URL(window.location.origin);
    url.pathname = `/profile/${section}`;
    const shareData = {
      title: `My Profile - ${section.charAt(0).toUpperCase() + section.slice(1)}`,
      text: `Check out my ${section} on this site!`,
      url: url.toString(),
    };

    if (navigator.share) {
      navigator.share(shareData).catch((error) => logError('shareCurrentPage', error));
    } else {
      navigator.clipboard.writeText(url.toString()).catch((error) => logError('shareCurrentPage', error));
    }
  },
  reset: () => set(INITIAL_STATE),
}));