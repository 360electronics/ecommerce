'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';
import { useSearchParams } from 'next/navigation';
import { Variant } from '@/types/product';

type Tab = 'profile' | 'orders' | 'wishlist' | 'referrals' | 'help';

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

interface Order {
  id: string;
  userId: string;
  addressId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string | null;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cod' | 'razorpay';
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: string;
  product: Product | null;
  variant: Variant;
  unitPrice: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  brand: string;
  color: string | null;
  mrp: string;
  ourPrice: string | null;
  storage: string | null;
  status: 'active' | 'inactive';
  subProductStatus: 'active' | 'inactive';
  totalStocks: string;
  deliveryMode: 'standard' | 'express';
  productImages: string[];
  sku: string;
  weight: string | null;
  dimensions: string | null;
  material: string | null;
  tags: string;
  averageRating: string;
  ratingCount: string;
  createdAt: string;
  updatedAt: string;
}

interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  variantId: string;
  createdAt: string;
  variant: Variant;
  product: Product | null;
}

interface Referral {
  id: string;
  referredEmail: string;
  status: 'pending' | 'completed';
  signupDate: string;
  couponGenerated?: boolean;
}

interface Coupon {
  id: string;
  code: string;
  amount: number;
  isUsed: boolean;
  expiryDate: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  type: string;
  issueDesc: string;
  status: 'active' | 'inactive' | 'resolved';
  createdAt: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  sender: 'user' | 'support';
  message: string;
  createdAt: string;
}

interface ProfileContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  profileData: {
    name: string;
    email: string;
    phoneNumber: string;
    addresses: Address[];
  };
  orders: Order[];
  wishlistItems: WishlistItem[];
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
  error: string | null;
  refetch: () => void;
  isRefetching: boolean;
  shareCurrentTab: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
}

const fetchOrders = async (userId: string): Promise<Order[]> => {
  try {
    const response = await fetch(`/api/users/orders?userId=${userId}`);
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Error fetching orders: ${response.status}`);
    }
    const ordersData = await response.json();
    console.log("My Order are :", ordersData)
    return Array.isArray(ordersData) ? ordersData : [];
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
};

const fetchWishlist = async (userId: string): Promise<WishlistItem[]> => {
  try {
    const response = await fetch(`/api/users/wishlist?userId=${userId}`);
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Error fetching wishlist: ${response.status}`);
    }
    const wishlistData = await response.json();
    console.log("Profile Wishlist:",wishlistData)
    return Array.isArray(wishlistData) ? wishlistData : [];
  } catch (error) {
    console.error('Failed to fetch wishlist:', error);
    return [];
  }
};

const fetchTickets = async (userId: string): Promise<Ticket[]> => {
  try {
    const response = await fetch(`/api/tickets/${userId}`);
    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Error fetching tickets: ${response.status}`);
    }
    const ticketsData = await response.json();
    return Array.isArray(ticketsData) ? ticketsData : [];
  } catch (error) {
    console.error('Failed to fetch tickets:', error);
    return [];
  }
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const searchParams = useSearchParams();
  
  // Initialize with the tab from URL or default to 'profile'
  const tabParam = searchParams?.get('tab') as Tab | null;
  const initialTab: Tab = tabParam && ['profile', 'orders', 'wishlist', 'referrals', 'help'].includes(tabParam) 
    ? tabParam as Tab 
    : 'profile';
    
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    addresses: [],
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [referrals, setReferrals] = useState<{
    referralLink: string;
    referrals: Referral[];
    coupons: Coupon[];
    stats: {
      totalReferrals: number;
      completedReferrals: number;
      totalCoupons: number;
      availableCoupons: number;
    };
  }>({
    referralLink: '',
    referrals: [],
    coupons: [],
    stats: {
      totalReferrals: 0,
      completedReferrals: 0,
      totalCoupons: 0,
      availableCoupons: 0,
    },
  });
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to share the current tab
  const shareCurrentTab = () => {
    // Create shareable URL with current tab
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    
    // Copy to clipboard
    navigator.clipboard.writeText(url.toString())
      .then(() => {
        // You could implement a toast notification here
        alert('Link copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy URL: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url.toString();
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
      });
  };

  const fetchAllData = useCallback(async () => {
    if (authLoading || !isLoggedIn || !user?.id) return;

    const isInitialLoad = !profileData.email;
    
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsRefetching(true);
    }
    
    setError(null);

    try {
      const profileRes = await fetch(`/api/users/${user.id}`);
      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.error || 'Failed to fetch profile');

      setProfileData({
        name: profileData.user.firstName || '',
        email: profileData.user.email || '',
        phoneNumber: profileData.user.phoneNumber || '',
        addresses: profileData.addresses || [],
      });

      // Only fetch data for the active tab to improve performance
      const activeTabPromises = [];
      let ordersData: Order[] = [];
      let wishlistData: WishlistItem[] = [];
      let ticketsData: Ticket[] = [];
      
      // Always fetch basic profile data
      if (activeTab === 'orders' || isInitialLoad) {
        activeTabPromises.push(fetchOrders(user.id).then(data => { ordersData = data; }));
      }
      
      if (activeTab === 'wishlist' || isInitialLoad) {
        activeTabPromises.push(fetchWishlist(user.id).then(data => { wishlistData = data; }));
      }
      
      if (activeTab === 'help' || isInitialLoad) {
        activeTabPromises.push(fetchTickets(user.id).then(data => { ticketsData = data; }));
      }
      
      await Promise.all(activeTabPromises);
      
      // Only update state for fetched data
      if (activeTab === 'orders' || isInitialLoad) setOrders(ordersData);
      if (activeTab === 'wishlist' || isInitialLoad) setWishlistItems(wishlistData);
      if (activeTab === 'help' || isInitialLoad) setTickets(ticketsData);

      // Referrals are handled separately because of multiple API calls
      if (activeTab === 'referrals' || isInitialLoad) {
        try {
          const referralLinkRes = await fetch(`/api/refferals/link?userId=${user.id}`);
          if (!referralLinkRes.ok) {
            throw new Error(`Error fetching referral link: ${referralLinkRes.status}`);
          }
          const linkData = await referralLinkRes.json();

          const referralsRes = await fetch(`/api/refferals?userId=${user.id}`);
          const referralsData = await referralsRes.json();
          if (!referralsRes.ok && referralsRes.status !== 200) {
            throw new Error(`Error fetching referrals: ${referralsRes.status}`);
          }

          const couponsRes = await fetch(`/api/coupons?userId=${user.id}`);
          const couponsData = await couponsRes.json();
          if (!couponsRes.ok && couponsRes.status !== 200) {
            throw new Error(`Error fetching coupons: ${couponsRes.status}`);
          }

          const completedReferrals = Array.isArray(referralsData)
            ? referralsData.filter((r: Referral) => r.status === 'completed').length
            : 0;
          const availableCoupons = Array.isArray(couponsData)
            ? couponsData.filter((c: Coupon) => !c.isUsed && new Date(c.expiryDate) > new Date()).length
            : 0;

          setReferrals({
            referralLink: linkData.referralLink || '',
            referrals: Array.isArray(referralsData) ? referralsData : [],
            coupons: Array.isArray(couponsData) ? couponsData : [],
            stats: {
              totalReferrals: Array.isArray(referralsData) ? referralsData.length : 0,
              completedReferrals: completedReferrals,
              totalCoupons: Array.isArray(couponsData) ? couponsData.length : 0,
              availableCoupons,
            },
          });
        } catch (referralError) {
          console.error('Error fetching referral data:', referralError);
          // Don't fail the entire fetch process for referral data
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [user?.id, authLoading, isLoggedIn, activeTab, profileData.email]);

  // Initial data load
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Refetch data when tab changes
  useEffect(() => {
    // If we've already done initial load and active tab changes
    if (profileData.email && !isLoading) {
      fetchAllData();
    }
  }, [activeTab, fetchAllData, isLoading, profileData.email]);

  return (
    <ProfileContext.Provider
      value={{
        activeTab,
        setActiveTab,
        profileData,
        orders,
        wishlistItems,
        referrals,
        tickets,
        isLoading,
        isRefetching,
        error,
        refetch: fetchAllData,
        shareCurrentTab,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}