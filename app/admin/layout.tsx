'use client'

import { useState, useEffect } from "react"
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
  X,
  ImageIcon,
  ShoppingCart
} from "lucide-react"
import Breadcrumbs from "@/components/Reusable/BreadScrumb"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  
  // Close sidebar on mobile when navigating to a new page
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }
    
    // Set initial state based on screen size
    handleResize()
    
    // Add event listener
    window.addEventListener('resize', handleResize)
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  // Close sidebar when clicking on a link on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [pathname])

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
    { name: "Products", path: "/admin/products", icon: Package },
    { name: "Users", path: "/admin/users", icon: User },
    { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
    { name: "Tickets", path: "/admin/tickets", icon: Ticket },
    { name: "Featured Products", path: "/admin/featured-products", icon: Heart },
    { name: "New Arrival", path: "/admin/new-arrivals", icon: Briefcase },
    { name: "Gamer Zone", path: "/admin/gamer-zone", icon: Gamepad2 },
    { name: "Cart Value Offers", path: "/admin/cart-offer-products", icon: ShoppingCart },
    { name: "Promotional Banners", path: "/admin/promotional-banners", icon: ImageIcon },
  ]

  // Backdrop for mobile
  const Backdrop = () => (
    <div 
      className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 ${
        sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => setSidebarOpen(false)}
    />
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Backdrop */}
      <Backdrop />
      
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white transition-all duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0 lg:w-64 shadow-lg lg:shadow-none`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-2 border-[0.5px] border-gray-300 rounded-tr-2xl mt-5 scrollbar-hide">
          {/* Logo and Close Button Area */}
          <div className="flex items-center justify-between py-1">
            <div className="flex flex-col items-center flex-1">
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
            {/* Close button - only on mobile */}
            <button 
              className="p-2 rounded-full hover:bg-gray-100 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          <h2 className="mb-4 text-lg font-medium text-gray-900 mt-4">Main menu</h2>
          <nav className="flex flex-col space-y-3">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.path) || false
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-500"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className={`mr-3 h-4 w-4 ${isActive ? "text-blue-500" : "text-gray-500"}`} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>
          
          {/* Logout Button */}
          <div className="p-4 mt-6">
            <button className="flex w-full items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden w-full">
        {/* Header - Breadcrumbs */}
        <header className="flex h-16 items-center px-4 lg:px-6 bg-white shadow-sm z-10">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 lg:hidden mr-2"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>
              {/* Breadcrumbs Component */}
              <div className="hidden sm:block">
                <Breadcrumbs breadcrumbs={breadcrumbs} />
              </div>
            </div>
            
            {/* You can add user profile or notifications here */}
            <div className="flex items-center space-x-2">
              <div className="hidden sm:block text-sm text-gray-600">Admin Panel</div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 bg-gray-50">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}