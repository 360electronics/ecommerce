'use client'

import { useState } from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
  LayoutGrid,
  User,
  Heart,
  ShoppingBag,
  Ticket,
  Briefcase,
  Package,
  Gamepad2,
  LogOut,
  Menu,
  Home,
} from "lucide-react"
import Breadcrumbs from "@/components/Reusable/BreadScrumb"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const pathname = usePathname()

  // Generate breadcrumbs dynamically
  const generateBreadcrumbs = () => {
    if (!pathname) return []

    const segments = pathname.split("/").filter(Boolean)
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`
      return {
        name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "),
        path,
        icon: Home, // Default icon
      }
    })
  }

  const breadcrumbs = generateBreadcrumbs()

  // Custom Navigation items
  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutGrid },
    { name: "Products", path: "/admin/products", icon: User },
    { name: "Users", path: "/admin/users", icon: Heart },
    { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
    { name: "Tickets", path: "/admin/tickets", icon: Ticket },
    { name: "Featured Products", path: "/admin/featured-products", icon: Briefcase },
    { name: "New Arrival", path: "/admin/new-arrivals", icon: Package },
    { name: "Gamer Zone", path: "/admin/gamer-zone", icon: Gamepad2 },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-2 border-[0.5px] border-gray-300 rounded-tr-2xl mt-5 scrollbar-hide">
          {/* Logo */}
          <div className="flex justify-center py-1">
            <div className="flex flex-col items-center">
              <div className="text-center">
                <Image
                  src="/logo/360.svg"
                  alt="Computer Garage"
                  width={50}
                  height={50}
                  className="h-auto w-[200px]"
                />
              </div>
            </div>
          </div>
          <h2 className="mb-4 text-lg font-medium text-gray-900">Main menu</h2>
          <nav className="flex flex-col space-y-6">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.path) || false
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center px-3 ${
                    isActive
                      ? "rounded-md py-2 bg-blue-100 text-blue-500"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <item.icon className={`mr-3 h-4 w-4 ${isActive ? "text-blue-500" : "text-gray-500"}`} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>
          {/* Logout Button */}
          <div className="p-4">
            <button className="flex w-full items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - Breadcrumbs */}
        <header className="flex h-16 items-center px-4 lg:px-6 bg-white">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden mr-2"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle sidebar</span>
            </button>
            {/* Breadcrumbs Component */}
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        </header>
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-white">{children}</main>
      </div>
    </div>
  )
}
