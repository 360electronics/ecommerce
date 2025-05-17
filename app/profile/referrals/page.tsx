import UserLayout from '@/components/Layouts/UserLayout';
import Sidebar from '@/components/Profile/Sidebar';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';
import Referrals from '@/components/Profile/Refferals';

export default function ReferralsPage() {

  return (
    <UserLayout>
      <div className="flex flex-col md:flex-row min-h-screen ">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <Breadcrumbs
            breadcrumbs={[
              { name: 'Home', path: '/' },
              { name: 'Referrals', path: '/profile/referrals'},
            ]}
          />
          <Referrals />
        </main>
      </div>
    </UserLayout>
  );
}