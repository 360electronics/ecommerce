"use client"

import { OrdersTable } from "@/components/Admin/OrderTable"

export default function OrdersPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Orders</h1>
        <p className="text-gray-500">Manage customer orders and track their status</p>
      </div>

        <OrdersTable />
    </div>
  )
}
