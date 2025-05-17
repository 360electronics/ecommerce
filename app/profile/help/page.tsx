import UserLayout from '@/components/Layouts/UserLayout';
import Sidebar from '@/components/Profile/Sidebar';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';
import Help from '@/components/Profile/Help';

export default function HelpPage() {

  return (
    <UserLayout>
      <div className="flex flex-col md:flex-row min-h-screen">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <Breadcrumbs
            breadcrumbs={[
              { name: 'Home', path: '/' },
              { name: 'Help', path: '/profile/help' },
            ]}
          />
          <Help />
        </main>
      </div>
    </UserLayout>
  );
}