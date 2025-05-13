'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import UserLayout from '@/components/Layouts/UserLayout';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';
import Sidebar from '@/components/Profile/Sidebar';
import Orders from '@/components/Profile/MyOrders';
import Wishlist from '@/components/Profile/Wishlist';
import Referrals from '@/components/Profile/Refferals';
import Help from '@/components/Profile/Help';
import ProfileInfo from '@/components/Profile/ProfileInfo';
import { useProfileContext } from '@/context/profile-context';

// Skeleton loader component for profile page
function ProfileSkeleton() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar skeleton */}
      <div className="w-full md:w-64 bg-white shadow-sm md:min-h-screen p-4">
        <div className="flex flex-col space-y-4">
          <div className="h-20 bg-gray-200 rounded-md animate-pulse mb-4"></div>
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-10 bg-gray-200 rounded-md animate-pulse"></div>
          ))}
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="flex-1 p-4">
        <div className="h-8 w-48 bg-gray-200 rounded-md animate-pulse mb-6"></div>
        <div className="space-y-4">
          <div className="h-40 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-60 bg-gray-200 rounded-md animate-pulse"></div>
          <div className="h-40 bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

function ProfileContent() {
  const { activeTab } = useProfileContext();
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1">
        <div className="">
          {/* Content based on active tab */}
          {activeTab === 'profile' && <ProfileInfo />}
          {activeTab === 'orders' && <Orders />}
          {activeTab === 'wishlist' && <Wishlist />}
          {activeTab === 'referrals' && <Referrals />}
          {activeTab === 'help' && <Help />}
        </div>
      </main>
    </div>
  );
}

// This wrapper component handles URL and tab state synchronization
function ProfileContentWithTabSync() {
  const { activeTab, setActiveTab } = useProfileContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // On mount and search param change, sync URL to tab state
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    
    // List of valid tabs
    const validTabs = ['profile', 'orders', 'wishlist', 'referrals', 'help'];
    
    // If URL has a valid tab parameter, set it as active
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl as any);
    }
  }, [searchParams, setActiveTab]);
  
  // When active tab changes, update URL
  useEffect(() => {
    // Create new URLSearchParams from current ones
    const params = new URLSearchParams(searchParams.toString());
    
    // Update the tab parameter
    params.set('tab', activeTab);
    
    // Update URL without reloading the page
    router.replace(`/profile?${params.toString()}`, { scroll: false });
  }, [activeTab, router, searchParams]);
  
  return <ProfileContent />;
}

function ProfilePageContent() {
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Profile', path: '/profile' },
  ];

  return (
    <>
      <Breadcrumbs breadcrumbs={breadcrumbItems} />
      <div>
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileContentWithTabSync />
        </Suspense>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return (
    <UserLayout>
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfilePageContent />
      </Suspense>
    </UserLayout>
  );
}