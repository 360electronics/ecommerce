"use client"

import { UsersTable } from "@/components/Admin/UserTable"

export default function UsersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-gray-500">Manage your users and their permissions</p>
      </div>

        <UsersTable />
    </div>
  )
}
