'use client';

import { useAuthStore } from "@/store/auth-store";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const UserButton = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isLoggedIn, user, isLoading, setAuth, fetchAuthStatus } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    // Fetch auth status on mount to sync with server
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  const handleButtonClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.removeItem("authToken");
      // localStorage.removeItem("userRole");
      document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      // document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      setAuth(false, null);
      setIsDropdownOpen(false);
      router.push("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsDropdownOpen(false);
  };

  if (!isMounted) return null; // Prevent SSR mismatch

  if (isLoading) {
    return (
      <div className="p-2 bg-slate-200 rounded-full animate-pulse">
        <User size={24} />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        className="text-gray-700 p-2 bg-slate-200 rounded-full cursor-pointer hover:bg-slate-300 transition"
        onClick={handleButtonClick}
        aria-label="User account"
        aria-expanded={isDropdownOpen}
        aria-controls="user-menu"
        id="user-menu-button"
      >
        <User size={24} />
      </button>

      {isDropdownOpen && (
        <div
          id="user-menu"
          className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 animate-fade-in"
          role="menu"
          aria-labelledby="user-menu-button"
        >
          <div className="py-2">
            {isLoggedIn ? (
              <>
                {user && (
                  <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : 'Guest'}
                  </div>
                )}
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => handleNavigation("/profile/info")}
                  role="menuitem"
                >
                  Profile
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => handleNavigation("/profile/wishlist")}
                  role="menuitem"
                >
                  Wishlist
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => handleNavigation("/profile/orders")}
                  role="menuitem"
                >
                  My Orders
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                  onClick={handleLogout}
                  role="menuitem"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => handleNavigation("/signin")}
                  role="menuitem"
                >
                  Signin
                </button>
                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                  onClick={() => handleNavigation("/signup")}
                  role="menuitem"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserButton;