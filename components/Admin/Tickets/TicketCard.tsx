'use client';

import type React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Ticket {
  id: string;
  user_id: string;
  type: string;
  issueDesc: string;
  status: 'active' | 'inactive' | 'closed';
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

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(date.getDate()).padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return 'Invalid date';
    }
  };

  const defaultAddress = ticket.addresses.find((addr) => addr.isDefault) || ticket.addresses[0];

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`View ticket ${ticket.id}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex flex-col items-start gap-2 justify-between">
        <div
          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md border border-gray-200 text-xs font-mono tracking-wider"
          aria-label={`Ticket ID: ${ticket.id}`}
        >
          #{ticket.id.slice(-6).toUpperCase()}
        </div>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gray-100 text-primary font-semibold">
              {ticket.customer.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 text-sm">{ticket.customer.name}</span>
            <span className="text-xs text-gray-500">{ticket.customer.email}</span>
          </div>
        </div>

      </div>

      <div className="py-3">
        <span className="font-semibold text-lg text-gray-900 capitalize">{ticket.type}</span>
        <span className="text-sm text-gray-500"> - Issue</span>
      </div>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{ticket.issueDesc}</p>

      {defaultAddress && (
        <div className="text-gray-600 text-xs mb-4">
          <span className="font-medium">Address: </span>
          {`${defaultAddress.addressLine1}, ${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.postalCode}, ${defaultAddress.country}`}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
            ticket.status,
          )}`}
          aria-label={`Status: ${ticket.status}`}
        >
          <span
            className={`w-2 h-2 rounded-full mr-1.5 ${ticket.status === 'active'
                ? 'bg-green-400'
                : ticket.status === 'inactive'
                  ? 'bg-red-400'
                  : 'bg-gray-400'
              }`}
          ></span>
          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
        </div>
        <div className="text-xs text-gray-500" aria-label={`Created: ${formatDate(ticket.createdAt)}`}>
          {formatDate(ticket.createdAt)}
        </div>
      </div>
    </div>
  );
}