// pages/ProfilePage.tsx
'use client';
import UserLayout from '@/components/Layouts/UserLayout';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';
import { ProfileProvider, useProfileContext } from '@/components/Profile/ProfileContext';
import Sidebar from '@/components/Profile/Sidebar';
import Orders from '@/components/Profile/MyOrders';
import Wishlist from '@/components/Profile/Wishlist';
import Referrals from '@/components/Profile/Refferals';
import Help from '@/components/Profile/Help';
import ProfileInfo from '@/components/Profile/ProfileInfo';

function ProfileContent() {
  const { activeTab } = useProfileContext();

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
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
      <ProfileProvider>
        <ProfileContent />
      </ProfileProvider>
    </UserLayout>
  );
}