"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  type: string;
  active: boolean;
  startDate: string;
  endDate: string;
  link: string;
}

interface LoginResponse {
  userId: string;
  error?: string;
}

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBannerLoading, setIsBannerLoading] = useState(true);
  const [banner, setBanner] = useState<Banner | null>(null);
  const router = useRouter();

  // Fetch banners with memoized callback
  const fetchBanners = useCallback(async () => {
    try {
      setIsBannerLoading(true);
      const response = await fetch("/api/banner", {
        cache: "no-store", // Ensure fresh data
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch banners: ${response.status}`);
      }

      const responseData = await response.json();
      const transformedBanners: Banner[] = Array.isArray(responseData.data)
        ? responseData.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            imageUrl: item.imageUrl,
            type: item.type,
            active: item.status === "active",
            startDate: item.start_date || "",
            endDate: item.end_date || "",
            link: item.link || "",
          }))
        : [];

      const activeRegisterBanner = transformedBanners.find(
        (banner) => banner.type === "register" && banner.active
      );

      setBanner(activeRegisterBanner || null);
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast.error("Failed to load banner. Please try again.");
    } finally {
      setIsBannerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Validate identifier (email or phone)
  const validateIdentifier = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return emailRegex.test(value) || phoneRegex.test(value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateIdentifier(identifier)) {
      setError("Please enter a valid email or phone number");
      return;
    }

    setLoading(true);

    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const type = isEmail ? "email" : "phone";

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, type }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      toast.success("OTP sent successfully!");
      router.push(`/verify-otp?userId=${data.userId}&type=${type}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Banner Section */}
      <div className="hidden md:block w-full md:w-[40%] relative">
        {isBannerLoading ? (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center animate-pulse">
            <span className="text-gray-500 text-lg">Loading banner...</span>
          </div>
        ) : banner ? (
          <Link href={banner.link || "#"} className="block w-full h-full">
            <Image
              src={banner.imageUrl || "/default-banner.jpg"}
              alt={banner.title || "Promotional Banner"}
              fill
              sizes="40vw"
              className="object-cover"
              priority
              placeholder="blur"
              blurDataURL="/placeholder.svg"
              onError={() => setBanner(null)} // Fallback to null on error
            />
          </Link>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-lg">No banner available</span>
          </div>
        )}
      </div>

      {/* Login Form Section */}
      <div className="w-full md:w-[60%] flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/logo/360.svg"
              alt="Computer Garage Logo"
              width={180}
              height={54}
              priority
              className="object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-center text-blue-600">
            Sign In
          </h1>

          {/* Error Message */}
          {error && (
            <div
              className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded"
              role="alert"
            >
              <p>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email or Phone Number
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.trim())}
                className={cn(
                  "w-full px-4 py-3 border rounded-md text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "placeholder-gray-400",
                  error && "border-red-500"
                )}
                placeholder="Enter email or phone number"
                required
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={error ? "identifier-error" : undefined}
              />
              {error && (
                <p id="identifier-error" className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-3 px-4 rounded-md font-medium text-white",
                "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500",
                "transition duration-300",
                loading && "bg-blue-400 cursor-not-allowed"
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                "Request OTP"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-gray-600">
            <p>
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-blue-600 font-semibold hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>

          {/* Terms and Privacy */}
          <div className="text-center text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </Link>.
          </div>
        </div>
      </div>
    </div>
  );
}