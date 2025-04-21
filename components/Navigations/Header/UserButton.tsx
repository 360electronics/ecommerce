// UserButton.jsx
import React, { useState } from 'react';
import { User } from 'lucide-react';

const UserButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const toggleUserMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        className="text-gray-700 p-2 bg-slate-200 rounded-full cursor-pointer"
        onClick={toggleUserMenu}
        aria-label="User account"
      >
        <User size={24} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
          {isLoggedIn ? (
            <div className="py-2">
              <a href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Account</a>
              <a href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Orders</a>
              <a href="/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">My Wishlist</a>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => {
                  setIsLoggedIn(false);
                  setIsOpen(false);
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="py-2">
              <a href="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Login</a>
              <a href="/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Register</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserButton;