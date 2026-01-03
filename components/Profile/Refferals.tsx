"use client";

import { useAuthStore } from "@/store/auth-store";
import { useProfileStore } from "@/store/profile-store";
import { useState } from "react";
import {
  AlertCircle,
  Gift,
  Users,
  Award,
  Check,
  Copy,
} from "lucide-react";
import SkeletonLoader from "../Reusable/SkeletonLoader";

export default function Referrals() {
  const { user, isLoading: authLoading } = useAuthStore();
  const {
    referrals,
    loadingStates,
    errors,
    shareCurrentPage,
  } = useProfileStore();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCouponId, setCopiedCouponId] =
    useState<string | null>(null);

  /* ---------------- HELPERS ---------------- */

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const handleCopyLink = () => {
    shareCurrentPage("referrals");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCoupon = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCouponId(id);
    setTimeout(() => setCopiedCouponId(null), 2000);
  };

  /* ---------------- LOADING ---------------- */

  if (authLoading || loadingStates.referrals) {
    return (
      <div className="px-6 py-8">
        <SkeletonLoader count={4} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" />
        <SkeletonLoader count={3} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border rounded-md">
        <AlertCircle className="inline mr-2 text-yellow-500" />
        Please log in to view referrals
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="px-6 py-8 space-y-8">

      {/* HEADER */}
      <h1 className="text-2xl font-bold">
        Referral <span className="text-primary">Program</span>
      </h1>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat icon={Users} label="Total Referrals" value={referrals.stats.totalReferrals} />
        <Stat icon={Award} label="Completed" value={referrals.stats.completedReferrals} />
        <Stat icon={Gift} label="Total Coupons" value={referrals.stats.totalCoupons} />
        <Stat icon={Gift} label="Available Coupons" value={referrals.stats.availableCoupons} />
      </div>

      {/* REFERRAL LINK */}
      <Card title="Your Referral Link">
        <div className="flex gap-2">
          <input
            value={referrals.referralLink}
            readOnly
            className="flex-1 border rounded-md px-3 py-2 text-sm"
          />
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-md text-white bg-primary flex items-center gap-2"
          >
            {copiedLink ? <Check size={16} /> : <Copy size={16} />}
            {copiedLink ? "Copied" : "Copy"}
          </button>
        </div>
      </Card>

      {/* COUPONS */}
      <Card title="Your Coupons">
        {referrals.coupons.length === 0 ? (
          <Empty text="No coupons yet" />
        ) : (
          <div className="space-y-3">
            {referrals.coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`p-4 rounded-lg border flex items-center justify-between ${
                  coupon.isUsed
                    ? "bg-gray-50 border-gray-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div>
                  <p className="font-medium">{coupon.code}</p>
                  <p className="text-sm text-gray-600">
                    ₹{coupon.amount} OFF
                  </p>
                  <p className="text-xs text-gray-500">
                    Expires {formatDate(coupon.expiryDate)}
                  </p>
                </div>

                {!coupon.isUsed && (
                  <button
                    onClick={() =>
                      handleCopyCoupon(coupon.code, coupon.id)
                    }
                    className="px-3 py-2  rounded-md bg-primary text-white text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {copiedCouponId === coupon.id ? (
                      <>
                        <Check size={14} /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={14} /> Copy Code
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* REFERRAL HISTORY */}
      <Card title="Referral History">
        {referrals.referrals.length === 0 ? (
          <Empty text="No referrals yet" />
        ) : (
          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Reward</th>
              </tr>
            </thead>
            <tbody>
              {referrals.referrals.map((ref) => (
                <tr key={ref.id} className="border-t">
                  <td className="p-3">
                    <p className="font-medium">{ref.referredUser.name}</p>
                    <p className="text-xs text-gray-500">
                      {ref.referredUser.email}
                    </p>
                  </td>
                  <td className="p-3 text-center">
                    {formatDate(ref.createdAt)}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        ref.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {ref.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {ref.couponGenerated ? (
                      <span className="text-green-600 font-medium">
                        ₹100 Issued
                      </span>
                    ) : (
                      <span className="text-gray-500">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ---------------- SMALL COMPONENTS ---------------- */

const Card = ({ title, children }: any) => (
  <div className="bg-white border rounded-lg">
    <div className="px-4 py-3 border-b font-medium">{title}</div>
    <div className="p-4">{children}</div>
  </div>
);

const Stat = ({ icon: Icon, label, value }: any) => (
  <div className="p-4 border rounded-lg flex items-center gap-4">
    <Icon className="text-primary" />
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  </div>
);

const Empty = ({ text }: any) => (
  <div className="text-center py-6 text-gray-500">{text}</div>
);
