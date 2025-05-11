"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { EnhancedTable, type ColumnDefinition } from "@/components/Layouts/TableLayout"
import { fetchUsers } from "@/utils/users"

// Define User type
interface User {
  id: string;
  image: string;
  fullName:string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status:string;
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
      key: "image",
      header: "Profile Image",
      width: "60px",
      align: "center",
    },
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
            className={`inline-block rounded-full px-2 py-1 text-xs font-medium border ${
              item.emailVerified
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
            }`}
          >
            Email: {item.emailVerified ? "Verified" : "Unverified"}
          </span>
          <span
            className={`inline-block rounded-full px-2 py-1 text-xs font-medium border ${
              item.phoneVerified
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
            }`}
          >
            Phone: {item.phoneVerified ? "Verified" : "Unverified"}
          </span>
        </div>
      ),
    },
    {
      key: "lastLogin",
      header: "Last Login",
      sortable: true,
      width: "15%",
    },
    {
      key: "createdAt",
      header: "Joined At",
      sortable: true,
      width: "15%",
    },
  ]

  // Handle user actions
  // const handleAddUser = () => {
  //   router.push("/admin/users/add")
  // }

  console.log(selectedUsers)

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

  if (loading) return <p>Loading users...</p>

  return (
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
  )
}