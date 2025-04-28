"use client"

import { useState, useEffect } from "react"
import { ArrowRight, FileText, MoreHorizontal } from 'lucide-react'
import { Line } from "react-chartjs-2"
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
  ChartOptions
} from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend)

// Sample data
const dashboardData = {
  metrics: {
    todaySale: { value: 12426, change: 36, increase: true },
    totalSales: { value: 238485, change: 14, increase: false },
    totalOrders: { value: 84382, change: 36, increase: true },
    openTickets: { value: 101, change: 4, increase: true },
  },
  revenueTarget: {
    current: 842500,
    target: 1000000,
    percentage: 84.25,
  },
  transactions: [
    {
      id: 1,
      status: "completed",
      cardType: "Visa card",
      cardNumber: "**** 4831",
      paymentType: "Card payment",
      amount: 182.94,
      date: "Jan 17, 2022",
      merchant: "Amazon",
    },
    {
      id: 2,
      status: "pending",
      cardType: "Account",
      cardNumber: "****882",
      paymentType: "Bank payment",
      amount: 249.94,
      date: "Jan 17, 2022",
      merchant: "Netflix",
    },
    {
      id: 3,
      status: "canceled",
      cardType: "Amex card",
      cardNumber: "**** 5666",
      paymentType: "Card payment",
      amount: 199.24,
      date: "Jan 17, 2022",
      merchant: "Amazon Prime",
    },
  ],
  topProducts: [
    {
      id: 1,
      name: "Asus TUF",
      sales: 570,
      change: 76,
      image: "/laptop.png",
    },
    {
      id: 2,
      name: "Apple mackbook",
      sales: 444,
      change: 66,
      image: "/macbook.png",
    },
    {
      id: 3,
      name: "Razer Mouse",
      sales: 390,
      change: 53,
      image: "/mouse.png",
    },
    {
      id: 4,
      name: "Gaming Headphone",
      sales: 299,
      change: 44,
      image: "/headphone.png",
    },
  ],
  salesData: {
    labels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
    datasets: [
      {
        label: "This Year",
        data: [30000, 35000, 32000, 40000, 45591, 50000, 55000, 58000, 56000, 60000, 62000, 65000],
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: "Last Year",
        data: [25000, 28000, 30000, 35000, 38000, 40000, 42000, 45000, 43000, 47000, 49000, 51000],
        borderColor: "rgba(99, 102, 241, 0.5)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  },
  highlightedMonth: {
    month: "June 2021",
    value: 45591,
  },
}

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState("12 Months")
  const [chartData, setChartData] = useState(dashboardData.salesData)

  // Fix for the pointRadius issue - create a copy of the data and modify it
  useEffect(() => {
    const juneIndex = dashboardData.salesData.labels.indexOf("Jun")
    if (juneIndex !== -1) {
      const newData = JSON.parse(JSON.stringify(dashboardData.salesData))
      newData.datasets[0].pointRadius = Array(dashboardData.salesData.labels.length).fill(0)
      newData.datasets[0].pointRadius[juneIndex] = 4
      setChartData(newData)
    }
  }, [])

  // Chart options with proper TypeScript types
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          callback: (value) => `$${Number(value) / 1000}k`,
        },
      },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="min-h-screen p-4">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Today's Sale */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-xs font-medium mb-1">TODAY'S SALE</div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.metrics.todaySale.value)}</div>
            <div
              className={`text-xs font-medium ${
                dashboardData.metrics.todaySale.increase ? "text-green-500" : "text-red-500"
              }`}
            >
              {dashboardData.metrics.todaySale.increase ? "+" : "-"}
              {dashboardData.metrics.todaySale.change}%{" "}
              {dashboardData.metrics.todaySale.increase ? "↑" : "↓"}
            </div>
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-xs font-medium mb-1">TOTAL SALES</div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.metrics.totalSales.value)}</div>
            <div
              className={`text-xs font-medium ${
                dashboardData.metrics.totalSales.increase ? "text-green-500" : "text-red-500"
              }`}
            >
              {dashboardData.metrics.totalSales.increase ? "+" : "-"}
              {dashboardData.metrics.totalSales.change}%{" "}
              {dashboardData.metrics.totalSales.increase ? "↑" : "↓"}
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-xs font-medium mb-1">TOTAL ORDERS</div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{dashboardData.metrics.totalOrders.value.toLocaleString()}</div>
            <div
              className={`text-xs font-medium ${
                dashboardData.metrics.totalOrders.increase ? "text-green-500" : "text-red-500"
              }`}
            >
              {dashboardData.metrics.totalOrders.increase ? "+" : "-"}
              {dashboardData.metrics.totalOrders.change}%{" "}
              {dashboardData.metrics.totalOrders.increase ? "↑" : "↓"}
            </div>
          </div>
        </div>

        {/* Open Tickets */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="text-gray-500 text-xs font-medium mb-1">OPEN TICKETS</div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">{dashboardData.metrics.openTickets.value}</div>
            <div
              className={`text-xs font-medium ${
                dashboardData.metrics.openTickets.increase ? "text-red-500" : "text-green-500"
              }`}
            >
              {dashboardData.metrics.openTickets.increase ? "+" : "-"}
              {dashboardData.metrics.openTickets.change}%{" "}
              {dashboardData.metrics.openTickets.increase ? "↑" : "↓"}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Sales Report */}
        <div className="bg-white rounded-lg p-5 lg:col-span-2 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold">Sales Report</h2>
            <div className="flex items-center">
              <div className="flex space-x-2 mr-3">
                <button
                  className={`px-3 py-1 text-xs rounded-md ${
                    timeFilter === "12 Months"
                      ? "bg-gray-100 border border-gray-300"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  onClick={() => setTimeFilter("12 Months")}
                >
                  12 Months
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded-md ${
                    timeFilter === "6 Months" ? "bg-gray-100 border border-gray-300" : "text-gray-500 hover:bg-gray-50"
                  }`}
                  onClick={() => setTimeFilter("6 Months")}
                >
                  6 Months
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded-md ${
                    timeFilter === "30 Days" ? "bg-gray-100 border border-gray-300" : "text-gray-500 hover:bg-gray-50"
                  }`}
                  onClick={() => setTimeFilter("30 Days")}
                >
                  30 Days
                </button>
                <button
                  className={`px-3 py-1 text-xs rounded-md ${
                    timeFilter === "7 Days" ? "bg-gray-100 border border-gray-300" : "text-gray-500 hover:bg-gray-50"
                  }`}
                  onClick={() => setTimeFilter("7 Days")}
                >
                  7 Days
                </button>
              </div>
              <button className="flex items-center px-3 py-1 text-xs border border-gray-300 rounded-md">
                <FileText className="h-3 w-3 mr-1" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Highlighted Month - Fixed positioning issue */}
          <div className="relative">
            <div className="absolute left-[30%] top-0 bg-white border border-gray-200 rounded-md p-2 shadow-sm z-10">
              <div className="text-xs text-gray-500">{dashboardData.highlightedMonth.month}</div>
              <div className="text-sm font-bold">{formatCurrency(dashboardData.highlightedMonth.value)}</div>
            </div>

            {/* Chart */}
            <div className="h-64 pt-8">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Revenue Target */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold">Revenue</h2>
            <span className="text-blue-500 font-bold text-sm">Target</span>
          </div>

          {/* Gauge Chart */}
          <div className="flex justify-center mb-5">
            <div className="relative w-48 h-24">
              <svg className="w-full h-full" viewBox="0 0 100 50">
                {/* Background arc */}
                <path
                  d="M5,50 A45,45 0 0,1 95,50"
                  fill="none"
                  stroke="#f3f4f6"
                  strokeWidth="10"
                  strokeLinecap="round"
                />
                {/* Foreground arc */}
                <path
                  d="M5,50 A45,45 0 0,1 95,50"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${dashboardData.revenueTarget.percentage * 0.9}, 100`}
                />
              </svg>
            </div>
          </div>

          {/* Revenue Amount */}
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">{formatCurrency(dashboardData.revenueTarget.current)}</div>
            <div className="text-xs text-gray-500">
              <span className="text-green-500 font-medium">{dashboardData.revenueTarget.percentage}%</span> of{" "}
              {formatCurrency(dashboardData.revenueTarget.target)} target
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Transactions */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold">Transactions</h2>
            <button className="text-blue-500 flex items-center text-xs font-medium">
              See All Transactions <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>
          <p className="text-gray-500 text-xs mb-4">Lorem ipsum dolor sit amet, consectetur adipis.</p>

          {/* Transaction List */}
          <div className="space-y-4">
            {dashboardData.transactions.map((transaction) => (
              <div key={transaction.id} className="border-b border-gray-100 pb-4">
                <div className="flex items-center mb-2">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      transaction.status === "completed"
                        ? "bg-green-500"
                        : transaction.status === "pending"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <span
                    className={`text-xs ${
                      transaction.status === "completed"
                        ? "text-green-500"
                        : transaction.status === "pending"
                        ? "text-yellow-500"
                        : "text-red-500"
                    } capitalize`}
                  >
                    {transaction.status}
                  </span>
                </div>

                <div className="flex justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {transaction.cardType} {transaction.cardNumber}
                    </div>
                    <div className="text-xs text-gray-500">{transaction.paymentType}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${transaction.amount}</div>
                    <div className="text-xs text-gray-500">{transaction.date}</div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-500">{transaction.merchant}</div>
                  <button className="text-gray-400">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold mb-5">Top Products</h2>

          {/* Product List */}
          <div className="space-y-4">
            {dashboardData.topProducts.map((product) => (
              <div key={product.id} className="flex items-center">
                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-7 h-7 object-contain"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                    }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{product.name}</div>
                  <div className="w-full bg-blue-100 h-1.5 rounded-full mt-1">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${(product.sales / 600) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{product.sales} Sales</div>
                  <div className="text-green-500 text-xs">+{product.change}% ↑</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
