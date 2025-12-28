"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { showFancyToast } from "@/components/Reusable/ShowCustomToast";

// Types (aligned with banners schema)
interface ImageUrls {
  default: string;
  sm?: string;
  lg?: string;
}

interface Banner {
  id: string;
  title: string;
  imageUrls: ImageUrls;
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

function LoginContent() {
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBannerLoading, setIsBannerLoading] = useState(true);
  const [banner, setBanner] = useState<Banner | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  // Fetch banners with memoized callback
  const fetchBanners = useCallback(async () => {
    try {
      setIsBannerLoading(true);
      const response = await fetch("/api/banner", {
        cache: "no-store",
        headers: {
          "x-super-secure-key": `${process.env.API_SECRET_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch banners: ${response.status}`);
      }

      const responseData = await response.json();
      const transformedBanners: Banner[] = Array.isArray(responseData.data)
        ? responseData.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            imageUrls: item.imageUrls,
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
      showFancyToast({
        title: "Unable to Load Banner",
        message: "Failed to load banner. Please try again.",
        type: "error",
      });
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
      showFancyToast({
        title: "OTP Sent",
        message:
          "An OTP has been sent to your " + type + ". Please check and verify.",
        type: "success",
      });
      router.push(
        `/verify-otp?userId=${
          data.userId
        }&type=${type}&callbackUrl=${encodeURIComponent(callbackUrl)}`
      );
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      showFancyToast({
        title: "Login Failed",
        message: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Banner Section */}
      <div className="hidden md:block w-full md:w-[40%] relative">
        <Link href={banner?.link || "#"} className="block w-full h-full">
          <img
            src={banner?.imageUrls.default || "/auth_placeholder.webp"}
            alt={banner?.title || "Promotional Banner"}
            sizes="40vw"
            className="object-cover w-full h-full aspect-[3/4] sticky top-0"
          />
        </Link>
      </div>

      {/* Login Form Section */}
      <div className="w-full md:w-[60%] flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <img
              src="/logo/logo.png"
              alt="Computer Garage Logo"
              width={180}
              height={54}
              className="object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-center text-primary">
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
                  "focus:outline-none focus:ring-2 focus:ring-primary",
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
                "bg-gradient-to-r from-[#ff6b00] to-[#ff9f00] hover:to-primary-hover ",
                "transition duration-300",
                loading && "bg-primary cursor-not-allowed"
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
                className="text-primary font-semibold hover:underline"
              >
                Sign Up
              </Link>
            </p>
          </div>

          {/* Terms and Privacy */}
          <div className="text-center text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-gray-50 items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
