'use client';

import { useCallback, useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TicketCard } from '@/components/Admin/Tickets/TicketCard';
import { TicketModal } from '@/components/Admin/Tickets/ActionModel';
import toast from 'react-hot-toast';

interface Ticket {
  id: string;
  user_id: string;
  type: string;
  issueDesc: string;
  status: 'active' | 'inactive' |'closed';
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: 'user' | 'admin' | 'guest';
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
    addressType: 'home' | 'work' | 'other';
    isDefault: boolean;
  }>;
  replies: Array<{
    id: string;
    sender: 'user' | 'support';
    message: string;
    createdAt: string;
  }>;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tickets', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch tickets');
      setTickets(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tickets';
      setError(message);
      toast.error(message);
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
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: updatedTicket.status }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update ticket');

        await fetchTickets();
        toast.success('Ticket updated successfully');
        handleCloseModal();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update ticket';
        toast.error(message);
      }
    },
    [handleCloseModal, fetchTickets],
  );

  const filteredTickets = tickets.filter((ticket) => {
    const matchesFilter = filter === 'all' || ticket.status === filter;
    const matchesSearch =
      searchQuery === '' ||
      ticket.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const modalComponent =
    isMounted && selectedTicket ? (
      <TicketModal
        isOpen={isModalOpen}
        ticket={selectedTicket}
        onClose={handleCloseModal}
        onSave={handleSaveTicket}
      />
    ) : null;

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
        {['all', 'active', 'inactive', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded ${
              filter === status ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500">Loading tickets...</div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center text-gray-500">No tickets found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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