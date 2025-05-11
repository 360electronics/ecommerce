'use client';
import { LogOut, User, ShoppingBag, Heart, Share2, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useProfileContext } from './ProfileContext';

const navItems = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'orders', label: 'My Orders', icon: ShoppingBag },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'referrals', label: 'Referrals', icon: Share2 },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export default function Sidebar() {
  const router = useRouter();
  const { activeTab, setActiveTab } = useProfileContext();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800">My Account</h2>
      </div>
      <nav className="mt-4">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex items-center w-full px-6 py-3 text-left ${
              activeTab === item.id ? 'text-blue-600' : 'text-gray-600 hover:text-black'
            }`}
          >
            <item.icon className="w-5 h-5 mr-3" />
            {item.label}
          </button>
        ))}
        <button
          onClick={() => router.push('/login')}
          className="flex items-center w-full px-6 py-3 text-left text-gray-600 hover:bg-gray-50"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </nav>
    </aside>
  );
}
