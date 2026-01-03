"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import EnhancedTable, {
  ColumnDefinition,
} from "@/components/Layouts/TableLayout";
import { CustomTabs } from "@/components/ui/customTabs";
import CouponModal from "@/components/Admin/Coupon/CouponsModal";
import { Pencil, Trash2 } from "lucide-react";
import ConfirmDeleteModal from "@/components/Admin/Coupon/ConfirmDeleteModal";

/* ---------------- TYPES ---------------- */

interface SpecialCoupon {
  id: string;
  code: string;
  amount?: string;
  percentage?: string;
  limit: string;
  minOrderAmount: string;
  expiryDate: string;
  createdAt: string;
}

interface ReferralCoupon {
  id: string;
  code: string;
  amount: string;
  isUsed: boolean;
  expiryDate: string;
  createdAt: string;
  user?: {
    email?: string;
  };
}

/* ---------------- PAGE ---------------- */

export default function AdminCouponsPage() {
  const router = useRouter();

  const [specialCoupons, setSpecialCoupons] = useState<SpecialCoupon[]>([]);
  const [referralCoupons, setReferralCoupons] = useState<ReferralCoupon[]>([]);
  const [activeTab, setActiveTab] = useState<"special" | "referral">("special");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingCoupon, setEditingCoupon] = useState<SpecialCoupon | null>(
    null
  );

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingCoupon, setDeletingCoupon] = useState<SpecialCoupon | null>(
    null
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  /* ---------------- FETCH DATA ---------------- */

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [specialRes, referralRes] = await Promise.all([
        fetch("/api/admin/coupons/special"),
        fetch("/api/admin/coupons/referral"),
      ]);

      const specialJson = await specialRes.json();
      const referralJson = await referralRes.json();

      setSpecialCoupons(specialJson.coupons || []);
      setReferralCoupons(referralJson.data || []);
      setLoading(false);
    };

    load();
  }, []);

  /* ---------------- COLUMNS ---------------- */

  const specialColumns: ColumnDefinition<SpecialCoupon>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
    },
    {
      key: "amount",
      header: "Discount",
      renderCell: (_, item) =>
        item.amount ? `₹${item.amount}` : `${item.percentage}%`,
    },
    {
      key: "limit",
      header: "Limit",
      align: "center",
    },
    {
      key: "minOrderAmount",
      header: "Min Order",
      renderCell: (v) => `₹${v}`,
    },
    {
      key: "expiryDate",
      header: "Expiry",
      renderCell: (v) => new Date(v).toLocaleDateString(),
      sortable: true,
    },

    // ✅ ACTIONS COLUMN (ADD THIS)
    {
      key: "id",
      header: "Actions",
      align: "center",
      renderCell: (_, item) => (
        <div className="flex items-center justify-start gap-3">
          {/* EDIT */}
          <button
            onClick={() => {
              setModalMode("edit");
              setEditingCoupon(item);
              setModalOpen(true);
            }}
            className="p-2 rounded-lg cursor-pointer hover:bg-primary/10 text-primary"
            title="Edit coupon"
          >
            <Pencil size={16} />
          </button>

          {/* DELETE */}
          <button
            onClick={() => {
              setDeletingCoupon(item);
              setDeleteOpen(true);
            }}
            className="p-2 rounded-lg cursor-pointer hover:bg-red-200 text-red-600"
            title="Delete coupon"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const referralColumns: ColumnDefinition<ReferralCoupon>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
    },
    {
      key: "user",
      header: "User",
      renderCell: (_, item) => item.user?.email || "—",
    },
    {
      key: "amount",
      header: "Amount",
      renderCell: (v) => `₹${v}`,
    },
    {
      key: "isUsed",
      header: "Status",
      renderCell: (v) => (
        <Badge
          variant="outline"
          className={
            v
              ? "bg-red-100 text-red-700 border-red-300"
              : "bg-green-100 text-green-700 border-green-300"
          }
        >
          {v ? "Used" : "Unused"}
        </Badge>
      ),
      filterOptions: [
        { value: "true", label: "Used" },
        { value: "false", label: "Unused" },
      ],
      filterFn: (item, value) => String(item.isUsed) === value,
    },
    {
      key: "expiryDate",
      header: "Expiry",
      renderCell: (v) => new Date(v).toLocaleDateString(),
    },
  ];

  /* ---------------- RENDER ---------------- */

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Coupon Management</h1>
      </div>

      {/* Tabs */}
      <CustomTabs
        tabs={[
          { key: "special", label: "Special Coupons" },
          { key: "referral", label: "Referral Coupons" },
        ]}
        active={activeTab}
        onChange={(key) => setActiveTab(key as "special" | "referral")}
      />

      {/* SPECIAL COUPONS */}
      {activeTab === "special" && (
        <EnhancedTable
          id="special-coupons"
          data={specialCoupons}
          columns={specialColumns}
          search={{
            enabled: true,
            keys: ["code"],
            placeholder: "Search coupon code...",
          }}
          sorting={{
            enabled: true,
            defaultSortColumn: "createdAt",
            defaultSortDirection: "desc",
          }}
          pagination={{
            enabled: true,
            defaultPageSize: 10,
          }}
          actions={{
            onAdd: () => {
              setModalMode("create");
              setEditingCoupon(null);
              setModalOpen(true);
            },
            addButtonText: "Create Coupon",
            rowActions: {
              edit: (item) => {
                setModalMode("edit");
                setEditingCoupon(item);
                setModalOpen(true);
              },
              delete: async (item) => {
                await fetch(`/api/admin/coupons/special/${item.id}`, {
                  method: "DELETE",
                });
                setSpecialCoupons((prev) =>
                  prev.filter((c) => c.id !== item.id)
                );
              },
            },
          }}
          customization={{
            isLoading: loading,
            rowHoverEffect: true,
            zebraStriping: true,
          }}
        />
      )}

      <CouponModal
        open={modalOpen}
        mode={modalMode}
        initialData={editingCoupon}
        onClose={() => setModalOpen(false)}
        onSuccess={(coupon) => {
          setSpecialCoupons((prev) =>
            modalMode === "create"
              ? [coupon, ...prev]
              : prev.map((c) => (c.id === coupon.id ? coupon : c))
          );
        }}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        title="Delete Coupon"
        description={`Are you sure you want to delete coupon "${deletingCoupon?.code}"? This action cannot be undone.`}
        loading={deleteLoading}
        onCancel={() => {
          setDeleteOpen(false);
          setDeletingCoupon(null);
        }}
        onConfirm={async () => {
          if (!deletingCoupon) return;

          setDeleteLoading(true);

          await fetch(`/api/admin/coupons/special/${deletingCoupon.id}`, {
            method: "DELETE",
          });

          setSpecialCoupons((prev) =>
            prev.filter((c) => c.id !== deletingCoupon.id)
          );

          setDeleteLoading(false);
          setDeleteOpen(false);
          setDeletingCoupon(null);
        }}
      />

      {/* REFERRAL COUPONS */}
      {activeTab === "referral" && (
        <EnhancedTable
          id="referral-coupons"
          data={referralCoupons}
          columns={referralColumns}
          search={{
            enabled: true,
            keys: ["code"],
            placeholder: "Search referral coupon...",
          }}
          filters={{ enabled: true }}
          pagination={{
            enabled: true,
            defaultPageSize: 10,
          }}
          customization={{
            isLoading: loading,
            rowHoverEffect: true,
            zebraStriping: true,
          }}
        />
      )}
    </div>
  );
}
