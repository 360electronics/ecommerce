"use client";

import { useEffect, useState } from "react";

type Store = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  lat?: number;
  lng?: number;
};

export default function AdminStoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<Store>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  // fetch stores once on mount
  useEffect(() => {
    fetchStores();
  }, []);

  async function fetchStores() {
    const res = await fetch("/api/stores");
    const data = await res.json();
    setStores(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      // edit store
      await fetch(`/api/stores/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      // add new store
      await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setForm({});
    setEditingId(null);
    setIsModalOpen(false);
    fetchStores();
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this store?")) return;
    await fetch(`/api/stores/${id}`, { method: "DELETE" });
    fetchStores();
  }

  function openEditModal(store: Store) {
    setForm(store);
    setEditingId(store.id);
    setIsModalOpen(true);
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-primary">Stores</h1>
        <button
          onClick={() => {
            setForm({});
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg cursor-pointer"
        >
          Add Store
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">City</th>
              <th className="p-2 border">State</th>
              <th className="p-2 border">Pincode</th>
              <th className="p-2 border">Phone</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} className="hover:bg-lighter">
                <td className="p-2 border">{s.name}</td>
                <td className="p-2 border">{s.city}</td>
                <td className="p-2 border">{s.state}</td>
                <td className="p-2 border">{s.pincode}</td>
                <td className="p-2 border">{s.phone}</td>
                <td className="p-2 border">{s.email}</td>
                <td className="p-2 border flex gap-2">
                  <button
                    onClick={() => openEditModal(s)}
                    className="px-2 py-1 bg-primary text-white rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4 text-primary">
              {editingId ? "Edit Store" : "Add Store"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {[
                "name",
                "address",
                "city",
                "state",
                "pincode",
                "phone",
                "email",
                "lat",
                "lng",
              ].map((field) => (
                <input
                  key={field}
                  type={["lat", "lng"].includes(field) ? "number" : "text"}
                  placeholder={field}
                  step={["lat", "lng"].includes(field) ? "any" : undefined}
                  value={(form as any)[field] ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, [field]: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                />
              ))}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-lighter text-primary rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg"
                >
                  {editingId ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
