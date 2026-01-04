"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LogOut,
  User,
  ShoppingBag,
  Heart,
  Share2,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

const navItems = [
  { id: "info", label: "Profile", path: "/profile/info", icon: User },
  { id: "orders", label: "My Orders", path: "/profile/orders", icon: ShoppingBag },
  { id: "wishlist", label: "Wishlist", path: "/profile/wishlist", icon: Heart },
  { id: "referrals", label: "Referrals", path: "/profile/referrals", icon: Share2 },
  { id: "help", label: "Help", path: "/profile/help", icon: HelpCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [open, setOpen] = useState(false);

  // Prevent background scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleLogout = async () => {
    await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
    localStorage.clear();
    document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setAuth(false, null);
    router.push("/signin");
  };

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">My Account</h1>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed md:sticky z-0 top-28 left-0 h-full w-72 bg-white border-r
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0`}
      >
        {/* Drawer Header (mobile) */}
        <div className="md:hidden flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-bold">My Account</h2>
          <button onClick={() => setOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Desktop Title */}
        <div className="hidden md:block p-6">
          <h2 className="text-2xl font-bold">My Account</h2>
        </div>

        {/* Navigation */}
        <nav className="mt-2">
          {navItems.map((item) => {
            const active = pathname === item.path;
            return (
              <Link
                key={item.id}
                href={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-medium transition
                  ${
                    active
                      ? "bg-primary/10 text-primary border-r-4 border-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-6 py-4 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </nav>
      </aside>
    </>
  );
}
