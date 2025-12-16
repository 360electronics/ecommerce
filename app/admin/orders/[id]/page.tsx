"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Download,
  Edit3,
  Trash2,
  Calendar,
  Package,
  CreditCard,
  Tag,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Truck,
  IndianRupee,
  User,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";

// Define Order type
interface Order {
  id: string;
  customer: string;
  email: string;
  date: string;
  status: string;
  payment: string;
  total: string;
  items: number;
  discountAmount: number;
  shippingMethod: string;
  address: {
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: string;
  };
  itemsDetails: {
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    unitPrice: string;
    variant: {
      name: string;
      sku: string;
      productImages: { url: string; alt: string; isFeatured: boolean }[];
    };
  }[];
  coupon?: {
    code: string;
    type: "amount" | "percentage";
    value: number;
    couponId: string;
    couponType: "individual" | "special";
  } | null;
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Status rules (unchanged)
  const statusOrder = [
    "confirmed",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
  ];
  const getAvailableStatuses = (currentStatus: string) => {
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex === -1) return [];
    return statusOrder.slice(currentIndex + 1); // Only future statuses
  };

  // Fetch logic (unchanged) ...

  // Status icon & color mapping
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          icon: Clock,
          color: "bg-amber-100 text-amber-800 border-amber-200",
          label: "Confirmed",
        };
      case "shipped":
        return {
          icon: Truck,
          color: "bg-blue-100 text-blue-800 border-blue-200",
          label: "Shipped",
        };
      case "delivered":
        return {
          icon: CheckCircle,
          color: "bg-green-100 text-green-800 border-green-200",
          label: "Delivered",
        };
      case "cancelled":
        return {
          icon: XCircle,
          color: "bg-red-100 text-red-800 border-red-200",
          label: "Cancelled",
        };
      case "returned":
        return {
          icon: AlertTriangle,
          color: "bg-orange-100 text-orange-800 border-orange-200",
          label: "Returned",
        };
      default:
        return {
          icon: Clock,
          color: "bg-gray-100 text-gray-800 border-gray-200",
          label: "Unknown",
        };
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders?id=${orderId}`);
        const result = await response.json();

        if (!result.success || !result.data || result.data.length === 0) {
          throw new Error(result.message || "Order not found");
        }

        const apiOrder = result.data[0];
        const transformedOrder: Order = {
          id: apiOrder.orders.id,
          customer: apiOrder.savedAddresses.fullName,
          email: "",
          date: new Date(apiOrder.orders.createdAt).toISOString().split("T")[0],
          status: apiOrder.orders.status,
          payment: apiOrder.orders.paymentStatus,
          total: apiOrder.orders.totalAmount?.toString() ?? "0",
          items: Array.isArray(apiOrder.orderItems)
            ? apiOrder.orderItems.length
            : apiOrder.orderItems
            ? 1
            : 0,
          discountAmount: apiOrder.orders.discountAmount?.toString() ?? "0",
          shippingMethod:
            apiOrder.orders.deliveryMode.charAt(0).toUpperCase() +
            apiOrder.orders.deliveryMode.slice(1),
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
                type:
                  apiOrder.orders.discountAmount !== "0.00"
                    ? "amount"
                    : "percentage",
                value: parseFloat(apiOrder.orders.discountAmount) || 5,
                couponId: apiOrder.orders.couponId,
                couponType:
                  apiOrder.orders.couponCode === "RED360"
                    ? "special"
                    : "individual",
              }
            : null,
        };

        setOrder(transformedOrder);
        setNewStatus(transformedOrder.status);
        setError(null);
      } catch (err) {
        console.error("[OrderDetailsPage] Fetch error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch order details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleUpdateStatus = async () => {
    if (!order || !newStatus) return;

    try {
      setUpdateLoading(true);
      setUpdateError(null);

      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to update order status");
      }

      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      setIsModalOpen(false);
    } catch (err) {
      console.error("[OrderDetailsPage] Update error:", err);
      setUpdateError(
        err instanceof Error ? err.message : "Failed to update order status"
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle delete order
  const handleDeleteOrder = async () => {
    if (
      !order ||
      !window.confirm(`Are you sure you want to delete order ${order.id}?`)
    )
      return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to delete order");
      }

      router.push("/admin/orders");
    } catch (err) {
      console.error("[OrderDetailsPage] Delete error:", err);
      setError(err instanceof Error ? err.message : "Failed to delete order");
    }
  };

  // Handle PDF generation with jsPDF and jspdf-autotable
  const handleGeneratePDF = () => {
    if (!order) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Fonts & Setup
    const leftMargin = 20;
    const rightMargin = 190;
    const pageHeight = 297; // A4 height in mm
    const bottomMargin = 20; // Margin from bottom for footer

    doc.setFont("helvetica", "normal");

    const logoUrl = "/red-logo.png"; // Replace with your logo
    doc.addImage(logoUrl, "PNG", leftMargin, 10, 15, 15); // Logo at top-left, 50mm wide, 15mm tall

    // Header
    doc.setFontSize(18);
    doc.text("ORDER INVOICE", leftMargin, 35); // Adjusted Y to account for logo
    doc.setFontSize(10);
    doc.text("360 Electronics", rightMargin, 20, { align: "right" });
    doc.text("Coimbatore, Tamil Nadu - 641107", rightMargin, 26, {
      align: "right",
    });
    doc.text("360electronicspvtltd@gmail.com", rightMargin, 32, {
      align: "right",
    });

    // Order Info
    doc.setFontSize(12);
    doc.text(`Order ID: ${order.id}`, leftMargin, 40);
    doc.text(`Date: ${order.date}`, leftMargin, 46);

    // Line separator
    doc.setLineWidth(0.5);
    doc.line(leftMargin, 52, rightMargin, 52);

    // Bill To
    doc.setFontSize(12);
    doc.text("BILL TO", leftMargin, 60);
    doc.setFontSize(10);
    const addressYStart = 66;
    doc.text(order.address.fullName, leftMargin, addressYStart);
    doc.text(
      `${order.address.addressLine1}${
        order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""
      }`,
      leftMargin,
      addressYStart + 6
    );
    doc.text(
      `${order.address.city}, ${order.address.state} ${order.address.postalCode}`,
      leftMargin,
      addressYStart + 12
    );
    doc.text(order.address.country, leftMargin, addressYStart + 18);
    doc.text(
      `Phone: ${order.address.phoneNumber}`,
      leftMargin,
      addressYStart + 24
    );
    doc.text(`Email: ${order.email || "N/A"}`, leftMargin, addressYStart + 30);

    // Order Summary
    doc.setFontSize(12);
    doc.text("ORDER SUMMARY", rightMargin, 60, { align: "right" });
    doc.setFontSize(10);
    const summaryY = 66;
    doc.text(`Status: ${capitalize(order.status)}`, rightMargin, summaryY, {
      align: "right",
    });
    doc.text(
      `Payment: ${capitalize(order.payment)}`,
      rightMargin,
      summaryY + 6,
      { align: "right" }
    );
    doc.text(`Shipping: ${order.shippingMethod}`, rightMargin, summaryY + 12, {
      align: "right",
    });
    if (order.coupon) {
      const discountText =
        order.coupon.type === "percentage"
          ? `${order.coupon.value}%`
          : `₹${order.coupon.value}`;
      doc.text(
        `Coupon: ${order.coupon.code} (${discountText})`,
        rightMargin,
        summaryY + 18,
        {
          align: "right",
        }
      );
    }

    // Items Table
    const tableHeaders = ["Product", "SKU", "Qty", "Unit Price", "Total"];
    const tableData = order.itemsDetails.map((item) => [
      item.variant.name,
      item.variant.sku,
      item.quantity.toString(),
      Number(item.unitPrice),
      Number(item.unitPrice) * Number(item.quantity),
    ]);

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
    });

    // Totals
    const finalY = (doc as any).lastAutoTable.finalY || 105;
    doc.setFontSize(11);
    let y = finalY + 10;

    if (order.discountAmount) {
      doc.text("Discount:", 150, y, { align: "right" });
      doc.text(`- ${order.discountAmount}`, rightMargin, y, { align: "right" });
      y += 6;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total:", 150, y, { align: "right" });
    doc.text(order.total, rightMargin, y, { align: "right" });

    // Footer
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const footerText = "Thank you for shopping with 360 Electronics!";
    const textWidth = doc.getTextWidth(footerText);
    const pageWidth = 210; // A4 width in mm
    const footerX = (pageWidth - textWidth) / 2; // Center horizontally
    doc.text(footerText, footerX, pageHeight - bottomMargin);

    // Save
    doc.save(`Invoice_${order.id}.pdf`);
  };

  // Helper functions
  const formatINR = (amount: number | string) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(typeof amount === "string" ? parseFloat(amount) : amount);

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-medium text-gray-600">
          Loading order details...
        </p>
      </div>
    );
  }

  // Error State
  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
        <XCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Order Not Found
        </h2>
        <p className="text-gray-600 text-center max-w-md mb-8">
          {error ||
            "The order you're looking for doesn't exist or has been removed."}
        </p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Orders
        </Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
              Order #{order.id}
            </h1>
            <p className="mt-2 text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Placed on{" "}
              {new Date(order.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Orders
          </Link>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-2">Order Status</p>
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${statusConfig.color}`}
            >
              <statusConfig.icon className="w-4 h-4" />
              {statusConfig.label}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-2">Payment Status</p>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <span
                className={`font-semibold ${
                  order.payment === "paid" ? "text-green-600" : "text-gray-700"
                }`}
              >
                {capitalize(order.payment)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-2">Total Amount</p>
            <p className="text-2xl font-bold text-gray-900 flex items-center gap-1">
              <IndianRupee className="w-6 h-6" />
              {formatINR(order.total).replace("₹", "")}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-2">Total Items</p>
            <p className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6" />
              {order.items}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Customer & Address */}
          <div className="space-y-6">
            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Shipping Address
              </h3>
              <div className="space-y-3 text-sm">
                <p className="font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {order.address.fullName}
                </p>
                <p className="text-gray-600">{order.address.addressLine1}</p>
                {order.address.addressLine2 && (
                  <p className="text-gray-600">{order.address.addressLine2}</p>
                )}
                <p className="text-gray-600">
                  {order.address.city}, {order.address.state} -{" "}
                  {order.address.postalCode}
                </p>
                <p className="text-gray-600">{order.address.country}</p>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                  <p className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {order.address.phoneNumber}
                  </p>
                  {order.email && (
                    <p className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" />
                      {order.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Coupon Card */}
            {order.coupon && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Tag className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      Coupon Applied
                    </p>
                    <p className="text-2xl font-bold text-purple-700">
                      {order.coupon.code}
                    </p>
                  </div>
                </div>
                <p className="text-purple-700 font-medium">
                  {order.coupon.type === "percentage"
                    ? `${order.coupon.value}% Discount`
                    : `${formatINR(order.coupon.value)} Off`}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Order Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Order Items ({order.items})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3 text-center">SKU</th>
                      <th className="px-6 py-3 text-center">Qty</th>
                      <th className="px-6 py-3 text-right">Price</th>
                      <th className="px-6 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.itemsDetails.map((item) => {
                      const imageUrl =
                        item.variant.productImages.find((img) => img.isFeatured)
                          ?.url ||
                        item.variant.productImages[0]?.url ||
                        "/placeholder.png";
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-6 py-4 flex items-center gap-4">
                            <img
                              src={imageUrl}
                              alt={item.variant.name}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                            />
                            <span className="font-medium text-gray-900">
                              {item.variant.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            {item.variant.sku}
                          </td>
                          <td className="px-6 py-4 text-center font-medium">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 text-right text-gray-700">
                            {formatINR(item.unitPrice)}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">
                            {formatINR(
                              parseFloat(item.unitPrice) * item.quantity
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4 sm:px-6 lg:px-8 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-end gap-4">
            <button
              onClick={handleGeneratePDF}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium shadow-md"
            >
              <Download className="w-5 h-5" />
              Download Invoice
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-md"
            >
              <Edit3 className="w-5 h-5" />
              Update Status
            </button>
            <button
              onClick={handleDeleteOrder}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium shadow-md"
            >
              <Trash2 className="w-5 h-5" />
              Delete Order
            </button>
          </div>
        </div>

        {/* Status Update Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Update Order Status
              </h2>
              {updateError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {updateError}
                </div>
              )}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose next status...</option>
                  {getAvailableStatuses(order.status).map((status) => (
                    <option key={status} value={status}>
                      {capitalize(status)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  disabled={updateLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={!newStatus || updateLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition font-medium"
                >
                  {updateLoading ? "Updating..." : "Update Status"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
