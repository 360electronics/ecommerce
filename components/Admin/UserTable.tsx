"use client"

import { useState } from "react"
import { ShieldCheck, BadgeCheck, Clock } from "lucide-react"
import { EnhancedTable, type ColumnDefinition } from "@/components/Layouts/TableLayout"
import { useAdminList } from "@/hooks/useAdminList"
import { UserDetailsModal } from "@/components/Admin/Users/UserDetailsModal"
import { AddAdminModal } from "@/components/Admin/Users/AddAdminModal"

// Admin accounts (customers live under Admin → Customers)
interface AdminRow {
  id: string
  fullName: string
  email: string | null
  phoneNumber: string | null
  emailVerified: boolean
  phoneVerified: boolean
  lastLogin: string | null
  createdAt: string
}

interface AdminStats {
  total: number
  verified: number
}

const formatDate = (value: string | null, withTime = false) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
        timeZone: "Asia/Kolkata",
      })
    : "—"

const toRow = (u: any): AdminRow => ({
  ...u,
  fullName: [u.firstName, u.lastName].filter(Boolean).join(" "),
  emailVerified: Boolean(u.emailVerified),
  phoneVerified: Boolean(u.phoneVerified),
})

export function UsersTable() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const { rows, stats, isLoading, isFetching, error, query, reload, tableProps } = useAdminList<
    AdminRow,
    AdminStats
  >("/api/users", { pageSize: 10, sort: "fullName", dir: "asc" }, { scope: "admins" }, toRow)

  const columns: ColumnDefinition<AdminRow>[] = [
    {
      key: "fullName",
      header: "Name",
      sortable: true,
      width: "24%",
      renderCell: (_, row) => (
        <span className="font-medium text-gray-900">
          {row.fullName || <span className="text-gray-400">No name</span>}
        </span>
      ),
    },
    { key: "email", header: "Email", sortable: true, width: "26%", renderCell: (v) => v ?? "—" },
    { key: "phoneNumber", header: "Mobile", width: "14%", renderCell: (v) => v ?? "—" },
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
      key: "lastLogin",
      header: "Last Login",
      sortable: true,
      width: "12%",
      renderCell: (value) =>
        value ? formatDate(value, true) : <span className="text-amber-700">Never</span>,
    },
    {
      key: "createdAt",
      header: "Added",
      sortable: true,
      width: "10%",
      renderCell: (value) => formatDate(value),
    },
  ]

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading admin users...</span>
      </div>
    )
  }

  return (
    <div className="mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">
          Admin accounts with access to this dashboard. Click an admin for details.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[
          { icon: ShieldCheck, label: "Admin Users", value: stats?.total ?? 0, tone: "bg-purple-100 text-purple-600" },
          { icon: BadgeCheck, label: "Verified", value: stats?.verified ?? 0, tone: "bg-green-100 text-green-600" },
          {
            icon: Clock,
            label: "Pending first sign-in",
            value: Math.max(0, (stats?.total ?? 0) - (stats?.verified ?? 0)),
            tone: "bg-amber-100 text-amber-600",
          },
        ].map(({ icon: Icon, label, value, tone }) => (
          <div key={label} className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${tone}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && rows.length === 0 && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">{error}</div>
      )}

      <EnhancedTable
        id="admin-users-table"
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
          defaultSortColumn: query.sort as keyof AdminRow,
          defaultSortDirection: query.dir,
          ...tableProps.sorting,
        }}
        actions={{
          onAdd: () => setIsAddOpen(true),
          addButtonText: "Add Admin",
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
        <UserDetailsModal userId={selectedId} variant="admin" onClose={() => setSelectedId(null)} />
      )}
      {isAddOpen && <AddAdminModal onClose={() => setIsAddOpen(false)} onCreated={reload} />}
    </div>
  )
}
