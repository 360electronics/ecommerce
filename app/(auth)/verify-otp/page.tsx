"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import { useCheckoutStore } from "@/store/checkout-store";
import { useProfileStore } from "@/store/profile-store";
import { useWishlistStore } from "@/store/wishlist-store";

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

export interface VerifyOTPResponse {
  message: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phoneNumber: string | null;
    role: "user" | "admin" | "guest";
    emailVerified: boolean;
    phoneVerified: boolean;
    lastLogin?: string;
  };
  token: string;
  error?: string;
}

function VerifyOTPContent() {
  const [otp, setOTP] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isBannerLoading, setIsBannerLoading] = useState(true);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [type, setType] = useState<"email" | "phone">("email");
  const router = useRouter();
  const searchParams = useSearchParams(); // Use useSearchParams
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));
  const { setAuth } = useAuthStore();
  

  // Extract params from URL
  useEffect(() => {
    const userIdParam = searchParams.get("userId");
    const typeParam = (searchParams.get("type") as "email" | "phone") || "email";

    if (!userIdParam) {
      toast.error("Invalid request: Missing user ID");
    }

    setUserId(userIdParam);
    setType(typeParam);
  }, [searchParams]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Fetch banners
  const fetchBanners = useCallback(async () => {
    try {
      setIsBannerLoading(true);
      const response = await fetch("/api/banner", { cache: "no-store" });
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
      toast.error("Failed to load banner.");
    } finally {
      setIsBannerLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  // Handle OTP input changes
  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOTP = [...otp];
    newOTP[index] = value;
    setOTP(newOTP);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOTP = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOTP[i] = pastedData[i];
    }
    setOTP(newOTP);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  // Validate OTP
  const validateOTP = () => {
    const otpString = otp.join("");
    if (otpString.length !== 6 || !/^\d{6}$/.test(otpString)) {
      return "Please enter a valid 6-digit OTP";
    }
    return null;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
  
    const validationError = validateOTP();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
  
    if (!userId) {
      setError("Invalid request: Missing user ID");
      toast.error("Invalid request");
      return;
    }
  
    setLoading(true);
  
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp: otp.join(""), type }),
        credentials: "include",
      });
  
      const data: VerifyOTPResponse = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }
  
      toast.success("OTP verified successfully!");
  
      // Update auth state
      setAuth(true, data.user);
  
      // Fetch critical store data
      if (data.user.id) {
        // toast.loading("Fetching your data...");
        const results = await Promise.allSettled([
          useCartStore.getState().fetchCart(),
          useWishlistStore.getState().fetchWishlist(true), // Force fetch
          useCheckoutStore.getState().fetchCheckoutItems(data.user.id),
        ]);
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.log(`[VerifyOTPContent] Fetch[${index}] failed:`, result.reason);
          } else {
            console.log(`[VerifyOTPContent] Fetch[${index}] succeeded`);
          }
        });
        toast.dismiss();
      }
  
      // Navigate based on role
      if (data.user.role === "admin") {
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to verify OTP";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResend = async () => {
    if (!userId) {
      setError("Invalid request: Missing user ID");
      toast.error("Invalid request");
      return;
    }

    setResendLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      setCountdown(30);
      toast.success("OTP resent successfully!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to resend OTP";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Invalid Request</h1>
          <p className="mt-2 text-gray-600">Missing user ID. Please try again.</p>
          <Link href="/login" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

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
              onError={() => setBanner(null)}
            />
          </Link>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500 text-lg">No banner available</span>
          </div>
        )}
      </div>

      {/* Form Section */}
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
            Verify OTP
          </h1>

          {/* Description */}
          <p className="text-center text-gray-600">
            Enter the 6-digit OTP sent to your {type === "email" ? "email" : "phone"}.
          </p>

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
                htmlFor="otp-0"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                OTP
              </label>
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    className={cn(
                      "w-12 h-12 text-center text-lg font-medium border rounded-md",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500",
                      "placeholder-gray-400",
                      error && "border-red-500"
                    )}
                    required
                    disabled={loading}
                    aria-label={`OTP digit ${index + 1}`}
                    aria-invalid={!!error}
                    aria-describedby={error ? "otp-error" : undefined}
                  />
                ))}
              </div>
              {error && (
                <p id="otp-error" className="mt-2 text-sm text-red-600">
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
                  Verifying...
                </span>
              ) : (
                "Verify OTP"
              )}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading || countdown > 0}
              className={cn(
                "w-full py-3 px-4 rounded-md font-medium",
                "bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500",
                "transition duration-300",
                (resendLoading || countdown > 0) && "bg-gray-300 cursor-not-allowed"
              )}
            >
              {resendLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-gray-600"
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
                  Resending...
                </span>
              ) : countdown > 0 ? (
                `Resend OTP in ${countdown}s`
              ) : (
                "Resend OTP"
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="text-center text-sm text-gray-600">
            <p>
              <Link href="/signin" className="text-blue-600 font-semibold hover:underline">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <VerifyOTPContent />
    </Suspense>
  );
}