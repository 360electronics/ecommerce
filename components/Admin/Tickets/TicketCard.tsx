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
        return 'bg-blue-100 text-green-600 border-green-300';
      case 'inactive':
        return 'bg-red-100 text-red-600 border-red-300';
      case 'closed':
        return 'bg-green-100 text-red-600 border-red-300';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300';
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

  // Get the default address or the first address
  const defaultAddress = ticket.addresses.find((addr) => addr.isDefault) || ticket.addresses[0];

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
      role="button"
      aria-label={`View ticket ${ticket.id}`}
    >
      <div className="flex items-center justify-between mb-4 w-full">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold text-blue-600 border border-gray-200">
            {ticket.customer.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm text-gray-900">{ticket.customer.name}</span>
            <span className="text-xs text-gray-500">{ticket.customer.email}</span>
          </div>
        </div>
        <div
          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md border border-gray-200 text-xs font-mono tracking-wider"
          aria-label={`Ticket ID: ${ticket.id}`}
        >
          #{ticket.id.slice(-6).toUpperCase()}
        </div>
      </div>

      <div className="mb-2">
        <span className="font-medium text-lg capitalize">{ticket.type}</span>
        <span className=" text-[14px]"> - Issue</span>
      </div>
      <p className=" text-gray-500 text-base mb-2 line-clamp-3">{ticket.issueDesc}</p>


     

      {defaultAddress && (
        <div className="text-gray-600 text-[12px] mb-2">
          <span className="font-medium">Address:</span>{' '}
          {`${defaultAddress.addressLine1}, ${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.postalCode}, ${defaultAddress.country}`}
        </div>
      )}

      <div className="flex gap-4 justify-between items-center">
        <div
          className={`px-2 py-1 rounded-sm text-xs font-medium border ${getStatusColor(ticket.status)}`}
          aria-label={`Status: ${ticket.status}`}
        >
          {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
        </div>
        <div className="text-xs text-blue-600" aria-label={`Created: ${formatDate(ticket.createdAt)}`}>
          {formatDate(ticket.createdAt)}
        </div>
      </div>
    </div>
  );
}