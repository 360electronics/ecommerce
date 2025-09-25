"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import UserLayout from "@/components/Layouts/UserLayout";

// Dynamically import StoreMap (no Leaflet here)
const Map = dynamic(() => import("../../components/Store/StoreMap"), { ssr: false });

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

export default function StoreLocator() {
  const [stores, setStores] = useState<Store[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    async function fetchStores() {
      const res = await fetch("/api/stores");
      const data = await res.json();
      setStores(data);
    }
    fetchStores();
  }, []);

  const filteredStores = useMemo(() => {
    if (!query) return stores;
    const lowerQuery = query.toLowerCase();
    return stores.filter(
      (s) =>
        s.city?.toLowerCase().includes(lowerQuery) ||
        s.state?.toLowerCase().includes(lowerQuery) ||
        s.pincode?.includes(lowerQuery)
    );
  }, [query, stores]);

  return (
    <UserLayout>
      <div className="py-4 mx-auto flex flex-col md:flex-row gap-6 relative">
        <div className="w-full md:w-[30%]">
          <h1 className="text-3xl font-bold text-primary mb-6">
            Find a Store Near You
          </h1>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex gap-2 mb-8 flex-wrap sm:flex-nowrap"
          >
            <input
              type="text"
              placeholder="Search by city, state, or pincode"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none"
            />
          </form>

          <div className="grid grid-cols-1 gap-6 mb-8">
            {filteredStores.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-gray-300 p-5 transition cursor-pointer"
              >
                <h2 className="text-xl font-semibold mb-2">{s.name}</h2>
                <p className="text-gray-700 mb-1">{s.address}</p>
                <p className="text-gray-700 mb-1">
                  {s.city}, {s.state} - {s.pincode}
                </p>
                {s.phone && <p className="text-gray-700 mb-1">📞 {s.phone}</p>}
                {s.email && <p className="text-gray-700 mb-2">✉️ {s.email}</p>}
                {s.lat && s.lng && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-primary underline"
                  >
                    Open in Google Maps
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Map dynamically loaded */}
        <div className="h-[600px] w-full rounded-xl overflow-hidden sticky top-32">
          <Map stores={filteredStores} />
        </div>
      </div>
    </UserLayout>
  );
}
