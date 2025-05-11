"use client"

import { useCallback, useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { TicketCard } from "@/components/Admin/Tickets/TicketCard"
import { TicketModal } from "@/components/Admin/Tickets/ActionModel"
import type { Ticket } from "@/types/ticket"

// Sample ticket data
const ticketData: Ticket[] = [
  {
    id: "76XXXXXXXX",
    type: "Product Issue",
    description:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
    status: "open",
    createdAt: "25/09/2025",
    customer: {
      name: "Leo Das",
      email: "santhos01ac@gmail.com",
      phone: "88XXX88XXXX",
      avatar: "/diverse-group-city.png",
    },
  },
  {
    id: "75XXXXXXXX",
    type: "Delivery Issue",
    description:
      "The package was delivered to the wrong address. I've been waiting for 3 days now and still haven't received my order.",
    status: "pending",
    createdAt: "18/09/2025",
    customer: {
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "77XXX77XXXX",
      avatar: "/diverse-group-city.png",
    },
  },
  {
    id: "74XXXXXXXX",
    type: "Refund Request",
    description:
      "I would like to request a refund for my recent purchase as the product doesn't match the description on the website.",
    status: "closed",
    createdAt: "12/05/2025",
    customer: {
      name: "Michael Chen",
      email: "m.chen@example.com",
      phone: "66XXX66XXXX",
      avatar: "/diverse-group-city.png",
    },
  },
  {
    id: "73XXXXXXXX",
    type: "Technical Support",
    description: "My gaming PC keeps shutting down randomly during gameplay. I've already tried updating all drivers.",
    status: "open",
    createdAt: "05/09/2025",
    customer: {
      name: "Alex Rivera",
      email: "alex.r@example.com",
      phone: "55XXX55XXXX",
      avatar: "/diverse-group-city.png",
    },
  },
  {
    id: "72XXXXXXXX",
    type: "Payment Related",
    description: "I need to cancel my order #ORD-2025-7890 as I accidentally ordered the wrong item.",
    status: "closed",
    createdAt: "28/08/2025",
    customer: {
      name: "Antony Das",
      email: "antony.d@example.com",
      phone: "44XXX44XXXX",
      avatar: "/diverse-group-city.png",
    },
  },
]

export default function TicketsPage() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tickets, setTickets] = useState<Ticket[]>(ticketData)
  const [filter, setFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isMounted, setIsMounted] = useState(false)

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleOpenTicket = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket)
    // Use setTimeout to ensure state updates don't conflict
    setTimeout(() => {
      setIsModalOpen(true)
    }, 0)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    // Give time for animation to complete before removing the ticket
    setTimeout(() => {
      setSelectedTicket(null)
    }, 300)
  }, [])

  const handleSaveTicket = useCallback(
    (updatedTicket: Ticket) => {
      setTickets((prevTickets) =>
        prevTickets.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)),
      )
      handleCloseModal()
    },
    [handleCloseModal],
  )

  // Filter tickets by status and search query
  const filteredTickets = tickets.filter((ticket) => {
    const matchesFilter = filter === "all" || ticket.status === filter
    const matchesSearch =
      searchQuery === "" ||
      ticket.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesFilter && matchesSearch
  })

  // Don't render the modal on the server
  const modalComponent =
    isMounted && selectedTicket ? (
      <TicketModal isOpen={isModalOpen} ticket={selectedTicket} onClose={handleCloseModal} onSave={handleSaveTicket} />
    ) : null

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search tickets..."
            className="pl-10 w-full max-w-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>


      </div>

      <div className="flex gap-2 mb-4">
        {["all", "open", "pending", "closed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded ${filter === status ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"
              }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} onClick={() => handleOpenTicket(ticket)} />
        ))}
      </div>

      {modalComponent}
    </div>
  )
}
