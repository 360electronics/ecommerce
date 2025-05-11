// components/Profile/ProfileContext.tsx
'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/auth-context';

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
  status: string;
  createdAt: string;
  totalAmount: number;
}

interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  imageUrl?: string;
  createdAt: string;
  inStock?: boolean;
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
  isLoading: boolean;
  error: string | null;
  refetch: () => void; // Allow components to trigger refetch if needed
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function useProfileContext() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (authLoading || !isLoggedIn || !user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch user profile and addresses
      const profileRes = await fetch(`/api/users/${user.id}`);
      const profileData = await profileRes.json();
      if (!profileRes.ok) throw new Error(profileData.error || 'Failed to fetch profile');

      setProfileData({
        name: profileData.user.firstName || '',
        email: profileData.user.email || '',
        phoneNumber: profileData.user.phoneNumber || '',
        addresses: profileData.addresses || [],
      });

      // Fetch orders
      const ordersRes = await fetch(`/api/users/orders?userId=${user.id}`);
      if (ordersRes.status === 404) {
        setOrders([]);
      } else if (!ordersRes.ok) {
        throw new Error(`Error fetching orders: ${ordersRes.status}`);
      } else {
        const ordersData = await ordersRes.json();
        if (Array.isArray(ordersData)) {
          setOrders(ordersData);
        } else {
          setOrders([]);
        }
      }

      // Fetch wishlist
      const wishlistRes = await fetch(`/api/users/wishlist?userId=${user.id}`);
      if (wishlistRes.status === 404) {
        setWishlistItems([]);
      } else if (!wishlistRes.ok) {
        throw new Error(`Error fetching wishlist: ${wishlistRes.status}`);
      } else {
        const wishlistData = await wishlistRes.json();
        if (Array.isArray(wishlistData)) {
          setWishlistItems(wishlistData);
        } else {
          setWishlistItems([]);
        }
      }

      // Fetch referral data
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [user, authLoading, isLoggedIn]);

  return (
    <ProfileContext.Provider
      value={{
        activeTab,
        setActiveTab,
        profileData,
        orders,
        wishlistItems,
        referrals,
        isLoading,
        error,
        refetch: fetchAllData,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}