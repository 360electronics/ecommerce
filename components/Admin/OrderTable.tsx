"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { EnhancedTable, type ColumnDefinition } from "@/components/Layouts/TableLayout"

// Define Order type
interface Order {
  id: string
  customer: string
  email: string
  date: string
  status: string
  payment: string
  total: number
  items: number
  shippingMethod: string
}

// Available order statuses and payment statuses
const orderStatuses = ["Processing", "Shipped", "Delivered", "Cancelled", "Returned", "All"]
const paymentStatuses = ["Paid", "Pending", "Refunded", "All"]

export function OrdersTable() {
  const router = useRouter()
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/orders")
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch orders")
        }

        // Transform API data to match Order interface
        const transformedOrders: Order[] = result.data.map((order: any) => ({
          id: order.orders.id,
          customer: order.savedAddresses.fullName,
          email: "", // Note: Email is not available in the provided API response
          date: new Date(order.orders.createdAt).toISOString().split("T")[0], // Format as YYYY-MM-DD
          status: order.orders.status,
          payment: order.orders.paymentStatus,
          total: parseFloat(order.orders.totalAmount),
          items: order.orderItems ? 1 : 0, // Since the response shows one item per order, adjust if multiple items are possible
          shippingMethod: order.orders.deliveryMode.charAt(0).toUpperCase() + order.orders.deliveryMode.slice(1), // Capitalize first letter
        }))

        setOrders(transformedOrders)
        setError(null)
      } catch (err) {
        console.error("[OrdersTable] Fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch orders")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  // Column definitions for Order Table
  const orderColumns: ColumnDefinition<Order>[] = [
    {
      key: "id",
      header: "Order ID",
      sortable: true,
      width: "15%",
    },
    {
      key: "customer",
      header: "Customer",
      sortable: true,
      width: "20%",
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      width: "15%",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      width: "15%",
      align: "center",
      filterOptions: orderStatuses,
    },
    {
      key: "payment",
      header: "Payment",
      sortable: true,
      width: "15%",
      align: "center",
      filterOptions: paymentStatuses,
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      width: "15%",
      align: "right",
      renderCell: (value) => {
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(Number(value))
      },
    },
    {
      key: "items",
      header: "Items",
      sortable: true,
      width: "10%",
      align: "center",
    },
    {
      key: "shippingMethod",
      header: "Shipping",
      sortable: true,
      width: "15%",
    },
  ]

  // Handle order actions
  const handleEditOrder = (orders: Order[]) => {
    if (orders.length === 1) {
      router.push(`/admin/orders/edit/${orders[0].id}`)
    } else {
      router.push(`/admin/orders/bulk-edit?ids=${orders.map((o) => o.id).join(",")}`)
    }
  }

  const handleViewOrder = (order: Order) => {
    router.push(`/admin/orders/${order.id}`)
  }

  const handleDeleteOrder = (order: Order) => {
    if (window.confirm(`Are you sure you want to delete order ${order.id}?`)) {
      console.log("Delete order:", order)
      // Implement delete logic here
    }
  }

  const handleBulkDelete = (orders: Order[]) => {
    if (window.confirm(`Are you sure you want to delete ${orders.length} orders?`)) {
      console.log("Delete orders:", orders)
      // Implement bulk delete logic here
    }
  }

  const handleExportOrders = (orders: Order[]) => {
    console.log("Export orders:", orders)
    // Implement export logic here
  }

  // Render loading or error states
  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Loading orders...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 bg-red-50 rounded-md">
        Error: {error}
        <button
          className="ml-4 text-blue-600 underline"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className=" mx-auto ">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="mt-2 text-gray-600">Manage your orders and their details</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 ">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3zm4 12h10m-10-4h10m-10-4h10" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 ">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Confirmed Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'Confirmed').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 ">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivered Orders</p>
              <p className="text-2xl font-bold text-gray-900">{orders.filter(o => o.status === 'Delivered').length}</p>
            </div>
          </div>
        </div>
       
      </div>

      {/* Table */}
      <EnhancedTable
        id="orders-table"
        data={orders}
        columns={orderColumns}
        selection={{
          enabled: true,
          onSelectionChange: setSelectedOrders,
          selectionKey: "id",
        }}
        search={{
          enabled: true,
          keys: ["id", "customer", "email"],
          placeholder: "Search orders...",
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
          defaultSortColumn: "date",
          defaultSortDirection: "desc",
        }}
        actions={{
          bulkActions: {
            delete: handleBulkDelete,
            export: handleExportOrders,
            edit: handleEditOrder,
          },
          rowActions: {
            view: handleViewOrder,
            edit: (order) => handleEditOrder([order]),
            delete: handleDeleteOrder,
          },
        }}
        customization={{
          statusColorMap: {
            processing: "bg-blue-100 text-blue-800 border-blue-200",
            shipped: "bg-yellow-100 text-yellow-800 border-yellow-200",
            delivered: "bg-green-100 text-green-800 border-green-200",
            cancelled: "bg-red-100 text-red-800 border-red-200",
            returned: "bg-purple-100 text-purple-800 border-purple-200",
            confirmed: "bg-teal-100 text-teal-800 border-teal-200", // Added for API status
          },
          rowHoverEffect: true,
          zebraStriping: false,
          stickyHeader: true,
        }}
        onRowClick={(order) => router.push(`/admin/orders/${order.id}`)}
      />
    </div>
  )
}