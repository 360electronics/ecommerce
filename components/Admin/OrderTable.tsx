"use client"

import { useState } from "react"
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

// Sample order data
const orderData: Order[] = [
  {
    id: "ORD-2023-0001",
    customer: "John Doe",
    email: "john.doe@example.com",
    date: "2023-04-15",
    status: "delivered",
    payment: "paid",
    total: 12500,
    items: 3,
    shippingMethod: "Express",
  },
  {
    id: "ORD-2023-0002",
    customer: "Jane Smith",
    email: "jane.smith@example.com",
    date: "2023-04-14",
    status: "processing",
    payment: "paid",
    total: 8750,
    items: 2,
    shippingMethod: "Standard",
  },
  {
    id: "ORD-2023-0003",
    customer: "Robert Johnson",
    email: "robert.johnson@example.com",
    date: "2023-04-13",
    status: "shipped",
    payment: "paid",
    total: 15000,
    items: 4,
    shippingMethod: "Express",
  },
  {
    id: "ORD-2023-0004",
    customer: "Emily Davis",
    email: "emily.davis@example.com",
    date: "2023-04-12",
    status: "delivered",
    payment: "paid",
    total: 5600,
    items: 1,
    shippingMethod: "Standard",
  },
  {
    id: "ORD-2023-0005",
    customer: "Michael Wilson",
    email: "michael.wilson@example.com",
    date: "2023-04-11",
    status: "cancelled",
    payment: "refunded",
    total: 9800,
    items: 2,
    shippingMethod: "Express",
  },
  {
    id: "ORD-2023-0006",
    customer: "Sarah Brown",
    email: "sarah.brown@example.com",
    date: "2023-04-10",
    status: "delivered",
    payment: "paid",
    total: 7300,
    items: 3,
    shippingMethod: "Standard",
  },
  {
    id: "ORD-2023-0007",
    customer: "David Miller",
    email: "david.miller@example.com",
    date: "2023-04-09",
    status: "processing",
    payment: "pending",
    total: 18500,
    items: 5,
    shippingMethod: "Express",
  },
  {
    id: "ORD-2023-0008",
    customer: "Jennifer Taylor",
    email: "jennifer.taylor@example.com",
    date: "2023-04-08",
    status: "shipped",
    payment: "paid",
    total: 11200,
    items: 2,
    shippingMethod: "Standard",
  },
]

// Available order statuses and payment statuses
const orderStatuses = ["Processing", "Shipped", "Delivered", "Cancelled", "Returned", "All"]
const paymentStatuses = ["Paid", "Pending", "Refunded", "All"]

export function OrdersTable() {
  const router = useRouter()
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([])

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
      renderCell: (value, item) => {
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
  const handleAddOrder = () => {
    router.push("/admin/orders/add")
  }

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
    // Show confirmation dialog and delete order
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

  return (
    <EnhancedTable
      id="orders-table"
      data={orderData}
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
        // onAdd: handleAddOrder,
        // addButtonText: "Add Order",
        bulkActions: {
          delete: handleBulkDelete,
          export: handleExportOrders,
          edit: handleEditOrder,
          // view: handleViewOrder,
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
        },
        rowHoverEffect: true,
        zebraStriping: false,
        stickyHeader: true,
      }}
      onRowClick={(order) => router.push(`/admin/orders/${order.id}`)}
    />
  )
}
