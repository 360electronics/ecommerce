"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
);

/* ===============================
   TYPES
================================ */

interface DashboardResponse {
  metrics: {
    todaySales: number;
    todaySalesIncrease: boolean;
    totalSales: number;
    totalSalesIncrease: boolean;
    totalOrders: number;
    totalOrdersIncrease: boolean;
    openTickets: number;
    openTicketsIncrease: boolean;
  };
  salesChart: {
    labels: string[];
    data: number[];
  };
  topProducts: {
    name: string;
    sales: number;
    image: string;
  }[];
  recentTransactions: {
    id: string;
    status: string;
    amount: number;
    date: string;
    paymentMethod: string;
    customer: string;
    city: string;
  }[];
}

/* ===============================
   CONSTANTS
================================ */

const ranges = [
  { label: "Today", value: "today" },
  { label: "7 Days", value: "7d" },
  { label: "15 Days", value: "15d" },
  { label: "30 Days", value: "30d" },
  { label: "3 Months", value: "3m" },
];

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-green-100 text-green-700",
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-indigo-100 text-indigo-700",
  cancelled: "bg-red-100 text-red-700",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);

/* ===============================
   COMPONENT
================================ */

export default function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");

  /* ===============================
     FETCH
  ================================ */
  useEffect(() => {
    setLoading(true);

    fetch(`/api/admin/dashboard?range=${range}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [range]);

  /* ===============================
     STATES
  ================================ */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No dashboard data
      </div>
    );
  }

  /* ===============================
     RENDER
  ================================ */

  return (
    <div className="space-y-8">

      {/* ===== HEADER + RANGE TOGGLE ===== */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="flex gap-2 flex-wrap">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                range === r.value
                  ? "bg-gradient-to-r from-[#ff6b00] to-[#ff9f00] text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== METRICS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { t: "Today Sales", v: data.metrics.todaySales, i: data.metrics.todaySalesIncrease, m: true },
          { t: "Total Sales", v: data.metrics.totalSales, i: data.metrics.totalSalesIncrease, m: true },
          { t: "Total Orders", v: data.metrics.totalOrders, i: data.metrics.totalOrdersIncrease },
          { t: "Open Tickets", v: data.metrics.openTickets, i: data.metrics.openTicketsIncrease },
        ].map((x) => (
          <div key={x.t} className="bg-white p-6 rounded-xl border">
            <div className="text-sm text-gray-500 mb-2">{x.t}</div>
            <div className="flex justify-between items-center">
              <div className="text-3xl font-bold">
                {x.m ? formatCurrency(x.v) : x.v}
              </div>
              {x.i ? (
                <ArrowUp className="text-green-500" />
              ) : (
                <ArrowDown className="text-red-500" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ===== SALES CHART ===== */}
      <div className="bg-white p-6 rounded-xl border h-[360px]">
        <Line
          data={{
            labels: data.salesChart.labels,
            datasets: [
              {
                label: "Sales",
                data: data.salesChart.data,
                borderColor: "#ff6b00",
                backgroundColor: "rgba(255,107,0,0.15)",
                fill: true,
                tension: 0.35,
              },
            ],
          }}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </div>

      {/* ===== TOP PRODUCTS ===== */}
      <div className="bg-white p-6 rounded-xl border">
        <h2 className="text-xl font-bold mb-4">Top Products</h2>
        {data.topProducts.map((p) => (
          <div key={p.name} className="flex items-center mb-4">
            <img
              src={p.image}
              className="w-12 h-12 rounded bg-gray-100 mr-4"
            />
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-gray-500">
                {formatCurrency(p.sales)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== TRANSACTIONS ===== */}
      <div className="bg-white p-6 rounded-xl border">
        <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
        {data.recentTransactions.map((t) => (
          <div key={t.id} className="flex justify-between mb-3">
            <div>
              <div className="font-semibold">{t.customer}</div>
              <div className="text-sm text-gray-500">
                {t.city} • {t.paymentMethod}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {formatCurrency(t.amount)}
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full capitalize ${
                  statusColor[t.status] ?? "bg-gray-100 text-gray-700"
                }`}
              >
                {t.status}
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
