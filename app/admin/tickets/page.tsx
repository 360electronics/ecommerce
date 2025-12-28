"use client";

import { useCallback, useState, useEffect } from "react";
import {
  Search,
  Clock,
  Ticket,
  CheckCircle,
  XCircle,
  MessageCircleDashed,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TicketCard } from "@/components/Admin/Tickets/TicketCard";
import { TicketModal } from "@/components/Admin/Tickets/ActionModel";
import { showFancyToast } from "@/components/Reusable/ShowCustomToast";

interface Ticket {
  id: string;
  user_id: string;
  type: string;
  issueDesc: string;
  status: "active" | "inactive" | "closed";
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: "user" | "admin" | "guest";
  };
  addresses: Array<{
    id: string;
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: "home" | "work" | "other";
    isDefault: boolean;
  }>;
  replies: Array<{
    id: string;
    sender: "user" | "support";
    message: string;
    createdAt: string;
  }>;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tickets", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to fetch tickets");
      setTickets(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch tickets";
      setError(message);
      showFancyToast({
        title: "Sorry, there was an error",
        message: message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchTickets();
  }, [fetchTickets]);

  const handleOpenTicket = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
    setTimeout(() => {
      setIsModalOpen(true);
    }, 0);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedTicket(null);
    }, 300);
  }, []);

  const handleSaveTicket = useCallback(
    async (updatedTicket: Ticket) => {
      try {
        const res = await fetch(`/api/tickets?id=${updatedTicket.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: updatedTicket.status }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update ticket");

        await fetchTickets();
        showFancyToast({
                title: "Ticket Updated Successfully",
                message: "The ticket has been updated successfully.",
                type: "success",
              });
        handleCloseModal();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to update ticket";
        showFancyToast({
                title: "Sorry, there was an error",
                message: message,
                type: "error",
              });
      }
    },
    [handleCloseModal, fetchTickets]
  );

  const filteredTickets = tickets.filter((ticket) => {
    const matchesFilter = filter === "all" || ticket.status === filter;
    const matchesSearch =
      searchQuery === "" ||
      ticket.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Calculate average response time (in hours) for tickets with replies
  const avgResponseTime =
    tickets.length > 0
      ? tickets.reduce((acc, ticket) => {
          const firstReply = ticket.replies.find(
            (reply) => reply.sender === "support"
          );
          if (!firstReply) return acc;
          const created = new Date(ticket.createdAt).getTime();
          const replied = new Date(firstReply.createdAt).getTime();
          const diffHours = (replied - created) / (1000 * 60 * 60);
          return acc + diffHours;
        }, 0) /
        tickets.filter((t) => t.replies.some((r) => r.sender === "support"))
          .length
      : 0;

  const modalComponent =
    isMounted && selectedTicket ? (
      <TicketModal
        isOpen={isModalOpen}
        ticket={selectedTicket}
        onClose={handleCloseModal}
        onSave={handleSaveTicket}
      />
    ) : null;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="p-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2 text-gray-600">Loading tickets...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-red-600 p-4 bg-red-50 rounded-md">
          Error: {error}
          <button
            className="ml-4 text-blue-600 underline hover:text-blue-800"
            onClick={fetchTickets}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900">
              Ticket Management
            </h1>
            <p className="mt-2 text-gray-600">
              View and manage customer support tickets
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 ">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">
                {tickets.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 ">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Active Tickets
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {tickets.filter((t) => t.status === "active").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 ">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Closed Tickets
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {tickets.filter((t) => t.status === "closed").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 ">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Avg. Response Time
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {isNaN(avgResponseTime)
                  ? "N/A"
                  : `${avgResponseTime.toFixed(1)} hrs`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by ticket ID, type, or customer..."
            className="pl-10 w-full border-gray-300 focus:ring-2 focus:ring-blue-500 transition-all duration-200 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tickets"
          />
        </div>
        <div className="flex gap-2">
          {["all", "active", "inactive", "closed"].map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              variant={filter === status ? "default" : "outline"}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                filter === status
                  ? "bg-primary text-white hover:bg-primary-hover"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {status === "all"
                ? "All"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Tickets Grid */}
      {filteredTickets.length === 0 ? (
        <div className="text-center text-gray-500 py-8 bg-white rounded-lg border border-gray-200">
          No tickets found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => handleOpenTicket(ticket)}
            />
          ))}
        </div>
      )}

      {modalComponent}
    </div>
  );
}
