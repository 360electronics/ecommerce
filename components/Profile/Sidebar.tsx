'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LogOut, User, ShoppingBag, Heart, Share2, HelpCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';

const navItems = [
  { id: 'info', label: 'Profile', path: '/profile/info', icon: User },
  { id: 'orders', label: 'My Orders', path: '/profile/orders', icon: ShoppingBag },
  { id: 'wishlist', label: 'Wishlist', path: '/profile/wishlist', icon: Heart },
  { id: 'referrals', label: 'Referrals', path: '/profile/referrals', icon: Share2 },
  { id: 'help', label: 'Help', path: '/profile/help', icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      setAuth(false, null);
      router.push('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <div className="block md:hidden p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-between w-full py-2 px-4 text-gray-800 bg-gray-100 rounded-md"
        >
          <span className="font-medium">My Account</span>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${isMobileMenuOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <aside
        className={`bg-white border-r border-slate-200 ${
          isMobileMenuOpen ? 'block fixed inset-0 z-50 w-full h-screen' : 'hidden md:block'
        } md:static md:w-64 md:h-auto`}
      >
        {isMobileMenuOpen && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200 md:hidden">
            <h2 className="text-xl font-bold">Menu</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 nohemi-bold">
            My <span>Account</span>
          </h2>
        </div>

        <nav className="mt-4">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.path}
              className={`flex items-center w-full px-6 py-3 text-left font-medium transition ${
                pathname === item.path
                  ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                  : 'text-gray-600 hover:text-black hover:bg-gray-50'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
              aria-current={pathname === item.path ? 'page' : undefined}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          ))}

          <button
            onClick={handleLogout}
            className="flex items-center w-full px-6 py-3 text-left text-gray-600 hover:bg-gray-50 hover:text-red-600 transition"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </nav>
      </aside>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}