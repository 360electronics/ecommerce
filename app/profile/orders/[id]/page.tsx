"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { ArrowLeft, Download, PackageCheck, Truck, CheckCircle2, BadgeCheck, CreditCard, Receipt } from "lucide-react"

import ProfileLayout from "@/components/Layouts/ProfileLayout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type Order = {
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
  const [generatingPDF, setGeneratingPDF] = useState(false)

  const statusSteps = [
    { id: "confirmed", label: "Order Confirmed", icon: PackageCheck, description: "We've received your order" },
    { id: "shipped", label: "Shipped", icon: Truck, description: "Your order is on the way" },
    { id: "delivered", label: "Delivered", icon: CheckCircle2, description: "Delivered successfully" },
  ] as const

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/orders/${orderId}`)
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
          total: Number.parseFloat(apiOrder.orders.totalAmount),
          items: Array.isArray(apiOrder.orderItems) ? apiOrder.orderItems.length : apiOrder.orderItems ? 1 : 0,
          discountAmount: Number.parseFloat(apiOrder.orders.discountAmount) || 0,
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
                value: Number.parseFloat(apiOrder.orders.discountAmount) || 5,
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
    if (orderId) fetchOrder()
  }, [orderId])

  const subtotal = useMemo(() => {
    if (!order) return 0
    const itemsTotal = order.itemsDetails.reduce((sum, i) => sum + Number.parseFloat(i.unitPrice) * i.quantity, 0)
    return Math.max(itemsTotal, 0)
  }, [order])

  const formatINR = (amount: number | string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(typeof amount === "string" ? Number.parseFloat(amount) : amount)

  const capitalize = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str)

  const handleGeneratePDF = () => {
    if (!order) return
    setGeneratingPDF(true)
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

      const left = 20
      const right = 190
      const pageHeight = 297
      const bottom = 20

      doc.setFont("helvetica", "bold")
      doc.setFontSize(18)
      doc.text("INVOICE", left, 20)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text("360 Electronics Pvt Ltd.", right, 14, { align: "right" })
      doc.text("Coimbatore, Tamil Nadu - 641107", right, 19, { align: "right" })
      doc.text("360electronicspvtltd@gmail.com", right, 24, { align: "right" })

      // Order info
      doc.setFontSize(12)
      doc.text(`Order ID: ${order.id}`, left, 32)
      doc.text(`Date: ${order.date}`, left, 38)

      // Bill To
      doc.setFontSize(12)
      doc.text("BILL TO", left, 50)
      doc.setFontSize(10)
      const yStart = 56
      doc.text(order.address.fullName, left, yStart)
      doc.text(
        `${order.address.addressLine1}${order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""}`,
        left,
        yStart + 5,
      )
      doc.text(`${order.address.city}, ${order.address.state} ${order.address.postalCode}`, left, yStart + 10)
      doc.text(order.address.country, left, yStart + 15)
      doc.text(`Phone: ${order.address.phoneNumber}`, left, yStart + 20)
      doc.text(`Email: ${order.email || "N/A"}`, left, yStart + 25)

      // Summary (right)
      doc.setFontSize(12)
      doc.text("ORDER SUMMARY", right, 50, { align: "right" })
      doc.setFontSize(10)
      const sy = 56
      doc.text(`Status: ${capitalize(order.status)}`, right, sy, { align: "right" })
      doc.text(`Payment: ${capitalize(order.payment)}`, right, sy + 5, { align: "right" })
      doc.text(`Shipping: ${order.shippingMethod}`, right, sy + 10, { align: "right" })
      if (order.coupon) {
        const discountText =
          order.coupon.type === "percentage" ? `${order.coupon.value}%` : formatINR(order.coupon.value)
        doc.text(`Coupon: ${order.coupon.code} (${discountText})`, right, sy + 15, { align: "right" })
      }

      // Items table
      const tableHeaders = ["Product", "SKU", "Qty", "Unit Price", "Total"]
      const tableData = order.itemsDetails.map((item) => [
        item.variant.name,
        item.variant.sku,
        item.quantity.toString(),
        formatINR(item.unitPrice),
        formatINR(Number.parseFloat(item.unitPrice) * item.quantity),
      ])

      autoTable(doc, {
        startY: 85,
        head: [tableHeaders],
        body: tableData,
        styles: { fontSize: 10, cellPadding: 4, textColor: 20, overflow: "linebreak" },
        headStyles: { fillColor: [33, 37, 41], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 70, halign: "left" },
          1: { cellWidth: 30, halign: "center" },
          2: { cellWidth: 20, halign: "center" },
          3: { cellWidth: 30, halign: "right" },
          4: { cellWidth: 30, halign: "right" },
        },
        margin: { left: left, right: left },
      })

      const finalY = (doc as any).lastAutoTable.finalY || 110
      let y = finalY + 10
      doc.setFontSize(11)
      if (order.discountAmount) {
        doc.text("Discount:", 150, y, { align: "right" })
        doc.text(`- ${formatINR(order.discountAmount)}`, right, y, { align: "right" })
        y += 6
      }
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Total:", 150, y, { align: "right" })
      doc.text(formatINR(order.total), right, y, { align: "right" })

      // Footer
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      const footerText = "Thank you for shopping with 360 Electronics!"
      const textWidth = doc.getTextWidth(footerText)
      const pageWidth = 210
      const footerX = (pageWidth - textWidth) / 2
      doc.text(footerText, footerX, pageHeight - bottom)

      doc.save(`Invoice_${order.id}.pdf`)
    } finally {
      setGeneratingPDF(false)
    }
  }

  // Loading UI (full width, modern retail style)
  if (loading) {
    return (
      <ProfileLayout>
        <main className="min-h-[100dvh]">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="ghost" onClick={() => router.back()} className="gap-2 px-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>

            <div className="space-y-6">
              <div className="h-20 w-full bg-muted/50 rounded-xl animate-pulse" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="h-48 bg-muted/50 rounded-xl animate-pulse lg:col-span-2" />
                <div className="h-48 bg-muted/50 rounded-xl animate-pulse" />
              </div>
              <div className="h-12 w-40 bg-muted/50 rounded-lg animate-pulse" />
              <div className="h-80 w-full bg-muted/50 rounded-xl animate-pulse" />
            </div>
          </div>
        </main>
      </ProfileLayout>
    )
  }

  if (error || !order) {
    return (
      <ProfileLayout>
        <main className="min-h-[100dvh]">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
              <BadgeCheck className="h-8 w-8 rotate-45" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold">Order not found</h1>
            <p className="mt-2 text-muted-foreground">{error || "The order you’re looking for doesn’t exist."}</p>
            <div className="mt-6">
              <Link href="/profile/orders">
                <Button className="gap-2" variant="default">
                  <ArrowLeft className="h-4 w-4" />
                  Back to orders
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </ProfileLayout>
    )
  }

  const currentIndex = statusSteps.findIndex((s) => s.id === order.status)
  const progressPct = ((currentIndex + 1) / statusSteps.length) * 100

  return (
    <ProfileLayout>
      <main className="min-h-[100dvh] bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
          {/* Breadcrumb + header actions */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button variant="ghost" onClick={() => router.back()} className="gap-2 px-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <span>/</span>
              <Link href="/profile/orders" className="hover:underline">
                Orders
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">#{order.id}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="gap-2">
                <CreditCard className="h-3.5 w-3.5" />
                Payment: {capitalize(order.payment)}
              </Badge>
              <Button onClick={handleGeneratePDF} disabled={generatingPDF} className="gap-2">
                <Download className="h-4 w-4" />
                {generatingPDF ? "Preparing..." : "Download invoice"}
              </Button>
            </div>
          </div>

          {/* Hero header */}
          <section className="rounded-2xl border bg-white/80 backdrop-blur p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <PackageCheck className="h-4 w-4 text-emerald-600" />
                  <span>Order details</span>
                </div>
                <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">Order #{order.id}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Placed on{" "}
                  {new Date(order.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  className={`text-xs ${
                    order.status === "delivered"
                      ? "bg-emerald-100 text-emerald-800"
                      : order.status === "shipped"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {capitalize(order.status)}
                </Badge>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-6">
              <div className="relative">
                <div className="h-1.5 w-full rounded-full bg-muted" />
                <div
                  className="absolute left-0 top-0 h-1.5 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                {statusSteps.map((step, idx) => {
                  const Icon = step.icon
                  const isActive = idx <= currentIndex
                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full border flex items-center justify-center ${
                          isActive
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-white border-slate-200 text-slate-400"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isActive ? "text-foreground" : "text-slate-500"}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Summary + Address */}
          <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border bg-white p-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                Order summary
              </h2>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Row label="Order ID" value={order.id} />
                  <Row label="Date" value={order.date} />
                  <Row
                    label="Status"
                    value={
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.status === "delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : order.status === "shipped"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {capitalize(order.status)}
                      </span>
                    }
                  />
                </div>
                <div className="space-y-3">
                  <Row
                    label="Payment"
                    value={
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          order.payment === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {capitalize(order.payment)}
                      </span>
                    }
                  />
                  <Row label="Items" value={`${order.items} item${order.items > 1 ? "s" : ""}`} />
                  <Row label="Total" value={<span className="font-semibold">{formatINR(order.total)}</span>} />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Shipping method</h3>
                  <p className="mt-1">{order.shippingMethod}</p>
                  {!!order.discountAmount && (
                    <p className="mt-2 text-sm text-emerald-700">
                      Discount applied: -{formatINR(order.discountAmount)}
                    </p>
                  )}
                  {order.coupon && (
                    <p className="mt-2 text-sm">
                      Coupon:{" "}
                      <span className="font-medium">
                        {order.coupon.code}{" "}
                        {order.coupon.type === "percentage"
                          ? `(${order.coupon.value}%)`
                          : `(${formatINR(order.coupon.value)})`}
                      </span>
                    </p>
                  )}
                </div>
                <div className="rounded-xl border p-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Payment breakdown</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatINR(subtotal)}</span>
                    </div>
                    {order.discountAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Discount</span>
                        <span>-{formatINR(order.discountAmount)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex items-center justify-between font-medium">
                      <span>Total</span>
                      <span>{formatINR(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <h2 className="text-lg font-semibold">Customer & shipping</h2>
              <Separator className="my-4" />
              <div className="space-y-4">
                <Row label="Name" value={order.customer} />
                <Row label="Email" value={order.email || "N/A"} />
                <Row label="Phone" value={order.address.phoneNumber} />
                <Separator />
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Shipping address</h3>
                  <p className="mt-1">{order.address.fullName}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.address.addressLine1}
                    {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.address.city}, {order.address.state} {order.address.postalCode}
                  </p>
                  <p className="text-sm text-muted-foreground">{order.address.country}</p>
                  <p className="mt-1 inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-xs">
                    {order.address.addressType}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Items */}
          <section className="mt-8 rounded-2xl border bg-white p-6">
            <h2 className="text-lg font-semibold">Order items</h2>
            <Separator className="my-4" />
            {order.itemsDetails.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground border-b">
                      <th className="py-3 pr-3 font-medium">Item</th>
                      <th className="py-3 pr-3 font-medium">SKU</th>
                      <th className="py-3 pr-3 font-medium text-center">Qty</th>
                      <th className="py-3 pr-3 font-medium text-right">Unit price</th>
                      <th className="py-3 pl-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.itemsDetails.map((item) => {
                      const featured =
                        item.variant.productImages.find((img) => img.isFeatured) || item.variant.productImages[0]
                      return (
                        <tr key={item.id} className="border-b last:border-b-0">
                          <td className="py-4 pr-3">
                            <div className="flex items-center gap-3">
                              {featured?.url ? (
                                <img
                                  src={featured.url || "/placeholder.svg"}
                                  alt={featured.alt || item.variant.name}
                                  className="h-12 w-12 rounded border object-cover"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded border bg-muted" />
                              )}
                              <div className="min-w-0">
                                <p className="font-medium truncate">{item.variant.name}</p>
                                <p className="text-xs text-muted-foreground">Product ID: {item.productId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 pr-3">{item.variant.sku}</td>
                          <td className="py-4 pr-3 text-center">{item.quantity}</td>
                          <td className="py-4 pr-3 text-right">{formatINR(item.unitPrice)}</td>
                          <td className="py-4 pl-3 text-right">
                            {formatINR(Number.parseFloat(item.unitPrice) * item.quantity)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No items found for this order.</p>
            )}
          </section>

          {/* Bottom actions */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Link href="/profile/orders">
              <Button variant="secondary" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to orders
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                Paid via {capitalize(order.payment)}
              </Badge>
              <span>&middot;</span>
              <span>
                {order.items} item{order.items > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </main>
    </ProfileLayout>
  )
}

function Row({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  )
}
