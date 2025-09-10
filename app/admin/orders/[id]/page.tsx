"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Define Order type
interface Order {
  id: string
  customer: string
  email: string
  date: string
  status: string
  payment: string
  total: string
  items: number
  discountAmount: number
  shippingMethod: string
  address: {
    fullName: string
    phoneNumber: string
    addressLine1: string
    addressLine2: string
    city: string
    state: string
    postalCode: string
    country: string
    addressType: string
  }
  itemsDetails: {
    id: string
    productId: string
    variantId: string
    quantity: number
    unitPrice: string
    variant: {
      name: string
      sku: string
      productImages: { url: string; alt: string; isFeatured: boolean }[]
    }
  }[]
  coupon?: {
    code: string
    type: "amount" | "percentage"
    value: number
    couponId: string
    couponType: "individual" | "special"
  } | null
}

export default function OrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  // Status transition rules
  const statusOrder = ["confirmed", "shipped", "delivered", "cancelled", "returned"]
  const getAvailableStatuses = (currentStatus: string) => {
    const currentIndex = statusOrder.indexOf(currentStatus)
    if (currentIndex === -1) return []
    return statusOrder.slice(currentIndex).filter((status) => status !== currentStatus)
  }

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/orders?id=${orderId}`)
        const result = await response.json()

        if (!result.success || !result.data || result.data.length === 0) {
          throw new Error(result.message || "Order not found")
        }

        const apiOrder = result.data[0]
        const transformedOrder: Order = {
          id: apiOrder.orders.id,
          customer: apiOrder.savedAddresses.fullName,
          email: "",
          date: new Date(apiOrder.orders.createdAt).toISOString().split("T")[0],
          status: apiOrder.orders.status,
          payment: apiOrder.orders.paymentStatus,
          total: apiOrder.orders.totalAmount?.toString() ?? "0",
          items: Array.isArray(apiOrder.orderItems) ? apiOrder.orderItems.length : apiOrder.orderItems ? 1 : 0,
          discountAmount: apiOrder.orders.discountAmount?.toString() ?? "0",
          shippingMethod: apiOrder.orders.deliveryMode.charAt(0).toUpperCase() + apiOrder.orders.deliveryMode.slice(1),
          address: {
            fullName: apiOrder.savedAddresses.fullName,
            phoneNumber: apiOrder.savedAddresses.phoneNumber,
            addressLine1: apiOrder.savedAddresses.addressLine1,
            addressLine2: apiOrder.savedAddresses.addressLine2,
            city: apiOrder.savedAddresses.city,
            state: apiOrder.savedAddresses.state,
            postalCode: apiOrder.savedAddresses.postalCode,
            country: apiOrder.savedAddresses.country,
            addressType: apiOrder.savedAddresses.addressType,
          },
          itemsDetails: Array.isArray(apiOrder.orderItems)
            ? apiOrder.orderItems.map((item: any) => ({
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                variant: {
                  name: apiOrder.variants.name,
                  sku: apiOrder.variants.sku,
                  productImages: apiOrder.variants.productImages,
                },
              }))
            : apiOrder.orderItems
            ? [
                {
                  id: apiOrder.orderItems.id,
                  productId: apiOrder.orderItems.productId,
                  variantId: apiOrder.orderItems.variantId,
                  quantity: apiOrder.orderItems.quantity,
                  unitPrice: apiOrder.orderItems.unitPrice,
                  variant: {
                    name: apiOrder.variants.name,
                    sku: apiOrder.variants.sku,
                    productImages: apiOrder.variants.productImages,
                  },
                },
              ]
            : [],
          coupon: apiOrder.orders.couponId
            ? {
                code: apiOrder.orders.couponCode || "Unknown",
                type: apiOrder.orders.discountAmount !== "0.00" ? "amount" : "percentage",
                value: parseFloat(apiOrder.orders.discountAmount) || 5,
                couponId: apiOrder.orders.couponId,
                couponType: apiOrder.orders.couponCode === "RED360" ? "special" : "individual",
              }
            : null,
        }

        setOrder(transformedOrder)
        setNewStatus(transformedOrder.status)
        setError(null)
      } catch (err) {
        console.error("[OrderDetailsPage] Fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch order details")
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!order || !newStatus) return

    try {
      setUpdateLoading(true)
      setUpdateError(null)

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Failed to update order status")
      }

      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      setIsModalOpen(false)
    } catch (err) {
      console.error("[OrderDetailsPage] Update error:", err)
      setUpdateError(err instanceof Error ? err.message : "Failed to update order status")
    } finally {
      setUpdateLoading(false)
    }
  }

  // Handle delete order
  const handleDeleteOrder = async () => {
    if (!order || !window.confirm(`Are you sure you want to delete order ${order.id}?`)) return

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Failed to delete order")
      }

      router.push("/admin/orders")
    } catch (err) {
      console.error("[OrderDetailsPage] Delete error:", err)
      setError(err instanceof Error ? err.message : "Failed to delete order")
    }
  }

  // Handle PDF generation with jsPDF and jspdf-autotable
  const handleGeneratePDF = () => {
    if (!order) return

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

  

    // Fonts & Setup
    const leftMargin = 20
    const rightMargin = 190
    const pageHeight = 297 // A4 height in mm
    const bottomMargin = 20 // Margin from bottom for footer

    doc.setFont("helvetica", "normal")

    const logoUrl = "/red-logo.png" // Replace with your logo
    doc.addImage(logoUrl, "PNG", leftMargin, 10, 15, 15) // Logo at top-left, 50mm wide, 15mm tall
  
    // Header
    doc.setFontSize(18)
    doc.text("ORDER INVOICE", leftMargin, 35) // Adjusted Y to account for logo
    doc.setFontSize(10)
    doc.text("360 Electronics", rightMargin, 20, { align: "right" })
    doc.text("Coimbatore, Tamil Nadu - 641107", rightMargin, 26, { align: "right" })
    doc.text("360electronicspvtltd@gmail.com", rightMargin, 32, { align: "right" })

    // Order Info
    doc.setFontSize(12)
    doc.text(`Order ID: ${order.id}`, leftMargin, 40)
    doc.text(`Date: ${order.date}`, leftMargin, 46)

    // Line separator
    doc.setLineWidth(0.5)
    doc.line(leftMargin, 52, rightMargin, 52)

    // Bill To
    doc.setFontSize(12)
    doc.text("BILL TO", leftMargin, 60)
    doc.setFontSize(10)
    const addressYStart = 66
    doc.text(order.address.fullName, leftMargin, addressYStart)
    doc.text(
      `${order.address.addressLine1}${order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""}`,
      leftMargin,
      addressYStart + 6
    )
    doc.text(
      `${order.address.city}, ${order.address.state} ${order.address.postalCode}`,
      leftMargin,
      addressYStart + 12
    )
    doc.text(order.address.country, leftMargin, addressYStart + 18)
    doc.text(`Phone: ${order.address.phoneNumber}`, leftMargin, addressYStart + 24)
    doc.text(`Email: ${order.email || "N/A"}`, leftMargin, addressYStart + 30)

    // Order Summary
    doc.setFontSize(12)
    doc.text("ORDER SUMMARY", rightMargin, 60, { align: "right" })
    doc.setFontSize(10)
    const summaryY = 66
    doc.text(`Status: ${capitalize(order.status)}`, rightMargin, summaryY, { align: "right" })
    doc.text(`Payment: ${capitalize(order.payment)}`, rightMargin, summaryY + 6, { align: "right" })
    doc.text(`Shipping: ${order.shippingMethod}`, rightMargin, summaryY + 12, { align: "right" })
    if (order.coupon) {
      const discountText =
        order.coupon.type === "percentage"
          ? `${order.coupon.value}%`
          : `₹${order.coupon.value}`
      doc.text(`Coupon: ${order.coupon.code} (${discountText})`, rightMargin, summaryY + 18, {
        align: "right",
      })
    }

    // Items Table
    const tableHeaders = ["Product", "SKU", "Qty", "Unit Price", "Total"]
    const tableData = order.itemsDetails.map((item) => [
      item.variant.name,
      item.variant.sku,
      item.quantity.toString(),
      Number(item.unitPrice),
      Number(item.unitPrice) * Number(item.quantity),
    ])

    

    autoTable(doc, {
      startY: 105,
      head: [tableHeaders],
      body: tableData,
      styles: {
        fontSize: 10,
        cellPadding: 4,
        textColor: 20,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [100, 100, 100],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 70, halign: "left" },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 30, halign: "right" },
      },
      margin: { left: leftMargin, right: leftMargin },
    })

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY || 105
    doc.setFontSize(11)
    let y = finalY + 10

    if (order.discountAmount) {
      doc.text("Discount:", 150, y, { align: "right" })
      doc.text(`- ${order.discountAmount}`, rightMargin, y, { align: "right" })
      y += 6
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Total:", 150, y, { align: "right" })
    doc.text(order.total, rightMargin, y, { align: "right" })

    // Footer
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    const footerText = "Thank you for shopping with 360 Electronics!"
    const textWidth = doc.getTextWidth(footerText)
    const pageWidth = 210 // A4 width in mm
    const footerX = (pageWidth - textWidth) / 2 // Center horizontally
    doc.text(footerText, footerX, pageHeight - bottomMargin)


    // Save
    doc.save(`Invoice_${order.id}.pdf`)
  }

  // Helper functions
  const formatINR = (amount: number | string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(typeof amount === "string" ? parseFloat(amount) : amount)

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  // Handle loading and error states
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-lg font-medium text-gray-600">Loading order details...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">{error || "Order not found"}</p>
          <Link href="/admin/orders" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200">
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-3xl">Order #{order.id}</h1>
        <Link
          href="/admin/orders"
          className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
        >
          Back to Orders
        </Link>
      </div>

      {/* Order Information */}
      <div className="bg-white shadow-md rounded-2xl p-8 mb-8 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Order Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="mb-3 text-sm"><strong className="font-medium text-gray-700">Order ID:</strong> {order.id}</p>
            <p className="mb-3 text-sm"><strong className="font-medium text-gray-700">Date:</strong> {order.date}</p>
            <p className="mb-3 text-sm">
              <strong className="font-medium text-gray-700">Status:</strong>{" "}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium
                  ${order.status === "confirmed" ? "bg-teal-100 text-teal-800" : 
                    order.status === "shipped" ? "bg-yellow-100 text-yellow-800" : 
                    order.status === "delivered" ? "bg-green-100 text-green-800" : 
                    order.status === "cancelled" || order.status === "returned" ? "bg-red-100 text-red-800" : 
                    "bg-gray-100 text-gray-800"}`}
              >
                {capitalize(order.status)}
              </span>
            </p>
            <p className="mb-3 text-sm">
              <strong className="font-medium text-gray-700">Payment Status:</strong>{" "}
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium
                  ${order.payment === "paid" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
              >
                {capitalize(order.payment)}
              </span>
            </p>
            <p className="mb-3 text-sm">
              <strong className="font-medium text-gray-700">Total:</strong>{" "}
              {formatINR(order.total)}
            </p>
            {order.discountAmount > 0 && (
              <p className="mb-3 text-sm">
                <strong className="font-medium text-gray-700">Discount:</strong>{" "}
                {formatINR(order.discountAmount)}
              </p>
            )}
            <p className="mb-3 text-sm"><strong className="font-medium text-gray-700">Items:</strong> {order.items}</p>
            <p className="mb-3 text-sm"><strong className="font-medium text-gray-700">Shipping Method:</strong> {order.shippingMethod}</p>
            {order.coupon && (
              <p className="mb-3 text-sm">
                <strong className="font-medium text-gray-700">Coupon:</strong> {order.coupon.code} (
                {order.coupon.type === "percentage"
                  ? `${order.coupon.value}%`
                  : formatINR(order.coupon.value)}
                )
              </p>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
            <p className="mb-3 text-sm"><strong className="font-medium text-gray-700">Name:</strong> {order.customer}</p>
            <p className="mb-3 text-sm"><strong className="font-medium text-gray-700">Email:</strong> {order.email || "N/A"}</p>
            <p className="mb-3 text-sm"><strong className="font-medium text-gray-700">Phone:</strong> {order.address.phoneNumber}</p>
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Shipping Address</h3>
            <p className="mb-3 text-sm">{order.address.fullName}</p>
            <p className="mb-3 text-sm">{order.address.addressLine1}{order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""}</p>
            <p className="mb-3 text-sm">{order.address.city}, {order.address.state} {order.address.postalCode}</p>
            <p className="mb-3 text-sm">{order.address.country}</p>
            <p className="mb-3 text-sm"><strong className="font-medium text-gray-700">Type:</strong> {order.address.addressType}</p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white shadow-md rounded-2xl p-8 mb-8 border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Order Items</h2>
        {order.itemsDetails.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">SKU</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Unit Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.itemsDetails.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <img
                        src={item.variant.productImages.find((img) => img.isFeatured)?.url || item.variant.productImages[0]?.url || ""}
                        alt={item.variant.productImages.find((img) => img.isFeatured)?.alt || item.variant.productImages[0]?.alt || ""}
                        className="h-12 w-12 object-cover rounded-md border border-gray-200"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{item.variant.name}</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">{item.variant.sku}</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-4 py-4 text-right text-sm text-gray-900">{formatINR(item.unitPrice)}</td>
                    <td className="px-4 py-4 text-right text-sm text-gray-900">{formatINR(parseFloat(item.unitPrice) * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">No items found for this order.</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end space-x-4">
        <button
          onClick={handleGeneratePDF}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 font-medium"
        >
          Download Invoice PDF
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
          Update Status
        </button>
        <button
          onClick={handleDeleteOrder}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
        >
          Delete Order
        </button>
      </div>

      {/* Modal for Updating Status */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Update Order Status</h2>
            {updateError && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                {updateError}
              </div>
            )}
            <div className="mb-6">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Select Status
              </label>
              <select
                id="status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 p-3 text-sm"
              >
                <option value="">Select a status</option>
                {getAvailableStatuses(order.status).map((status) => (
                  <option key={status} value={status}>
                    {capitalize(status)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed font-medium"
                disabled={updateLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
                disabled={updateLoading || !newStatus}
              >
                {updateLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}