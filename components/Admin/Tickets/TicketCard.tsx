"use client"

import type React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Ticket } from "@/types/ticket"

interface TicketCardProps {
  ticket: Ticket
  onClick: () => void
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  // Function to determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-600 border-red-300"
      case "pending":
        return "bg-yellow-100 text-yellow-600 border-yellow-300"
      case "closed":
        return "bg-green-100 text-green-600 border-green-300"
      default:
        return "bg-gray-100 text-gray-600 border-gray-300"
    }
  }

  // Format date to match the design
  const formatDate = (dateString: string) => {
    const [day, month, year] = dateString.split("/")
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${day} ${months[Number.parseInt(month) - 1]} ${year}`
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onClick()
  }

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-6 w-6">
            <AvatarImage src={ticket.customer.avatar || "/placeholder.svg"} alt={ticket.customer.name} />
            <AvatarFallback>{ticket.customer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-light text-sm">{ticket.customer.name}</span>
        </div>
        <div className="bg-blue-100 text-blue-600 px-4 py-1 rounded-sm border border-blue-300 text-xs font-medium">
          #{ticket.id}
        </div>
      </div>

      <div className="mb-2">
        <span className="font-medium text-[14px]">{ticket.type}</span>
        <span className="text-gray-500 text-[14px]"> - Issue</span>
      </div>

      <p className="text-gray-500 text-[10px] mb-4 line-clamp-3">{ticket.description}</p>

      <div className="flex gap-4 justify-end items-center">
        <div className={`px-2 py-1 rounded-sm text-xs font-medium border ${getStatusColor(ticket.status)}`}>
          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
        </div>
        <div className="text-xs text-blue-600">{formatDate(ticket.createdAt)}</div>
      </div>
    </div>
  )
}
