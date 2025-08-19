"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

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

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  referralCode: string;
}

interface SignupResponse {
  userId: string;
  error?: string;
}

// SignupForm component that doesn't directly use searchParams
function SignupForm({ referralCode = "" }) {
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    referralCode: referralCode,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBannerLoading, setIsBannerLoading] = useState(true);
  const [banner, setBanner] = useState<Banner | null>(null);
  const router = useRouter();

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

      console.log(activeRegisterBanner)
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

  // Handle input changes
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [e.target.name]: e.target.value.trim(),
      }));
    },
    []
  );

  // Validate form data
  const validateForm = useCallback(
    (data: SignupFormData): string | null => {
      const nameRegex = /^[A-Za-z\s]{2,}$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^\+?[\d\s-]{10,}$/;
      const referralCodeRegex = /^[A-Z0-9]{10}$/;

      if (!nameRegex.test(data.firstName)) {
        return "First name must be at least 2 characters and contain only letters";
      }
      if (!nameRegex.test(data.lastName)) {
        return "Last name must be at least 2 characters and contain only letters";
      }
      if (!emailRegex.test(data.email)) {
        return "Please enter a valid email address";
      }
      if (!phoneRegex.test(data.phoneNumber)) {
        return "Please enter a valid phone number (at least 10 digits)";
      }
      if (data.referralCode && !referralCodeRegex.test(data.referralCode)) {
        return "Referral code must be 10 alphanumeric characters";
      }
      return null;
    },
    []
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm(formData);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data: SignupResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }

      toast.success("Signup successful! OTP sent to your email/phone.");
      router.push(`/verify-otp?userId=${data.userId}`);
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
        
          <Link href={banner?.link || "#"} className="block w-full h-full">
            <Image
              src={banner?.imageUrls.default || "/auth_placeholder.webp"}
              alt={banner?.title || "Promotional Banner"}
              fill
              sizes="40vw"
              quality={100}
              className="object-cover"
              priority
              placeholder="blur"
              blurDataURL="/auth_placeholder.webp"
              onError={() => setBanner(null)}
            />
          </Link>
      </div>

      {/* Form Section */}
      <div className="w-full md:w-[60%] flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/logo/logo.png"
              alt="Computer Garage Logo"
              width={180}
              height={54}
              priority
              className="object-contain"
            />
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-center text-primary">
            Sign Up
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
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={cn(
                  "w-full px-4 py-3 border rounded-md text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  "placeholder-gray-400",
                  error && "border-red-500"
                )}
                placeholder="Enter your first name"
                required
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={error ? "firstName-error" : undefined}
              />
              {error && error.includes("First name") && (
                <p id="firstName-error" className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={cn(
                  "w-full px-4 py-3 border rounded-md text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  "placeholder-gray-400",
                  error && "border-red-500"
                )}
                placeholder="Enter your last name"
                required
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={error ? "lastName-error" : undefined}
              />
              {error && error.includes("Last name") && (
                <p id="lastName-error" className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={cn(
                  "w-full px-4 py-3 border rounded-md text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  "placeholder-gray-400",
                  error && "border-red-500"
                )}
                placeholder="Enter your email"
                required
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={error ? "email-error" : undefined}
              />
              {error && error.includes("email") && (
                <p id="email-error" className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={cn(
                  "w-full px-4 py-3 border rounded-md text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  "placeholder-gray-400",
                  error && "border-red-500"
                )}
                placeholder="Enter your phone number"
                required
                disabled={loading}
                aria-invalid={!!error}
                aria-describedby={error ? "phoneNumber-error" : undefined}
              />
              {error && error.includes("phone") && (
                <p id="phoneNumber-error" className="mt-1 text-sm text-red-600">
                  {error}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="referralCode"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Referral Code (Optional)
              </label>
              <input
                id="referralCode"
                type="text"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                className={cn(
                  "w-full px-4 py-3 border rounded-md text-gray-900",
                  "focus:outline-none focus:ring-2 focus:ring-primary",
                  "placeholder-gray-400",
                  error && error.includes("Referral code") && "border-red-500"
                )}
                placeholder="Enter referral code"
                disabled={loading}
                aria-invalid={!!error && error.includes("Referral code")}
                aria-describedby={error && error.includes("Referral code") ? "referralCode-error" : undefined}
              />
              {error && error.includes("Referral code") && (
                <p id="referralCode-error" className="mt-1 text-sm text-red-600">
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
                  Signing Up...
                </span>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center text-sm text-gray-600">
            <p>
              Already have an account?{" "}
              <Link
                href="/signin"
                className="text-primary font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>

          {/* Terms and Privacy */}
          <div className="text-center text-xs text-gray-500">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>.
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export with proper Suspense boundary
export default function SignupPage() {
  // Move useSearchParams call inside a component wrapped by Suspense
  function SearchParamsHandler() {
    const searchParams = useSearchParams();
    const referralCodeFromUrl = searchParams.get("ref") || "";
    return <SignupForm referralCode={referralCodeFromUrl} />;
  }

  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SearchParamsHandler />
    </Suspense>
  );
}