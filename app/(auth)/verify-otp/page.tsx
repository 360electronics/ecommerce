"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from 'js-cookie';

export default function VerifyOTPPage() {
  const [otp, setOTP] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [type, setType] = useState<"email" | "phone">("email");


  // Extract params from the URL manually
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const userIdParam = searchParams.get("userId");
    const typeParam = (searchParams.get("type") as "email" | "phone") || "email";

    setUserId(userIdParam);
    setType(typeParam);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, otp, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', JSON.stringify(data.user.role));
      
      // Store token in cookies (expires in 12 hours)
      Cookies.set('authToken', data.token, { expires: 0.5 });
      Cookies.set('userRole', JSON.stringify(data.user.role), { expires: 0.5 });
      
      // Redirect to home page
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  if (!userId) {
    return <div>Invalid request</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Verify OTP</h1>
      <p className="mb-4">
        Enter the OTP sent to your {type === "email" ? "email" : "phone"}.
      </p>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="otp">OTP</label>
          <input
            type="text"
            name="otp"
            value={otp}
            onChange={(e) => setOTP(e.target.value)}
            className="w-full border p-2"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 disabled:bg-gray-400"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendLoading || countdown > 0}
          className="w-full bg-gray-200 p-2 disabled:bg-gray-300"
        >
          {resendLoading
            ? "Resending..."
            : countdown > 0
            ? `Resend OTP in ${countdown}s`
            : "Resend OTP"}
        </button>
      </form>
    </div>
  );
}