// app/profile/info/page.tsx
import UserLayout from '@/components/Layouts/UserLayout';
import Sidebar from '@/components/Profile/Sidebar';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';
import ProfileInfo from '@/components/Profile/ProfileInfo';

export default function ProfileInfoPage() {
  return (
      <UserLayout>
        <div className="flex flex-col md:flex-row min-h-screen">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8">
            <Breadcrumbs
              breadcrumbs={[
                { name: 'Home', path: '/' },
                { name: 'Profile', path: '/profile/info' },
              ]}
            />
            <ProfileInfo />
          </main>
        </div>
      </UserLayout>
  );
}