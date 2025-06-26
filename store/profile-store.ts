// app/store/profile-store.ts
'use client';

import { create } from 'zustand';
import toast from 'react-hot-toast';

// Define interfaces (unchanged)
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
  id: string;
  referredUserId: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

interface Ticket {
  id: string;
  subject: string;
  status: 'open' | 'closed';
  createdAt: string;
}

interface ProfileState {
  profileData: {
    name?: string;
    email?: string;
    phoneNumber?: string;
    addresses?: Address[];
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
  loadingStates: Partial<Record<'profile' | 'orders' | 'referrals' | 'tickets', boolean>>;
  isRefetching: boolean;
  errors: Partial<Record<'profile' | 'orders' | 'referrals' | 'tickets', string>>;
  lastFetched: Partial<Record<'profile' | 'orders' | 'referrals' | 'tickets', number>>;
  fetchProfileData: (userId: string, force?: boolean) => Promise<void>;
  fetchOrders: (userId: string, force?: boolean) => Promise<void>;
  fetchReferrals: (userId: string, force?: boolean) => Promise<void>;
  fetchTickets: (userId: string, force?: boolean) => Promise<void>;
  refetch: (section: 'profile' | 'orders' | 'referrals' | 'tickets', userId: string, force?: boolean) => Promise<void>;
  shareCurrentPage: (section: string) => void;
  reset: () => void;
}

const INITIAL_STATE: ProfileState = {
  profileData: { name: '', email: '', phoneNumber: '', addresses: [] },
  orders: [],
  referrals: {
    referralLink: '',
    referrals: [],
    coupons: [],
    stats: { totalReferrals: 0, completedReferrals: 0, totalCoupons: 0, availableCoupons: 0 },
  },
  tickets: [],
  loadingStates: {},
  isRefetching: false,
  errors: {},
  lastFetched: {},
  fetchProfileData: async () => {},
  fetchOrders: async () => {},
  fetchReferrals: async () => {},
  fetchTickets: async () => {},
  refetch: async () => {},
  shareCurrentPage: () => {},
  reset: () => {},
};

// Fetch functions (unchanged)
const fetchProfile = async (userId: string) => {
  try {
    const response = await fetch(`/api/users/${userId}`, { credentials: 'include' });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `Failed to fetch profile: ${response.status}`);
    }
    const data = await response.json();
    
    // Log the response for debugging
    // console.log('API response:', JSON.stringify(data, null, 2));

    // Handle array response
    if (Array.isArray(data)) {
      if (data.length === 0) {
        throw new Error('User not found in API response array');
      }
      // Use the first user object in the array
      const user = data[0];
      const name = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.lastName || 'Guest';
      return {
        name,
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        addresses: Array.isArray(user.addresses) ? user.addresses : [],
      };
    }

    // Handle object response (for backward compatibility)
    if (!data.user) {
      console.error('API response does not contain user object:', data);
      throw new Error('User data not found in API response');
    }

    const name = data.user.firstName && data.user.lastName 
      ? `${data.user.firstName} ${data.user.lastName}`
      : data.user.firstName || data.user.lastName || 'Guest';

    return {
      name,
      email: data.user.email || '',
      phoneNumber: data.user.phoneNumber || '',
      addresses: Array.isArray(data.addresses) ? data.addresses : [],
    };
  } catch (error) {
    console.error('Fetch profile error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch profile');
  }
};

const fetchOrders = async (userId: string): Promise<Order[]> => {
  try {
    const response = await fetch(`/api/users/orders?userId=${userId}`, { credentials: 'include' });
    if (!response.ok) {
      if (response.status === 404) return [];
      const data = await response.json();
      throw new Error(data.error || `Error fetching orders: ${response.status}`);
    }
    const ordersData = await response.json();
    return Array.isArray(ordersData) ? ordersData : [];
  } catch (error) {
    console.error('Fetch orders error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch orders');
  }
};

const fetchTickets = async (userId: string): Promise<Ticket[]> => {
  try {
    const response = await fetch(`/api/tickets/${userId}`, { credentials: 'include' });
    if (!response.ok) {
      if (response.status === 404) return [];
      const data = await response.json();
      throw new Error(data.error || `Error fetching tickets: ${response.status}`);
    }
    const ticketsData = await response.json();
    return Array.isArray(ticketsData) ? ticketsData : [];
  } catch (error) {
    console.error('Fetch tickets error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch tickets');
  }
};

const fetchReferralsData = async (userId: string) => {
  try {
    const [referralLinkRes, referralsRes, couponsRes] = await Promise.all([
      fetch(`/api/referrals/link?userId=${userId}`, { credentials: 'include' }),
      fetch(`/api/referrals?userId=${userId}`, { credentials: 'include' }),
      fetch(`/api/coupons?userId=${userId}`, { credentials: 'include' }),
    ]);

    if (!referralLinkRes.ok) {
      const data = await referralLinkRes.json();
      throw new Error(data.error || `Error fetching referral link: ${referralLinkRes.status}`);
    }
    const linkData = await referralLinkRes.json();

    if (!referralsRes.ok) {
      const data = await referralsRes.json();
      throw new Error(data.error || `Error fetching referrals: ${referralsRes.status}`);
    }
    const referralsData = await referralsRes.json();

    if (!couponsRes.ok) {
      const data = await couponsRes.json();
      throw new Error(data.error || `Error fetching coupons: ${couponsRes.status}`);
    }
    const couponsData = await couponsRes.json();

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
    console.error('Fetch referrals error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch referrals');
  }
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  ...INITIAL_STATE,
  fetchProfileData: async (userId, force = false) => {
    const { profileData, lastFetched, loadingStates } = get();
    const now = Date.now();
    const cacheDuration = 5 * 60 * 1000; // 5 minutes
    if (!force && lastFetched.profile && now - lastFetched.profile < cacheDuration && profileData.email) {
      return;
    }
    try {
      set({ loadingStates: { ...loadingStates, profile: true }, errors: { ...get().errors, profile: undefined } });
      const data = await fetchProfile(userId);
      set({
        profileData: data,
        lastFetched: { ...lastFetched, profile: now },
        loadingStates: { ...loadingStates, profile: false },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch profile';
      set({
        errors: { ...get().errors, profile: message },
        loadingStates: { ...loadingStates, profile: false },
      });
      // toast.error(message);
    }
  },
  fetchOrders: async (userId, force = false) => {
    const { orders, lastFetched, loadingStates } = get();
    const now = Date.now();
    const cacheDuration = 5 * 60 * 1000;
    if (!force && lastFetched.orders && now - lastFetched.orders < cacheDuration && orders.length > 0) {
      return;
    }
    try {
      set({ loadingStates: { ...loadingStates, orders: true }, errors: { ...get().errors, orders: undefined } });
      const data = await fetchOrders(userId);
      set({
        orders: data,
        lastFetched: { ...lastFetched, orders: now },
        loadingStates: { ...loadingStates, orders: false },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch orders';
      set({
        errors: { ...get().errors, orders: message },
        loadingStates: { ...loadingStates, orders: false },
      });
      toast.error(message);
    }
  },
  fetchReferrals: async (userId, force = false) => {
    const { referrals, lastFetched, loadingStates } = get();
    const now = Date.now();
    const cacheDuration = 5 * 60 * 1000;
    if (
      !force &&
      lastFetched.referrals &&
      now - lastFetched.referrals < cacheDuration &&
      (referrals.referrals.length > 0 || referrals.coupons.length > 0)
    ) {
      return;
    }
    try {
      set({ loadingStates: { ...loadingStates, referrals: true }, errors: { ...get().errors, referrals: undefined } });
      const data = await fetchReferralsData(userId);
      set({
        referrals: data,
        lastFetched: { ...lastFetched, referrals: now },
        loadingStates: { ...loadingStates, referrals: false },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch referrals';
      set({
        errors: { ...get().errors, referrals: message },
        loadingStates: { ...loadingStates, referrals: false },
      });
      toast.error(message);
    }
  },
  fetchTickets: async (userId, force = false) => {
    const { tickets, lastFetched, loadingStates } = get();
    const now = Date.now();
    const cacheDuration = 5 * 60 * 1000;
    if (!force && lastFetched.tickets && now - lastFetched.tickets < cacheDuration && tickets.length > 0) {
      return;
    }
    try {
      set({ loadingStates: { ...loadingStates, tickets: true }, errors: { ...get().errors, tickets: undefined } });
      const data = await fetchTickets(userId);
      set({
        tickets: data,
        lastFetched: { ...lastFetched, tickets: now },
        loadingStates: { ...loadingStates, tickets: false },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tickets';
      set({
        errors: { ...get().errors, tickets: message },
        loadingStates: { ...loadingStates, tickets: false },
      });
      toast.error(message);
    }
  },
  refetch: async (section, userId, force = false) => {
    const { fetchProfileData, fetchOrders, fetchReferrals, fetchTickets } = get();
    set({ isRefetching: true });
    try {
      switch (section) {
        case 'profile':
          await fetchProfileData(userId, force);
          break;
        case 'orders':
          await fetchOrders(userId, force);
          break;
        case 'referrals':
          await fetchReferrals(userId, force);
          break;
        case 'tickets':
          await fetchTickets(userId, force);
          break;
      }
    } finally {
      set({ isRefetching: false });
    }
  },
  shareCurrentPage: (section) => {
    if (typeof window === 'undefined') {
      toast.error('Sharing is not available in this environment');
      return;
    }

    const url = new URL(window.location.origin);
    url.pathname = `/profile/${section}`;

    if (navigator.share) {
      navigator
        .share({
          title: `Profile - ${section}`,
          url: url.toString(),
        })
        .then(() => toast.success('Shared successfully!'))
        .catch((err) => {
          console.error('Share failed:', err);
          navigator.clipboard
            .writeText(url.toString())
            .then(() => toast.success('Link copied to clipboard!'))
            .catch((err) => {
              console.error('Clipboard write failed:', err);
              toast.error('Failed to copy link');
            });
        });
    } else {
      navigator.clipboard
        .writeText(url.toString())
        .then(() => toast.success('Link copied to clipboard!'))
        .catch((err) => {
          console.error('Clipboard write failed:', err);
          toast.error('Failed to copy link');
        });
    }
  },
}));