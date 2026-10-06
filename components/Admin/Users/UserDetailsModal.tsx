"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/orders/payment-labels";
import {
  X,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  IndianRupee,
  Ticket,
  Heart,
  ShoppingCart,
  Calendar,
  Clock,
  ShieldCheck,
  Loader2,
} from "lucide-react";

interface UserDetails {
  user: {
    id: string;
    image: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phoneNumber: string | null;
    role: "user" | "admin" | "guest";
    emailVerified: boolean | null;
    phoneVerified: boolean | null;
    lastLogin: string | null;
    createdAt: string;
  };
  addresses: Array<{
    id: string;
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    gst: string | null;
    addressType: string;
    isDefault: boolean;
  }>;
  recentOrders: Array<{
    id: string;
    createdAt: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    totalAmount: number;
    deliveryMode: string;
    couponCode: string | null;
    items: Array<{
      quantity: number;
      unitPrice: number;
      productName: string | null;
      variantName: string | null;
      image: string | null;
    }>;
  }>;
  stats: {
    orderCount: number;
    salesCount: number;
    cancelledCount: number;
    totalSpent: number;
    avgOrderValue: number;
    firstOrderAt: string | null;
    lastOrderAt: string | null;
    tickets: number;
    openTickets: number;
    wishlistItems: number;
    cartItems: number;
  };
}

const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string | null, withTime = false) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
        timeZone: "Asia/Kolkata",
      })
    : "—";

const ORDER_STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-700",
  failed: "bg-red-100 text-red-800",
  returned: "bg-orange-100 text-orange-800",
};

function VerifiedBadge({ label, verified }: { label: string; verified: boolean | null }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        verified ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${verified ? "bg-green-500" : "bg-gray-400"}`} />
      {label} {verified ? "verified" : "unverified"}
    </span>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold text-gray-900">{value}</div>
      {hint && <div className="text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

export function UserDetailsModal({
  userId,
  variant,
  onClose,
}: {
  userId: string;
  variant: "customer" | "admin";
  onClose: () => void;
}) {
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setDetails(null);
    setError(null);
    fetch(`/api/admin/users/${userId}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Failed to load details");
        if (active) setDetails(data);
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [userId]);

  // Close on Escape; lock page scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const user = details?.user;
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    (variant === "customer" ? "Unnamed customer" : "Unnamed admin");
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={variant === "customer" ? "Customer details" : "Admin details"}
    >
      <div className="relative my-8 w-full max-w-4xl rounded-xl bg-gray-50 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 rounded-t-xl border-b border-gray-200 bg-white p-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {user ? initials || "?" : <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-xl font-semibold text-gray-900">
                  {user ? name : "Loading…"}
                </h2>
                {user && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : user.role === "guest"
                          ? "bg-gray-100 text-gray-700"
                          : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role === "user" ? "customer" : user.role}
                  </span>
                )}
              </div>
              {user && (
                <div className="mt-1 flex flex-wrap gap-2">
                  <VerifiedBadge label="Email" verified={user.emailVerified} />
                  <VerifiedBadge label="Phone" verified={user.phoneVerified} />
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {!details && !error && (
            <div className="flex items-center justify-center py-16 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading details…
            </div>
          )}

          {details && user && (
            <>
              {/* Contact + account */}
              <section className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {user.email ?? <span className="text-gray-400">No email</span>}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {user.phoneNumber ?? <span className="text-gray-400">No phone</span>}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Joined {formatDate(user.createdAt)}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-4 w-4 text-gray-400" />
                  Last login {formatDate(user.lastLogin, true)}
                </div>
                {variant === "admin" && (
                  <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                    <ShieldCheck className="h-4 w-4 text-gray-400" />
                    Admin access · signs in with OTP on {user.email ?? user.phoneNumber}
                    {!user.lastLogin && (
                      <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                        never signed in
                      </span>
                    )}
                  </div>
                )}
              </section>

              {/* Stats */}
              {(variant === "customer" || details.stats.orderCount > 0) && (
                <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <StatTile
                    icon={ShoppingBag}
                    label="Orders"
                    value={details.stats.orderCount}
                    hint={
                      details.stats.cancelledCount
                        ? `${details.stats.cancelledCount} cancelled`
                        : undefined
                    }
                  />
                  <StatTile
                    icon={IndianRupee}
                    label="Total spent"
                    value={inr(details.stats.totalSpent)}
                    hint={`${details.stats.salesCount} completed`}
                  />
                  <StatTile
                    icon={IndianRupee}
                    label="Avg. order"
                    value={inr(details.stats.avgOrderValue)}
                  />
                  <StatTile
                    icon={Ticket}
                    label="Tickets"
                    value={details.stats.tickets}
                    hint={details.stats.openTickets ? `${details.stats.openTickets} open` : undefined}
                  />
                  <StatTile icon={Heart} label="Wishlist" value={details.stats.wishlistItems} />
                  <StatTile icon={ShoppingCart} label="In cart" value={details.stats.cartItems} />
                </section>
              )}

              {/* Addresses */}
              {(variant === "customer" || details.addresses.length > 0) && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Addresses ({details.addresses.length})
                  </h3>
                  {details.addresses.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
                      No saved addresses.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {details.addresses.map((a) => (
                        <div key={a.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                          <div className="mb-1 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{a.fullName}</span>
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs capitalize text-gray-600">
                              {a.addressType}
                            </span>
                            {a.isDefault && (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600">
                            {a.addressLine1}
                            {a.addressLine2 ? `, ${a.addressLine2}` : ""}
                            <br />
                            {a.city}, {a.state} {a.postalCode}, {a.country}
                          </p>
                          <p className="mt-1 text-gray-500">{a.phoneNumber}</p>
                          {a.gst && <p className="text-xs text-gray-500">GST: {a.gst}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Orders */}
              {(variant === "customer" || details.recentOrders.length > 0) && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">
                    Recent orders
                    {details.stats.orderCount > details.recentOrders.length &&
                      ` (latest ${details.recentOrders.length} of ${details.stats.orderCount})`}
                  </h3>
                  {details.recentOrders.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-500">
                      No orders yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {details.recentOrders.map((o) => (
                        <div key={o.id} className="rounded-lg border border-gray-200 bg-white p-3 text-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Link
                                href={`/admin/orders/${o.id}`}
                                className="font-mono text-xs text-primary hover:underline"
                              >
                                #{o.id.slice(0, 8)}
                              </Link>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                                  ORDER_STATUS_STYLES[o.status] ?? "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {o.status}
                              </span>
                              <span className="text-xs text-gray-500">
                                {paymentMethodLabel(o.paymentMethod)} · {paymentStatusLabel(o.paymentStatus)} · {o.deliveryMode}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{inr(o.totalAmount)}</div>
                              <div className="text-xs text-gray-500">{formatDate(o.createdAt, true)}</div>
                            </div>
                          </div>
                          {o.items.length > 0 && (
                            <ul className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                              {o.items.map((item, idx) => (
                                <li key={idx} className="flex items-center justify-between gap-3 text-gray-600">
                                  <span className="truncate">
                                    {item.productName ?? "Product"}
                                    {item.variantName ? ` – ${item.variantName}` : ""}
                                  </span>
                                  <span className="shrink-0 text-xs">
                                    {item.quantity} × {inr(item.unitPrice)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {o.couponCode && (
                            <p className="mt-1 text-xs text-gray-500">Coupon: {o.couponCode}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
