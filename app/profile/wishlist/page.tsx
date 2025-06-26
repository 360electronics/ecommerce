import UserLayout from '@/components/Layouts/UserLayout';
import Sidebar from '@/components/Profile/Sidebar';
import Breadcrumbs from '@/components/Reusable/BreadScrumb';
import Wishlist from '@/components/Profile/Wishlist';
import ProfileLayout from '@/components/Layouts/ProfileLayout';

export default function WishlistPage() {

  return (
    <ProfileLayout>

      <main className="flex-1 ">
        <Breadcrumbs
          breadcrumbs={[
            { name: 'Home', path: '/' },
            { name: 'Wishlist', path: '/profile/wishlist' },
          ]}
        />
        <Wishlist />
      </main>
    </ProfileLayout>
  );
}