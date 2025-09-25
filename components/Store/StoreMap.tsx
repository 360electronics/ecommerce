"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix default marker icons here (inside client-only map)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type Store = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
};

export default function StoreMap({ stores }: { stores: Store[] }) {
  return (
    <MapContainer center={[11.0, 78.0]} zoom={7.5} className="h-full w-full">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {stores.map(
        (s) =>
          s.lat &&
          s.lng && (
            <Marker key={s.id} position={[s.lat, s.lng]}>
              <Popup>
                <div className="flex flex-col gap-1">
                  <strong>{s.name}</strong>
                  <span>{s.address}</span>
                  <span>
                    {s.city}, {s.state} - {s.pincode}
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          )
      )}
    </MapContainer>
  );
}
