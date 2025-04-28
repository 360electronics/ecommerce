"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EnhancedTable, type ColumnDefinition } from "@/components/Layouts/TableLayout"

// Define User type
interface User {
  id: string
  avatar: string
  name: string
  email: string
  role: string
  status: string
  orders: number
  lastLogin: string
  dateJoined: string
}

// Sample user data
const userData: User[] = [
  {
    id: "1",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?w=740&t=st=1713881048~exp=1713881648~hmac=a76ebd4c93db6b8c7d8d5080f3e5856f0e0a9b8b9b01be2e95d0b0ac1d9da869",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Customer",
    status: "active",
    orders: 12,
    lastLogin: "2023-04-15",
    dateJoined: "2022-11-03",
  },
  {
    id: "2",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436191.jpg?w=740&t=st=1713881077~exp=1713881677~hmac=a0e0c97ea2e65fd7b022c4944c77c6087b5c9f9c9e3a5570d1c32665d2213c34",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Admin",
    status: "active",
    orders: 5,
    lastLogin: "2023-04-18",
    dateJoined: "2022-10-15",
  },
  {
    id: "3",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436178.jpg?w=740&t=st=1713881094~exp=1713881694~hmac=c641d8b8e65d4b0e6f3c38b8e8c97a2c0ab9cc3c0b3377535bc01d8355c0e874",
    name: "Robert Johnson",
    email: "robert.johnson@example.com",
    role: "Customer",
    status: "inactive",
    orders: 3,
    lastLogin: "2023-03-22",
    dateJoined: "2023-01-07",
  },
  {
    id: "4",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436200.jpg?w=740&t=st=1713881108~exp=1713881708~hmac=d9f40a7f3c54b624d1a64a6b50fd2ef5d8eaa9e9a0c5c2b1b1df6e4b5f6b8f0e",
    name: "Emily Davis",
    email: "emily.davis@example.com",
    role: "Customer",
    status: "active",
    orders: 8,
    lastLogin: "2023-04-17",
    dateJoined: "2022-12-12",
  },
  {
    id: "5",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-rainbow-sunglasses_23-2149436196.jpg?w=740&t=st=1713881122~exp=1713881722~hmac=d0ae586e4b9a2683e8ab58878e8a597f0f1ad7d3b7c0b0e7d6b5e3e5f5e5f5e5",
    name: "Michael Wilson",
    email: "michael.wilson@example.com",
    role: "Customer",
    status: "active",
    orders: 15,
    lastLogin: "2023-04-16",
    dateJoined: "2022-09-28",
  },
  {
    id: "6",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-glasses-bow_23-2149436193.jpg?w=740&t=st=1713881137~exp=1713881737~hmac=d9f40a7f3c54b624d1a64a6b50fd2ef5d8eaa9e9a0c5c2b1b1df6e4b5f6b8f0e",
    name: "Sarah Brown",
    email: "sarah.brown@example.com",
    role: "Manager",
    status: "active",
    orders: 7,
    lastLogin: "2023-04-14",
    dateJoined: "2022-11-20",
  },
  {
    id: "7",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436180.jpg?w=740&t=st=1713881151~exp=1713881751~hmac=d9f40a7f3c54b624d1a64a6b50fd2ef5d8eaa9e9a0c5c2b1b1df6e4b5f6b8f0e",
    name: "David Miller",
    email: "david.miller@example.com",
    role: "Customer",
    status: "blocked",
    orders: 2,
    lastLogin: "2023-02-05",
    dateJoined: "2023-01-15",
  },
  {
    id: "8",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-pink-hair_23-2149436186.jpg?w=740&t=st=1713881166~exp=1713881766~hmac=d9f40a7f3c54b624d1a64a6b50fd2ef5d8eaa9e9a0c5c2b1b1df6e4b5f6b8f0e",
    name: "Jennifer Taylor",
    email: "jennifer.taylor@example.com",
    role: "Customer",
    status: "active",
    orders: 9,
    lastLogin: "2023-04-12",
    dateJoined: "2022-10-05",
  },
]

// Available user roles
const userRoles = ["Customer", "Admin", "Manager", "All"]

export function UsersTable() {
  const router = useRouter()
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])

  // Column definitions for User Table
  const userColumns: ColumnDefinition<User>[] = [
    {
      key: "avatar",
      header: "",
      width: "60px",
      align: "center",
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      width: "20%",
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      width: "25%",
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      width: "15%",
      filterOptions: userRoles,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "10%",
      align: "center",
    },
    {
      key: "orders",
      header: "Orders",
      sortable: true,
      width: "10%",
      align: "center",
      renderCell: (value, item) => {
        const orderCount = Number(value)
        let orderClass = "text-gray-600"

        if (orderCount > 10) {
          orderClass = "text-green-600 font-medium"
        } else if (orderCount === 0) {
          orderClass = "text-red-600"
        }

        return <span className={orderClass}>{value}</span>
      },
    },
    {
      key: "lastLogin",
      header: "Last Login",
      sortable: true,
      width: "15%",
    },
    {
      key: "dateJoined",
      header: "Date Joined",
      sortable: true,
      width: "15%",
    },
  ]

  // Handle user actions
  const handleAddUser = () => {
    router.push("/admin/users/add")
  }

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
    // Show confirmation dialog and delete user
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
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

  return (
    <EnhancedTable
      id="users-table"
      data={userData}
      columns={userColumns}
      selection={{
        enabled: true,
        onSelectionChange: setSelectedUsers,
        selectionKey: "id",
      }}
      search={{
        enabled: true,
        keys: ["name", "email", "role"],
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
        defaultSortColumn: "name",
        defaultSortDirection: "asc",
      }}
      actions={{
        // onAdd: handleAddUser,
        // addButtonText: "Add User",
        bulkActions: {
          delete: handleBulkDelete,
          export: handleExportUsers,
          edit: handleEditUser,
          view: handleViewUser,
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
