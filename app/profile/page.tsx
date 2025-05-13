'use client';

import { useEffect } from 'react';
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

export default function ProfilePage() {
  
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    { name: 'Profile', path: '/profile' },
  ];

  return (
    <UserLayout>
      <Breadcrumbs breadcrumbs={breadcrumbItems} />
      <div>
        <ProfileContentWithTabSync />
      </div>
    </UserLayout>
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