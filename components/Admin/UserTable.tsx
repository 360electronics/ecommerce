"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { EnhancedTable, type ColumnDefinition } from "@/components/Layouts/TableLayout"
import { fetchUsers } from "@/utils/users"

// Define User type
interface User {
  id: string;
  image: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  orders: number;
  lastLogin: string;
  createdAt: string;
}

// Available user roles
const userRoles = ["User", "Admin", "Guest"]

export function UsersTable() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Column definitions for User Table
  const userColumns: ColumnDefinition<User>[] = [
    {
      key: "fullName",
      header: "Full Name",
      sortable: true,
      width: "20%",
      renderCell: (value, item) => `${item.firstName} ${item.lastName}`,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      width: "20%",
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      width: "15%",
      align: 'left',
      filterOptions: userRoles,
      renderCell: (value) => {
        const roleStyles: Record<string, string> = {
          User: "bg-blue-100 text-blue-800 border-blue-200",
          Admin: "bg-green-100 text-green-800 border-green-200",
          Guest: "bg-gray-100 text-gray-800 border-gray-200",
        }
        return (
          <span
            className={`inline-block capitalize rounded-full px-2 py-1 text-xs font-medium border ${roleStyles[value] || "bg-gray-100 text-gray-800 border-gray-200"}`}
          >
            {value}
          </span>
        )
      },
    },
    {
      key: "status",
      header: "Status",
      sortable: false,
      width: "20%",
      align: "left",
      renderCell: (value, item) => (
        <div className="flex flex-col items-start justify-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-1.5 ${item.emailVerified ? 'bg-green-400' : 'bg-red-400'}`}
            ></span>
            Email 
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.phoneVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-1.5 ${item.phoneVerified ? 'bg-green-400' : 'bg-red-400'}`}
            ></span>
            Phone
          </span>
        </div>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      sortable: true,
      width: "5%",
    },
    {
      key: "createdAt",
      header: "Joined At",
      sortable: true,
      width: "5%",
    },
  ]

  // Handle user actions
  const handleEditUser = (users: User[]) => {
    if (users.length === 1) {
      router.push(`/admin/users/edit/${users[0].id}`)
    } else {
      router.push(`/admin/users/bulk-edit?ids=${users.map((u) => u.id).join(",")}`)
    }
  }

  const handleViewUser = (user: User) => {
    router.push(`/admin/users/${user.id}`)
  }

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.firstName}?`)) {
      console.log("Delete user:", user)
      // Implement delete logic here
    }
  }

  const handleBulkDelete = (users: User[]) => {
    if (window.confirm(`Are you sure you want to delete ${users.length} users?`)) {
      console.log("Delete users:", users)
      // Implement bulk delete logic here
    }
  }

  const handleExportUsers = (users: User[]) => {
    console.log("Export users:", users)
    // Implement export logic here
  }

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await fetchUsers()
        if (data) {
          // Normalize user data
          const normalizedData = data.map((user: any) => ({
            ...user,
            emailVerified: Boolean(user.emailVerified),
            phoneVerified: Boolean(user.phoneVerified),
            productImages: Array.isArray(user.productImages)
              ? user.productImages
              : user.productImages
                ? [user.productImages]
                : [],
          }))
          setUsers(normalizedData)
        }
        console.log("Fetched users:", data)
      } catch (error) {
        console.error("Error loading users:", error)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  if (loading) return (
    <div className="p-4 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      <span className="ml-2">Loading users...</span>
    </div>
  )

  return (
    <div className=" mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-gray-600">Manage your user accounts and settings</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200   transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-primary-light rounded-lg">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a2 2 0 00-2-2h-3m-2 4h-5v-2a2 2 0 012-2h3m-6-4a3 3 0 11-6 0 3 3 0 016 0zm6 2a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
       
        <div className="bg-white p-6 rounded-xl border border-gray-200   transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admin Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'Admin').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200   transition-shadow duration-300">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verified Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.emailVerified || u.phoneVerified).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <EnhancedTable
        id="users-table"
        data={users}
        columns={userColumns}
        selection={{
          enabled: true,
          onSelectionChange: setSelectedUsers,
          selectionKey: "id",
        }}
        search={{
          enabled: true,
          keys: ["fullName", "email", "role"],
          placeholder: "Search users...",
        }}
        filters={{
          enabled: false, // Disable filters
        }}
        pagination={{
          enabled: true,
          pageSizeOptions: [5, 10, 25, 50],
          defaultPageSize: 10,
        }}
        sorting={{
          enabled: true,
          defaultSortColumn: "fullName",
          defaultSortDirection: "asc",
        }}
        actions={{
          bulkActions: {
            delete: handleBulkDelete,
            export: handleExportUsers,
            edit: handleEditUser,
          },
          rowActions: {
            view: handleViewUser,
            edit: (user) => handleEditUser([user]),
            delete: handleDeleteUser,
          },
        }}
        customization={{
          statusColorMap: {
            active: "bg-green-100 text-green-800 border-green-200",
            inactive: "bg-gray-100 text-gray-800 border-gray-200",
            blocked: "bg-red-100 text-red-800 border-red-200",
          },
          rowHoverEffect: true,
          zebraStriping: false,
          stickyHeader: true,
        }}
        onRowClick={(user) => router.push(`/admin/users/${user.id}`)}
      />
    </div>
  )
}