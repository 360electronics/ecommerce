"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    role: "user" | "admin" | "guest";
    emailVerified: boolean;
    phoneVerified: boolean;
  } | null;
  isLoading: boolean;
  setAuth: (isLoggedIn: boolean, user: AuthContextType["user"]) => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  isLoading: true,
  setAuth: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch auth status once on mount
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const response = await fetch("/api/auth/status", {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
          },
        });
        const data = await response.json();
        setIsLoggedIn(data.isAuthenticated);
        setUser(data.user);
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuthStatus();
  }, []); // Empty dependency array ensures this runs once

  // Function to update auth state (e.g., after login/logout)
  const setAuth = (newIsLoggedIn: boolean, newUser: AuthContextType["user"]) => {
    setIsLoggedIn(newIsLoggedIn);
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, isLoading, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
