"use client";

import { useState } from "react";
import { Users, ShoppingBag, BadgeCheck, UserX } from "lucide-react";
import { EnhancedTable, type ColumnDefinition } from "@/components/Layouts/TableLayout";
import { useAdminList } from "@/hooks/useAdminList";
import { UserDetailsModal } from "@/components/Admin/Users/UserDetailsModal";

interface CustomerRow {
  id: string;
  fullName: string;
  email: string | null;
  phoneNumber: string | null;
  role: "user" | "guest";
  emailVerified: boolean;
  phoneVerified: boolean;
  orders: number;
  totalSpent: number;
  lastLogin: string | null;
  createdAt: string;
}

interface CustomerStats {
  total: number;
  verified: number;
  guests: number;
  withOrders: number;
}

const inr = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      })
    : "—";

const toRow = (u: any): CustomerRow => ({
  ...u,
  fullName: [u.firstName, u.lastName].filter(Boolean).join(" "),
  emailVerified: Boolean(u.emailVerified),
  phoneVerified: Boolean(u.phoneVerified),
});

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center">
        <div className={`rounded-lg p-3 ${tone}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString("en-IN")}</p>
        </div>
      </div>
    </div>
  );
}

export function CustomersTable() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { rows, stats, isLoading, isFetching, error, query, tableProps } = useAdminList<
    CustomerRow,
    CustomerStats
  >("/api/users", { pageSize: 10, sort: "createdAt", dir: "desc" }, { scope: "customers" }, toRow);

  const columns: ColumnDefinition<CustomerRow>[] = [
    {
      key: "fullName",
      header: "Customer",
      sortable: true,
      width: "22%",
      renderCell: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">
            {row.fullName || <span className="text-gray-400">No name</span>}
          </span>
          {row.role === "guest" && (
            <span className="text-xs text-amber-700">Guest · not verified</span>
          )}
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      sortable: true,
      width: "24%",
      renderCell: (_, row) => (
        <div className="flex flex-col text-sm">
          <span className="truncate">{row.email ?? "—"}</span>
          <span className="text-gray-500">{row.phoneNumber ?? "—"}</span>
        </div>
      ),
    },
    {
      key: "orders",
      header: "Orders",
      sortable: true,
      align: "center",
      width: "8%",
    },
    {
      key: "totalSpent",
      header: "Total Spent",
      sortable: true,
      align: "right",
      width: "12%",
      renderCell: (value) => inr(Number(value)),
    },
    {
      key: "emailVerified",
      header: "Verified",
      width: "14%",
      renderCell: (_, row) => (
        <div className="flex flex-wrap gap-1">
          {[
            ["Email", row.emailVerified],
            ["Phone", row.phoneVerified],
          ].map(([label, ok]) => (
            <span
              key={String(label)}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                ok ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
              }`}
            >
              {label}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      width: "10%",
      renderCell: (value) => formatDate(value),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      sortable: true,
      width: "10%",
      renderCell: (value) => formatDate(value),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
        <span className="ml-2">Loading customers...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
        <p className="mt-2 text-gray-600">
          Customer accounts with their orders, addresses and activity. Click a customer for details.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Customers" value={stats?.total ?? 0} tone="bg-primary-light text-primary" />
        <StatCard icon={ShoppingBag} label="With Orders" value={stats?.withOrders ?? 0} tone="bg-green-100 text-green-600" />
        <StatCard icon={BadgeCheck} label="Verified" value={stats?.verified ?? 0} tone="bg-blue-100 text-blue-600" />
        <StatCard icon={UserX} label="Guests (unverified)" value={stats?.guests ?? 0} tone="bg-amber-100 text-amber-600" />
      </div>

      {error && rows.length === 0 && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">{error}</div>
      )}

      <EnhancedTable
        id="customers-table"
        data={rows}
        columns={columns}
        selection={{ enabled: false }}
        search={{
          enabled: true,
          placeholder: "Search name, email or phone...",
          ...tableProps.search,
        }}
        pagination={{
          enabled: true,
          pageSizeOptions: [10, 25, 50],
          defaultPageSize: query.pageSize,
          ...tableProps.pagination,
        }}
        sorting={{
          enabled: true,
          defaultSortColumn: query.sort as keyof CustomerRow,
          defaultSortDirection: query.dir,
          ...tableProps.sorting,
        }}
        actions={{
          rowActions: { view: (row) => setSelectedId(row.id) },
        }}
        customization={{
          rowHoverEffect: true,
          stickyHeader: true,
          isLoading: isFetching,
        }}
        onRowClick={(row) => setSelectedId(row.id)}
      />

      {selectedId && (
        <UserDetailsModal userId={selectedId} variant="customer" onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
