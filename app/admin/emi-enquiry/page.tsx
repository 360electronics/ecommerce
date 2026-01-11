"use client";

import { useEffect, useState } from "react";
import EnhancedTable, {
  ColumnDefinition,
} from "@/components/Layouts/TableLayout";
import {
  Phone,
  MessageCircle,
  X,
  CheckCircle,
  XCircle,
  User,
  IndianRupee,
  Calendar,
  CreditCard,
} from "lucide-react";
import { FaWhatsapp as Whatsapp } from "react-icons/fa6";
import { cn } from "@/lib/utils";

/* ---------------- TYPES ---------------- */

interface EmiAssistAdminRow {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  pan?: string | null;
  price: number;
  bank?: string | null;
  status: "pending" | "contacted" | "approved" | "rejected" | "converted";
  createdAt: string;
  productName?: string | null;
}

/* ---------------- STATUS COLORS ---------------- */

const EMI_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  contacted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  converted: "bg-purple-100 text-purple-800",
};

/* ---------------- API HELPERS ---------------- */

async function updateStatus(id: string, status: EmiAssistAdminRow["status"]) {
  await fetch(`/api/admin/emi-assist/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

/* ---------------- COLUMNS ---------------- */

const emiColumns: ColumnDefinition<EmiAssistAdminRow>[] = [
  {
    key: "name",
    header: "Customer",
    sortable: true,
    renderCell: (value, item) => (
      <div>
        <p className="font-medium">{value}</p>
        <p className="text-xs text-gray-500">{item.phone}</p>
      </div>
    ),
  },
  {
    key: "productName",
    header: "Product",
    sortable: true,
  },
  {
    key: "price",
    header: "Amount",
    align: "right",
    sortable: true,
    renderCell: (value) => `₹${value.toLocaleString()}`,
  },
  {
    key: "bank",
    header: "Bank",
    renderCell: (value) => value || "—",
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    filterOptions: [
      "pending",
      "contacted",
      "approved",
      "rejected",
      "converted",
    ],
    renderCell: (value) => (
      <span
        className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold",
          EMI_STATUS_COLORS[value]
        )}
      >
        {value.toUpperCase()}
      </span>
    ),
  },
  {
    key: "createdAt",
    header: "Requested On",
    sortable: true,
    renderCell: (value) => new Date(value).toLocaleDateString("en-IN"),
  },
];

/* ================================
   PAGE
================================ */

export default function AdminEmiAssistPage() {
  const [data, setData] = useState<EmiAssistAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EmiAssistAdminRow | null>(null);

  useEffect(() => {
    fetch("/api/admin/emi-assist")
      .then((res) => res.json())
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  /* ---------------- WHATSAPP LINK ---------------- */

  const getWhatsappLink = (item: EmiAssistAdminRow) => {
    const message = encodeURIComponent(
      `Hello ${item.name},\n\nWe are contacting you regarding EMI assistance for:\n${item.productName}\nAmount: ₹${item.price}\n\nOur team will guide you further.`
    );
    return `https://wa.me/91${item.phone}?text=${message}`;
  };

  return (
    <div className="p-6 space-y-6 relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">EMI Assist Requests</h1>
        <p className="text-sm text-gray-500">Manage customer EMI enquiries</p>
      </div>

      {/* Table */}
      <EnhancedTable<EmiAssistAdminRow>
        id="emi-assist-table"
        data={data}
        columns={emiColumns}
        search={{
          enabled: true,
          keys: ["name", "phone", "productName"],
        }}
        pagination={{
          enabled: true,
          defaultPageSize: 20,
        }}
        sorting={{
          enabled: true,
          defaultSortColumn: "createdAt",
          defaultSortDirection: "desc",
        }}
        customization={{
          statusColorMap: EMI_STATUS_COLORS,
          isLoading: loading,
          zebraStriping: true,
          rowHoverEffect: true,
        }}
        onRowClick={(item) => setSelected(item)}
      />

      {/* ================= DRAWER ================= */}
      {selected && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-100 min-h-screen"
            onClick={() => setSelected(null)}
          />

          {/* Drawer */}
          {/* ================= DRAWER ================= */}
          {selected && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/40 z-100 h-screen"
                onClick={() => setSelected(null)}
              />

              {/* Drawer */}
              <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[999] shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-lg">EMI Request</h3>
                  <button onClick={() => setSelected(null)} className=" cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                  <InfoRow
                    icon={<User />}
                    label="Customer"
                    value={selected.name}
                  />
                  <InfoRow
                    icon={<Phone />}
                    label="Phone"
                    value={selected.phone}
                  />
                  <InfoRow
                    icon={<CreditCard />}
                    label="Product"
                    value={selected.productName || "—"}
                  />
                  <InfoRow
                    icon={<IndianRupee />}
                    label="Amount"
                    value={`₹${selected.price.toLocaleString()}`}
                  />
                  <InfoRow
                    icon={<Calendar />}
                    label="Requested On"
                    value={new Date(selected.createdAt).toLocaleString()}
                  />

                  {/* ✅ STATUS SELECT */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500">
                      Status
                    </label>
                    <select
                      value={selected.status}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          status: e.target.value as EmiAssistAdminRow["status"],
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="contacted">Contacted</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="converted">Converted</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t space-y-3">
                  {/* Save Status */}
                  <button
                    onClick={async () => {
                      await updateStatus(selected.id, selected.status);

                      // ✅ optimistic update
                      setData((prev) =>
                        prev.map((row) =>
                          row.id === selected.id
                            ? { ...row, status: selected.status }
                            : row
                        )
                      );

                      setSelected(null);
                    }}
                    className="w-full py-2 rounded-lg bg-primary cursor-pointer text-white font-medium"
                  >
                    Save Status
                  </button>

                  {/* Call */}
                  <a
                    href={`tel:${selected.phone}`}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-blue-500 cursor-pointer text-white"
                  >
                    <Phone className="w-4 h-4" /> Call Customer
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={getWhatsappLink(selected)}
                    target="_blank"
                    className="flex items-center cursor-pointer justify-center gap-2 w-full py-2 rounded-lg bg-green-600 text-white"
                  >
                    <Whatsapp className="w-4 h-4" /> WhatsApp
                  </a>

                  {/* Delete */}
                  <button
                    onClick={async () => {
                      if (!confirm("Delete this EMI request?")) return;

                      await fetch(`/api/admin/emi-assist/${selected.id}`, {
                        method: "DELETE",
                      });

                      setData((prev) =>
                        prev.filter((row) => row.id !== selected.id)
                      );
                      setSelected(null);
                    }}
                    className="w-full py-2 rounded-lg bg-red-100 cursor-pointer text-red-700 font-medium"
                  >
                    Delete Request
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ---------------- SMALL COMPONENT ---------------- */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-500">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
