"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  EnhancedTable,
  type ColumnDefinition,
} from "@/components/Layouts/TableLayout";
import { Button } from "@/components/ui/button";

/* -------------------------------- TYPES -------------------------------- */

interface Order {
  id: string;
  customer: string;
  email: string;
  date: string;
  status: string;
  payment: string;
  total: number;
  items: number;
  shippingMethod: string;
}

type OrderTab = "confirmed" | "pending" | "cancelled" | "shipped" | "delivered" | "others" | "all";

/* --------------------------- UPDATE STATUS MODAL ------------------------- */

function UpdateOrderStatusModal({
  order,
  onClose,
  onSuccess,
}: {
  order: Order;
  onClose: () => void;
  onSuccess: (orderId: string, newStatus: string) => void;
}) {
  const [newStatus, setNewStatus] = useState(order.status);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleUpdateStatus = async () => {
    if (!order || !newStatus) return;

    try {
      setUpdateLoading(true);
      setUpdateError(null);

      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update order status");
      }

      onSuccess(order.id, newStatus);
      onClose();
    } catch (err) {
      console.error("[UpdateOrderStatusModal] error:", err);
      setUpdateError(
        err instanceof Error ? err.message : "Failed to update order status",
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-2">Update Order Status</h2>
        <p className="text-sm text-gray-600 mb-4">
          Order ID: <strong>{order.id}</strong>
        </p>

        <select
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="cancelled">Cancelled</option>
          <option value="delivered">Delivered</option>
          <option value="returned">Returned</option>
        </select>

        {updateError && (
          <p className="mt-3 text-sm text-red-600">{updateError}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={updateLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            disabled={updateLoading}
            className="bg-primary text-white"
          >
            {updateLoading ? "Updating..." : "Update"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- COMPONENT ------------------------------ */

export function OrdersTable() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderTab>("confirmed");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  /* ------------------------------ FETCH DATA ----------------------------- */

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/orders");
        const result = await res.json();

        if (!result.success) {
          throw new Error(result.message || "Failed to fetch orders");
        }

        const transformed: Order[] = result.data.map((o: any) => ({
          id: o.id,
          customer: o.customer,
          email: "",
          date: new Date(o.createdAt).toISOString().split("T")[0],
          status: o.status,
          payment: o.paymentStatus,
          total: Number(o.totalAmount),
          items: o.totalItems,
          shippingMethod:
            o.deliveryMode.charAt(0).toUpperCase() + o.deliveryMode.slice(1),
        }));

        setOrders(transformed);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  /* ----------------------------- TAB FILTER ------------------------------ */

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      switch (activeTab) {
        case "confirmed":
          return order.status === "confirmed";
        case "pending":
          return order.status === "pending";
        case "cancelled":
          return order.status === "cancelled";
        case "shipped":
          return order.status === "shipped";
        case "delivered":
          return order.status === "delivered";
        case "others":
          return ["failed", "returned"].includes(order.status);
        case "all":
        default:
          return true;
      }
    });
  }, [orders, activeTab]);

  const countByStatus = (status: OrderTab) => {
    if (status === "all") return orders.length;
    if (status === "others")
      return orders.filter((o) => ["failed", "returned"].includes(o.status))
        .length;

    return orders.filter((o) => o.status === status).length;
  };

  /* ----------------------------- TABLE COLUMNS ---------------------------- */

  const columns: ColumnDefinition<Order>[] = [
    { key: "id", header: "Order ID", sortable: true },
    { key: "customer", header: "Customer", sortable: true },
    { key: "date", header: "Date", sortable: true },
    { key: "status", header: "Status", sortable: true, align: "center" },
    { key: "payment", header: "Payment", sortable: true, align: "center" },
    {
      key: "total",
      header: "Total",
      sortable: true,
      align: "right",
      renderCell: (v) =>
        new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(Number(v)),
    },
    { key: "items", header: "Items", sortable: true, align: "center" },
    { key: "shippingMethod", header: "Shipping", sortable: true },
  ];

  /* -------------------------- BULK EDIT HANDLER -------------------------- */

  const handleEditOrder = useCallback((items: Order[]) => {
    if (items.length !== 1) return;
    setEditingOrder(items[0]);
    setIsUpdateModalOpen(true);
  }, []);

  const handleStatusUpdated = (orderId: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    );
    setSelectedOrders([]);
  };

  /* ----------------------------- UI STATES ------------------------------- */

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full" />
        <span className="ml-3">Loading orders...</span>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 bg-red-50 text-red-700 rounded-md">{error}</div>;
  }

  /* -------------------------------- RENDER ------------------------------- */

  return (
    <div className="mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 mt-1">
          Confirmed orders are shown by default
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { key: "confirmed", label: "Confirmed" },
          { key: "pending", label: "Pending" },
          { key: "cancelled", label: "Cancelled" },
          { key: "shipped", label: "Shipped" },
          { key: "delivered", label: "Delivered" },
          { key: "others", label: "Others" },
          { key: "all", label: "All" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as OrderTab)}
            className={`px-4 py-2 rounded-md text-sm font-medium border transition ${
              activeTab === tab.key
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs opacity-70">
              ({countByStatus(tab.key as OrderTab)})
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <EnhancedTable
        id="orders-table"
        data={filteredOrders}
        columns={columns}
        selection={{
          enabled: true,
          selectionKey: "id",
          onSelectionChange: setSelectedOrders,
        }}
        actions={{
          bulkActions: {
            edit: handleEditOrder,
          },
        }}
        search={{
          enabled: true,
          keys: ["id", "customer"],
        }}
        pagination={{
          enabled: true,
          pageSizeOptions: [10, 25, 50],
          defaultPageSize: 10,
        }}
        sorting={{
          enabled: true,
          defaultSortColumn: "date",
          defaultSortDirection: "desc",
        }}
        customization={{
          stickyHeader: true,
          rowHoverEffect: true,
        }}
        onRowClick={(order) => router.push(`/admin/orders/${order.id}`)}
      />

      {/* Update Status Modal */}
      {isUpdateModalOpen && editingOrder && (
        <UpdateOrderStatusModal
          order={editingOrder}
          onClose={() => {
            setIsUpdateModalOpen(false);
            setEditingOrder(null);
          }}
          onSuccess={handleStatusUpdated}
        />
      )}
    </div>
  );
}
