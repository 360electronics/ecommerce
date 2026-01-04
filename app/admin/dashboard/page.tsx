"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight,
  FileText,
  Loader2,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Target,
} from "lucide-react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import * as XLSX from "xlsx";
import Link from "next/link";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface Order {
  orders: {
    id: string;
    status: string;
    paymentMethod: string;
    totalAmount: string;
    createdAt: string;
  };
  variants: {
    name: string;
    productImages: { url: string }[];
  } | null;
  savedAddresses: {
    fullName: string;
    city: string;
  };
}

interface Ticket {
  id: string;
  status: "active" | "inactive" | "closed";
  createdAt: string;
}

interface DashboardData {
  metrics: {
    todaySale: { value: number; increase: boolean };
    totalSales: { value: number; increase: boolean };
    totalOrders: { value: number; increase: boolean };
    openTickets: { value: number; increase: boolean };
  };
  revenueTarget: {
    current: number;
    target: number;
    percentage: number;
  };
  transactions: {
    id: string;
    status: string;
    paymentType: string;
    amount: number;
    date: string;
    variantName: string;
    customer: string;
    city: string;
  }[];
  topProducts: {
    id: string;
    name: string;
    sales: number;
    change: number;
    image: string;
  }[];
  salesData: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      borderWidth: number;
      fill: boolean;
      tension: number;
      pointBackgroundColor: string;
      pointBorderColor: string;
      pointBorderWidth: number;
      pointRadius: number | number[];
      pointHoverRadius: number;
    }[];
  };
  highlightedMonth: {
    month: string;
    value: number;
  };
}

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState("12 Months");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customGoal, setCustomGoal] = useState<number | null>(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalInput, setGoalInput] = useState<string>("");

  // Fetch and process data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch orders, tickets, and custom goal
        const [ordersRes, ticketsRes, goalRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/tickets"),
          fetch("/api/goal"),
        ]);
        if (!ordersRes.ok) throw new Error("Failed to fetch orders");
        if (!ticketsRes.ok) throw new Error("Failed to fetch tickets");
        if (!goalRes.ok) throw new Error("Failed to fetch goal");

        const { data: orders }: { data: Order[] } = await ordersRes.json();
        const tickets: Ticket[] = await ticketsRes.json();
        const { goal }: { goal: number | null } = await goalRes.json();

        // Set custom goal from API if available
        if (goal !== null) {
          setCustomGoal(goal);
        }

        // Process orders for metrics
        const today = new Date("2025-06-30T00:00:00Z"); // June 30, 2025, 00:00 UTC
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const currentYear = today.getFullYear();
        const lastYear = currentYear - 1;
        const lastMonth = new Date(today);
        lastMonth.setMonth(today.getMonth() - 1);

        // Today's sales
        const todaySales = orders
          .filter((order) => {
            const orderDate = new Date(order.orders.createdAt);
            return orderDate >= today && order.orders.status === "confirmed";
          })
          .reduce(
            (sum, order) => sum + parseFloat(order.orders.totalAmount),
            0
          );

        const yesterdaySales = orders
          .filter((order) => {
            const orderDate = new Date(order.orders.createdAt);
            return (
              orderDate >= yesterday &&
              orderDate < today &&
              order.orders.status === "confirmed"
            );
          })
          .reduce(
            (sum, order) => sum + parseFloat(order.orders.totalAmount),
            0
          );

        const todaySalesIncrease = todaySales >= yesterdaySales;

        // Total sales (current year)
        const totalSales = orders
          .filter((order) => {
            const orderDate = new Date(order.orders.createdAt);
            return (
              orderDate.getFullYear() === currentYear &&
              order.orders.status === "confirmed"
            );
          })
          .reduce(
            (sum, order) => sum + parseFloat(order.orders.totalAmount),
            0
          );

        const lastYearSales = orders
          .filter((order) => {
            const orderDate = new Date(order.orders.createdAt);
            return (
              orderDate.getFullYear() === lastYear &&
              order.orders.status === "confirmed"
            );
          })
          .reduce(
            (sum, order) => sum + parseFloat(order.orders.totalAmount),
            0
          );

        const totalSalesIncrease = totalSales >= lastYearSales;

        // Total orders
        const totalOrders = orders.filter((order) => {
          const orderDate = new Date(order.orders.createdAt);
          return (
            orderDate.getFullYear() === currentYear &&
            order.orders.status === "confirmed"
          );
        }).length;

        const lastYearOrders = orders.filter((order) => {
          const orderDate = new Date(order.orders.createdAt);
          return (
            orderDate.getFullYear() === lastYear &&
            order.orders.status === "confirmed"
          );
        }).length;

        const totalOrdersIncrease = totalOrders >= lastYearOrders;

        // Open tickets
        const openTickets = tickets.filter(
          (ticket) => ticket.status === "active" || ticket.status === "inactive"
        ).length;
        const lastMonthOpenTickets = tickets.filter((ticket) => {
          const ticketDate = new Date(ticket.createdAt);
          return (
            ticketDate.getMonth() === lastMonth.getMonth() &&
            ticketDate.getFullYear() === lastMonth.getFullYear() &&
            (ticket.status === "active" || ticket.status === "inactive")
          );
        }).length;

        const openTicketsIncrease = openTickets >= lastMonthOpenTickets;

        // Dynamic annual goal (150% of last year's sales, unless custom goal is set)
        const dynamicGoal = lastYearSales * 1.5 || 1000000; // Fallback to 1M if no last year data
        const annualGoal = customGoal !== null ? customGoal : dynamicGoal;

        // Calculate sales by month for chart
        const salesByMonth: { [key: string]: number } = {};
        let months: string[] = [];

        if (timeFilter === "12 Months") {
          months = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            return date.toLocaleString("default", {
              month: "short",
              year: "numeric",
            });
          }).reverse();
        } else if (timeFilter === "6 Months") {
          months = Array.from({ length: 6 }, (_, i) => {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            return date.toLocaleString("default", {
              month: "short",
              year: "numeric",
            });
          }).reverse();
        } else if (timeFilter === "30 Days") {
          months = Array.from({ length: 4 }, (_, i) => {
            const date = new Date(
              today.getTime() - i * 7 * 24 * 60 * 60 * 1000
            );
            return date.toLocaleString("default", {
              day: "numeric",
              month: "short",
            });
          }).reverse();
        } else if (timeFilter === "7 Days") {
          months = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            return date.toLocaleString("default", {
              day: "numeric",
              month: "short",
            });
          }).reverse();
        }

        orders
          .filter((order) => order.orders.status === "confirmed")
          .forEach((order) => {
            const date = new Date(order.orders.createdAt);
            const month =
              timeFilter === "12 Months" || timeFilter === "6 Months"
                ? date.toLocaleString("default", {
                    month: "short",
                    year: "numeric",
                  })
                : date.toLocaleString("default", {
                    day: "numeric",
                    month: "short",
                  });
            salesByMonth[month] =
              (salesByMonth[month] || 0) + parseFloat(order.orders.totalAmount);
          });

        const salesData = {
          labels: months,
          datasets: [
            {
              label: "Sales",
              data: months.map((month) => salesByMonth[month] || 0),
              borderColor: "#ff6b00",
              backgroundColor: "#ff6b00",
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "#ff6b00",
              pointBorderColor: "#fff",
              pointBorderWidth: 2,
              pointRadius: months.map((month, i) =>
                month.includes("Jun") ? 4 : 0
              ),
              pointHoverRadius: 6,
            },
          ],
        };

        // Calculate top products
        const productSales: {
          [key: string]: { sales: number; name: string; image: string };
        } = {};
        orders.forEach((order) => {
          if (order.variants) {
            const productId = order.variants.name.split(" - ")[0];
            if (!productSales[productId]) {
              productSales[productId] = {
                sales: 0,
                name: order.variants.name.split(" - ")[0],
                image:
                  order.variants.productImages[0]?.url || "/placeholder.svg",
              };
            }
            productSales[productId].sales += parseFloat(
              order.orders.totalAmount
            );
          }
        });

        const topProducts = Object.entries(productSales)
          .map(([id, data]) => ({
            id,
            name: data.name,
            sales: Math.round(data.sales),
            change: Math.round(Math.random() * 50) + 20, // Placeholder
            image: data.image,
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 4);

        // Set dashboard data
        setDashboardData({
          metrics: {
            todaySale: { value: todaySales, increase: todaySalesIncrease },
            totalSales: { value: totalSales, increase: totalSalesIncrease },
            totalOrders: { value: totalOrders, increase: totalOrdersIncrease },
            openTickets: { value: openTickets, increase: openTicketsIncrease },
          },
          revenueTarget: {
            current: totalSales,
            target: annualGoal,
            percentage: Math.min((totalSales / annualGoal) * 100, 100),
          },
          transactions: orders
            .filter((order) => order.variants)
            .map((order) => ({
              id: order.orders.id,
              status: order.orders.status,
              paymentType: order.orders.paymentMethod,
              amount: parseFloat(order.orders.totalAmount),
              date: new Date(order.orders.createdAt).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric", year: "numeric" }
              ),
              variantName: order.variants!.name.split(" - ")[0],
              customer: order.savedAddresses.fullName,
              city: order.savedAddresses.city,
            }))
            .slice(0, 5),
          topProducts,
          salesData,
          highlightedMonth: {
            month: "June 2025",
            value: salesByMonth["Jun 2025"] || 56999,
          },
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeFilter, customGoal]);

  // Handle goal submission
  const handleSetGoal = async () => {
    const amount = parseFloat(goalInput);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid goal amount");
      return;
    }

    try {
      const response = await fetch("/api/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) throw new Error("Failed to set goal");
      setCustomGoal(amount);
      setIsGoalModalOpen(false);
      setGoalInput("");
    } catch (error) {
      console.error("Error setting goal:", error);
      alert("Failed to set goal. Please try again.");
    }
  };

  // Export sales report to Excel
  const exportToExcel = () => {
    if (!dashboardData) return;

    const salesReport = dashboardData.salesData.labels.map((label, index) => ({
      Period: label,
      Sales: dashboardData!.salesData.datasets[0].data[index],
    }));

    const worksheet = XLSX.utils.json_to_sheet(salesReport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Report");
    XLSX.writeFile(
      workbook,
      `Sales_Report_${timeFilter.replace(" ", "_")}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`
    );
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-red-600 text-lg font-medium">{error}</div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600 text-lg font-medium">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Goal Setting Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Set Custom Revenue Goal
            </h3>
            <input
              type="number"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Enter goal amount (INR)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsGoalModalOpen(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetGoal}
                className="px-4 py-2 text-white bg-gradient-to-r from-[#ff6b00] to-[#ff9f00] hover:to-primary-hover rounded-lg transition-colors"
              >
                Set Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Object.entries(dashboardData.metrics).map(([key, metric]) => (
          <div
            key={key}
            className="bg-white rounded-xl p-6 border border-gray-100  transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="text-gray-500 text-sm font-medium uppercase mb-3">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-gray-900">
                {key === "totalOrders" || key === "openTickets"
                  ? metric.value.toLocaleString()
                  : formatCurrency(metric.value)}
              </div>
              <div
                className={metric.increase ? "text-green-500" : "text-red-500"}
              >
                {metric.increase ? (
                  <ArrowUp className="h-6 w-6" />
                ) : (
                  <ArrowDown className="h-6 w-6" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Report */}
        <div className="bg-white rounded-xl border border-gray-100 p-6 lg:col-span-2 ">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-900">Sales Report</h2>
            <div className="flex flex-wrap items-center gap-3">
              {["12 Months", "6 Months", "30 Days", "7 Days"].map((filter) => (
                <button
                  key={filter}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    timeFilter === filter
                      ? "bg-gradient-to-r from-[#ff6b00] to-[#ff9f00] hover:to-primary-hover text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-primary-light"
                  }`}
                  onClick={() => setTimeFilter(filter)}
                >
                  {filter}
                </button>
              ))}
              <button
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-primary-light transition-colors"
                onClick={exportToExcel}
              >
                <FileText className="h-5 w-5 mr-2" />
                Export to Excel
              </button>
            </div>
          </div>
          <div className="relative">
            {/* <div className="absolute left-1/3 top-4 bg-white border border-gray-200 rounded-lg p-4  z-10">
              <div className="text-sm text-gray-500 font-medium">
                {dashboardData.highlightedMonth.month}
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(dashboardData.highlightedMonth.value)}
              </div>
            </div> */}
            <div className="h-96 pt-12">
              <Line
                data={dashboardData.salesData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                      position: "top",
                      labels: {
                        color: "#ff6b00",
                        font: { size: 14 },
                      },
                    },
                    tooltip: {
                      enabled: true,
                      callbacks: {
                        label: function (context: any) {
                          if (typeof context.parsed.y === "number") {
                            return `₹${context.parsed.y.toLocaleString()}`;
                          }
                          return context.parsed.y;
                        },
                      },
                    },
                  },
                  scales: {
                    x: {
                      grid: { display: false },
                      ticks: { color: "#4b5563", font: { size: 12 } },
                    },
                    y: {
                      grid: { color: "#e5e7eb" },
                      ticks: {
                        color: "#4b5563",
                        font: { size: 12 },
                        callback: function (value: any) {
                          if (typeof value === "number") {
                            return `₹${value.toLocaleString()}`;
                          }
                          return value;
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Revenue Target */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 ">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Revenue Target</h2>
            <button
              onClick={() => setIsGoalModalOpen(true)}
              className="flex items-center text-primary font-semibold text-sm hover:text-primary-hover transition-colors"
            >
              <Target className="h-5 w-5 mr-2" />
              Set Goal
            </button>
          </div>
          <div className="flex justify-center mb-6">
            <div className="relative w-64 h-32">
              <svg className="w-full h-full" viewBox="0 0 100 50">
                <path
                  d="M5,50 A45,45 0 0,1 95,50"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M5,50 A45,45 0 0,1 95,50"
                  fill="none"
                  stroke="#ff6b00"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${
                    dashboardData.revenueTarget.percentage * 0.9
                  }, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-900">
                  {dashboardData.revenueTarget.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {formatCurrency(dashboardData.revenueTarget.current)}
            </div>
            <div className="text-sm text-gray-600">
              of {formatCurrency(dashboardData.revenueTarget.target)} goal
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 ">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Recent Transactions
            </h2>
            <Link
              href={"/admin/orders"}
              className="text-primary flex items-center text-sm font-semibold hover:underline"
            >
              See All Transactions <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
          <div className="space-y-6">
            {dashboardData.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border-b border-gray-200 pb-6"
              >
                <div className="flex items-center mb-3">
                  <div
                    className={`w-3 h-3 rounded-full mr-2 ${
                      transaction.status === "confirmed"
                        ? "bg-green-500"
                        : transaction.status === "pending"
                        ? "bg-yellow-500"
                        : transaction.status === "cancelled"
                        ? "bg-red-500"
                        : "bg-gray-500"
                    }`}
                  ></div>
                  <span
                    className={`text-sm capitalize font-medium ${
                      transaction.status === "confirmed"
                        ? "text-green-600"
                        : transaction.status === "pending"
                        ? "text-yellow-600"
                        : transaction.status === "cancelled"
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {transaction.status}
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {transaction.variantName}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {transaction.customer} • {transaction.city}
                    </div>
                    <div className="text-xs text-gray-600 capitalize mt-1">
                      {transaction.paymentType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {transaction.date}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-3">
                  <button className="text-gray-500 hover:text-gray-700 transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 ">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Top Products
          </h2>
          <div className="space-y-6">
            {dashboardData.topProducts.map((product) => (
              <div key={product.id} className="flex items-center">
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-10 h-10 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">
                    {product.name}
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (product.sales /
                            Math.max(
                              ...dashboardData.topProducts.map((p) => p.sales)
                            )) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(product.sales)}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    +{product.change}% ↑
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
