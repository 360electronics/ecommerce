import UserLayout from '@/components/Layouts/UserLayout';
import Sidebar from '@/components/Profile/Sidebar';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';
import Orders from '@/components/Profile/MyOrders';
import { useProfileInitializer } from '@/store/profile-store';

export default function OrdersPage() {

  return (
    <UserLayout>
      <div className="flex flex-col md:flex-row min-h-screen">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          <Breadcrumbs
            breadcrumbs={[
              { name: 'Home', path: '/' },
              { name: 'Orders', path: '/profile/orders' },
            ]}
          />
          <Orders />
        </main>
      </div>
    </UserLayout>
  );
}