"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutGrid,
  Users,
  Heart,
  ShoppingBag,
  Ticket,
  Briefcase,
  Package,
  Gamepad2,
  LogOut,
  Menu,
  Home,
  X,
  Image as ImageIcon,
  ShoppingCart,
  Tag,
  StoreIcon,
  TicketPercent,
} from "lucide-react";
import Breadcrumbs from "@/components/Reusable/BreadScrumb";
import { useAuthStore } from "@/store/auth-store";
import { BiSolidCoupon } from "react-icons/bi";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { setAuth } = useAuthStore();

  const router = useRouter();

  // Handle sidebar visibility based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  // Generate breadcrumbs dynamically
  const generateBreadcrumbs = () => {
    if (!pathname) return [];
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => ({
      name:
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
      path: `/${segments.slice(0, index + 1).join("/")}`,
      icon: Home,
    }));
  };

  const breadcrumbs = generateBreadcrumbs();

  // Navigation items with appropriate icons
  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutGrid },
    { name: "Brands", path: "/admin/brands", icon: Tag },
    { name: "Categories", path: "/admin/categories", icon: Package },
    { name: "Products", path: "/admin/products", icon: Package },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
    { name: "Tickets", path: "/admin/tickets", icon: Ticket },
    { name: "Coupons", path: "/admin/coupons", icon: TicketPercent },
    { name: "Offer Zone", path: "/admin/offer-zone", icon: Heart },
    { name: "New Arrival", path: "/admin/new-arrivals", icon: Briefcase },
    { name: "Gamer Zone", path: "/admin/gamer-zone", icon: Gamepad2 },
    {
      name: "Cart Value Offers",
      path: "/admin/cart-offer-products",
      icon: ShoppingCart,
    },
    {
      name: "Promotional Banners",
      path: "/admin/promotional-banners",
      icon: ImageIcon,
    },
    { name: "Stores", path: "/admin/stores", icon: StoreIcon },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("authToken");
      // localStorage.removeItem("userRole");
      document.cookie =
        "authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      // document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      setAuth(false, null);
      router.push("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Backdrop component for mobile
  const Backdrop = () => (
    <div
      className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
        sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={() => setSidebarOpen(false)}
      aria-hidden="true"
    />
  );

  return (
    <div className="flex max-h-screen overflow-y-auto bg-gray-50/90">
      {/* Mobile Backdrop */}
      <Backdrop />

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:w-64 lg:translate-x-0 -lg lg:-none`}
      >
        <div className="flex h-full flex-col border-r border-gray-200">
          {/* Logo and Close Button */}
          <div className="flex items-center justify-between px-4 py-4">
            <Link href={"/"} className="flex-1 text-center">
              <img
                src="/logo/logo.png"
                alt="Computer Garage Logo"
                width={200}
                height={50}
                className="h-auto w-[200px]"
              />
            </Link>
            <button
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto px-4 py-2 scrollbar-hide">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Main Menu
            </h2>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname?.startsWith(item.path) || false;
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary-light text-primary"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    } focus:outline-none focus:ring-2 focus:ring-primary`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? "text-primary" : "text-gray-500"
                      }`}
                      aria-hidden="true"
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Logout Button */}
          <div className="p-4">
            <button
              className="flex w-full items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
              onClick={() => handleLogout()}
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center  px-4 -sm lg:px-6">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-2 rounded-md p-2 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary lg:hidden"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="hidden sm:block">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto  p-4 lg:p-6">
          <div className="mx-auto ">{children}</div>
        </main>
      </div>
    </div>
  );
}
