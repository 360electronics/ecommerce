"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import ProfileLayout from "@/components/Layouts/ProfileLayout"

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

  // Status steps for tracking
  const statusSteps = [
    { 
      id: "confirmed", 
      label: "Order Confirmed",
      icon: "M9 12l2 2 4-4",
      description: "We've received your order"
    },
    { 
      id: "shipped", 
      label: "Shipped",
      icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      description: "Your order is on the way"
    },
    { 
      id: "delivered", 
      label: "Delivered",
      icon: "M5 13l4 4L19 7",
      description: "Order delivered successfully"
    },
  ]

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
          total: parseFloat(apiOrder.orders.totalAmount),
          items: Array.isArray(apiOrder.orderItems) ? apiOrder.orderItems.length : apiOrder.orderItems ? 1 : 0,
          discountAmount: parseFloat(apiOrder.orders.discountAmount) || 0,
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

    // Logo (replace with your actual SVG logo URL or inline SVG string)
    const logoSvgUrl = "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/svg/logo.svg" // Placeholder SVG URL
    doc.addSvgAsImage(logoSvgUrl, leftMargin, 10, 50, 15) // SVG logo at top-left, 50mm wide, 15mm tall

    // Header
    doc.setFontSize(18)
    doc.text("INVOICE", leftMargin, 35)
    doc.setFontSize(10)
    doc.text("360 Electronics Pvt Ltd.", rightMargin, 20, { align: "right" })
    doc.text("Coimbatore, Tamil Nadu - 641107", rightMargin, 26, { align: "right" })
    doc.text("360electronicspvtltd@gmail.com", rightMargin, 32, { align: "right" })

    // Order Info
    doc.setFontSize(12)
    doc.text(`Order ID: ${order.id}`, leftMargin, 45)
    doc.text(`Date: ${order.date}`, leftMargin, 51)

    // Line separator
    doc.setLineWidth(0.5)
    doc.line(leftMargin, 57, rightMargin, 57)

    // Bill To
    doc.setFontSize(12)
    doc.text("BILL TO", leftMargin, 65)
    doc.setFontSize(10)
    const addressYStart = 71
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
    doc.text("ORDER SUMMARY", rightMargin, 65, { align: "right" })
    doc.setFontSize(10)
    const summaryY = 71
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
      formatINR(item.unitPrice),
      formatINR(parseFloat(item.unitPrice) * item.quantity),
    ])

    autoTable(doc, {
      startY: 110,
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
    const finalY = (doc as any).lastAutoTable.finalY || 110
    doc.setFontSize(11)
    let y = finalY + 10

    if (order.discountAmount) {
      doc.text("Discount:", 150, y, { align: "right" })
      doc.text(`- ${formatINR(order.discountAmount)}`, rightMargin, y, { align: "right" })
      y += 6
    }

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("Total:", 150, y, { align: "right" })
    doc.text(formatINR(order.total), rightMargin, y, { align: "right" })

    // Footer
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    const footerText = "Thank you for shopping with 360 Electronics!"
    const textWidth = doc.getTextWidth(footerText)
    const pageWidth = 210
    const footerX = (pageWidth - textWidth) / 2
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
      <ProfileLayout>
        <div className="flex justify-center items-center min-h-screen ">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-blue-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-2">Loading order details...</p>
            <p className="text-sm text-gray-500">Please wait while we fetch your order information</p>
          </div>
        </div>
      </ProfileLayout>
    )
  }

  if (error || !order) {
    return (
      <ProfileLayout>
        <div className="flex justify-center items-center min-h-screen ">
          <div className="text-center p-8 bg-white rounded-3xl  border border-red-100 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h3>
            <p className="text-gray-600 mb-6">{error || "The order you're looking for doesn't exist or has been removed."}</p>
            <Link
              href="/profile/orders"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 -lg hover:"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Orders
            </Link>
          </div>
        </div>
      </ProfileLayout>
    )
  }

  return (
    <ProfileLayout>
      <div className="min-h-screen ">
        <div className=" mx-auto  sm:px-6 lg:px-8 py-8">
          {/* Enhanced Page Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl  mb-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            <div className="relative px-8 py-12">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
                <div className="mb-6 lg:mb-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-blue-100 text-sm font-medium uppercase tracking-wider">Order Details</span>
                  </div>
                  <h1 className="text-xl lg:text-5xl font-bold text-white mb-2">
                    Order #{order.id}
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Placed on {new Date(order.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/profile/orders"
                    className="inline-flex items-center px-3 py-2  bg-white/10 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-white/20 text-sm transition-all duration-300 border border-white/20"
                  >
                    <svg className="w-10 h-10 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Orders
                  </Link>
                  <button
                    onClick={handleGeneratePDF}
                    className="inline-flex items-center text-sm px-3 py-2 bg-white text-blue-700 font-medium rounded-xl hover:bg-blue-50 transition-all duration-300 -lg hover: transform hover:-translate-y-0.5"
                  >
                    <svg className="w-10 h-10 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Order Tracking */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl  p-8 mb-8 border border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Order Progress</h2>
              <div className="text-right">
                <p className="text-sm text-gray-500">Current Status</p>
                <p className="text-lg font-semibold text-blue-600">{capitalize(order.status)}</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute top-6 left-0 w-full h-1 bg-gray-200 rounded-full"></div>
              <div 
                className="absolute top-6 left-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000"
                style={{ 
                  width: `${((statusSteps.findIndex(s => s.id === order.status) + 1) / statusSteps.length) * 100}%` 
                }}
              ></div>
              
              <div className="relative flex justify-between">
                {statusSteps.map((step, index) => {
                  const currentStatusIndex = statusSteps.findIndex((s) => s.id === order.status)
                  const isCompleted = index <= currentStatusIndex
                  const isCurrent = index === currentStatusIndex

                  return (
                    <div key={step.id} className="flex flex-col items-center text-center max-w-xs">
                      <div className="relative mb-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                            isCompleted 
                              ? "bg-blue-600 border-blue-600 text-white -lg" 
                              : "bg-gray-100 border-gray-300 text-gray-400"
                          } ${isCurrent ? "ring-4 ring-blue-200 scale-110" : ""}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={step.icon} />
                          </svg>
                        </div>
                        {isCompleted && (
                          <div className="absolute inset-0 w-12 h-12 rounded-full bg-blue-600 animate-ping opacity-20"></div>
                        )}
                      </div>
                      <h3 className={`font-semibold text-sm md:text-lg mb-1 ${isCompleted ? "text-gray-900" : "text-gray-500"}`}>
                        {step.label}
                      </h3>
                      <p className={` text-xs md:text-sm ${isCompleted ? "text-gray-600" : "text-gray-400"}`}>
                        {step.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
            {/* Enhanced Order Summary Card */}
            <div className="xl:col-span-2 bg-white backdrop-blur-sm rounded-3xl  p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Order Summary</h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600 font-medium">Active</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="group hover:bg-gray-50 rounded-xl p-4 transition-colors duration-200">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Order ID</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{order.id}</p>
                  </div>
                  
                  <div className="group hover:bg-gray-50 rounded-xl p-4 transition-colors duration-200">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Date</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{order.date}</p>
                  </div>
                  
                  <div className="group hover:bg-gray-50 rounded-xl p-4 transition-colors duration-200">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Status</label>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                          order.status === "confirmed"
                            ? "bg-blue-100 text-blue-800 ring-1 ring-blue-200"
                            : order.status === "shipped"
                            ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                            : order.status === "delivered"
                            ? "bg-green-100 text-green-800 ring-1 ring-green-200"
                            : order.status === "cancelled" || order.status === "returned"
                            ? "bg-red-100 text-red-800 ring-1 ring-red-200"
                            : "bg-gray-100 text-gray-800 ring-1 ring-gray-200"
                        }`}
                      >
                        {capitalize(order.status)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="group hover:bg-gray-50 rounded-xl p-4 transition-colors duration-200">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Payment Status</label>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                          order.payment === "paid" 
                            ? "bg-green-100 text-green-800 ring-1 ring-green-200" 
                            : "bg-gray-100 text-gray-800 ring-1 ring-gray-200"
                        }`}
                      >
                        {capitalize(order.payment)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="group hover:bg-gray-50 rounded-xl p-4 transition-colors duration-200">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Amount</label>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatINR(order.total)}</p>
                  </div>
                  
                  <div className="group hover:bg-gray-50 rounded-xl p-4 transition-colors duration-200">
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Items</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{order.items} item{order.items > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Shipping Method</label>
                    <p className="text-lg font-semibold text-gray-900 mt-1">{order.shippingMethod}</p>
                  </div>
                  {order.discountAmount > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Discount Applied</label>
                      <p className="text-lg font-semibold text-green-600 mt-1">-{formatINR(order.discountAmount)}</p>
                    </div>
                  )}
                  {order.coupon && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Coupon Used</label>
                      <div className="mt-2 inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                        <svg className="w-4 h-4 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="font-semibold text-purple-800">
                          {order.coupon.code} (
                          {order.coupon.type === "percentage"
                            ? `${order.coupon.value}%`
                            : formatINR(order.coupon.value)}
                          )
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Customer Information and Shipping Address */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl  p-8 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer & Shipping</h2>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                  <div className="space-y-4">
                    <div className="group hover:bg-gray-50 rounded-xl p-4 transition-colors duration-200">
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Name</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{order.customer}</p>
                    </div>
                    <div className="group hover:bg-gray-50 rounded-xl p-4 transition-colors duration-200">
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Email</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{order.email || "N/A"}</p>
                    </div>
                    <div className="group hover:bg-gray-50 rounded-xl p-4 transition-colors duration-200">
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Phone</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{order.address.phoneNumber}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
                  <div className="space-y-4">
                    <div className="group hover:bg-gray-50 rounded-xl p-4 transition-colors duration-200">
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Recipient</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{order.address.fullName}</p>
                    </div>
                    <div className="group hover:bg-gray-50 rounded-xl p-4 transition-colors duration-200">
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Address</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {order.address.addressLine1}{order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {order.address.city}, {order.address.state} {order.address.postalCode}
                      </p>
                      <p className="text-lg font-semibold text-gray-900">{order.address.country}</p>
                    </div>
                    <div className="group hover:bg-gray-50 rounded-xl p-4 transition-colors duration-200">
                      <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Address Type</label>
                      <p className="text-lg font-semibold text-gray-900 mt-1">{order.address.addressType}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl  p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Items</h2>
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
        </div>
      </div>
    </ProfileLayout>
  )
}