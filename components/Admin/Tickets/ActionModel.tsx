'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useProfileStore } from '@/store/profile-store';
import toast from 'react-hot-toast';

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

interface TicketModalProps {
  isOpen: boolean;
  ticket: Ticket;
  onClose: () => void;
  onSave: (ticket: Ticket) => void;
}

export function TicketModal({ isOpen, ticket, onClose, onSave }: TicketModalProps) {
  const { referrals, fetchReferrals } = useProfileStore();
  const [editedTicket, setEditedTicket] = useState<Ticket>({ ...ticket });
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Update editedTicket when ticket prop changes
  useEffect(() => {
    setEditedTicket({ ...ticket });
  }, [ticket]);

  // Fetch referral data for the ticket's user
  useEffect(() => {
    if (isOpen && ticket.user_id) {
      fetchReferrals(ticket.user_id, true).catch(() => toast.error('Failed to fetch referral data'));
    }
  }, [isOpen, ticket.user_id, fetchReferrals]);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Focus management and keyboard events
  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement;

    if (modalRef.current) {
      modalRef.current.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (previousActiveElement.current && 'focus' in previousActiveElement.current) {
        (previousActiveElement.current as HTMLElement).focus();
      }
    };
  }, [isOpen, onClose]);

  // Cycle through statuses
  const handleStatusChange = () => {
    const statusMap: Record<string, 'active' | 'inactive' | 'closed'> = {
      active: 'inactive',
      inactive: 'active',
      closed: 'closed',
    };

    setEditedTicket({
      ...editedTicket,
      status: statusMap[editedTicket.status],
    });
  };

  // Handle reply submission
  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      toast.error('Reply message cannot be empty');
      return;
    }


    setIsSubmitting(true);
    try {
      const response = await fetch('/api/tickets/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: editedTicket.id,
          sender: 'support',
          message: replyMessage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reply');
      }

      const newReply = await response.json();
      setEditedTicket({
        ...editedTicket,
        replies: [
          ...editedTicket.replies,
          {
            id: newReply.id,
            sender: 'support',
            message: replyMessage,
            createdAt: new Date().toISOString(),
          },
        ],
      });
      setReplyMessage('');
      toast.success('Reply sent successfully');
      replyInputRef.current?.focus();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    onSave(editedTicket);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-blue-600';
      case 'inactive':
        return 'text-red-600';
      case 'closed':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!mounted || !isOpen) return null;

  // Check if the user is an admin


  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/50 backdrop-blur-sm"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto animate-in fade-in zoom-in-95 duration-200"
        tabIndex={-1}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div
              id="modal-title"
              className="bg-blue-100 text-blue-600 px-4 py-1 rounded-md text-sm font-medium border border-blue-300"
            >
              Ticket #{editedTicket.id}
            </div>
            <p className="text-sm text-gray-600 font-medium">
              Raised: {new Date(editedTicket.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="my-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Issue Type</h3>
            <p className="text-lg font-semibold text-gray-900">{editedTicket.type}</p>
          </div>

          <div className="my-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-700 text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-md border border-gray-200">
              {editedTicket.issueDesc}
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex">
              <span className="text-gray-500 w-32 font-medium">Customer Name:</span>
              <span className="font-medium">{editedTicket.customer.name}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-32 font-medium">Email:</span>
              <span className="font-medium">{editedTicket.customer.email}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-32 font-medium">Phone:</span>
              <span className="font-medium">{editedTicket.customer.phoneNumber}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-32 font-medium">Role:</span>
              <span className="font-medium">{editedTicket.customer.role}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 w-32 font-medium">Referral Link:</span>
              <span className="font-medium">
                {referrals.referralLink || 'No referral link available'}
                {referrals.referralLink && (
                  <Button
                    variant="link"
                    className="ml-2 p-0 h-auto text-blue-600 hover:underline"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(referrals.referralLink)
                        .then(() => toast.success('Referral link copied to clipboard!'))
                        .catch(() => toast.error('Failed to copy referral link'));
                    }}
                    aria-label="Copy referral link"
                  >
                    Copy
                  </Button>
                )}
              </span>
            </div>
          </div>

          {editedTicket.addresses.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Addresses</h3>
              <div className="space-y-3">
                {editedTicket.addresses.map((address) => (
                  <div key={address.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                    <p className="text-sm font-medium">
                      {address.fullName} {address.isDefault && <span className="text-blue-600">(Default)</span>}
                    </p>
                    <p className="text-sm text-gray-700">
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                    </p>
                    <p className="text-sm text-gray-700">
                      {address.city}, {address.state} {address.postalCode}, {address.country}
                    </p>
                    <p className="text-sm text-gray-700">Phone: {address.phoneNumber}</p>
                    <p className="text-sm text-gray-700">Type: {address.addressType}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Conversation</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto p-3 bg-gray-50 rounded-md border border-gray-200">
              {editedTicket.replies.length === 0 ? (
                <p className="text-sm text-gray-500">No replies yet.</p>
              ) : (
                editedTicket.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`flex ${reply.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${reply.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-gray-200 text-gray-800 rounded-tl-none'
                        }`}
                    >
                      <p className="text-sm">{reply.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {reply.sender === 'user' ? 'Customer' : 'Support'} •{' '}
                        {new Date(reply.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>


          <form onSubmit={handleReplySubmit} className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add Reply</h3>
            <div className="flex items-end gap-3">
              <Textarea
                ref={replyInputRef}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                className="flex-1 resize-none"
                rows={4}
                disabled={isSubmitting}
                aria-label="Reply message"
              />
              <Button
                type="submit"
                disabled={isSubmitting || !replyMessage.trim()}
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-md px-4 py-2"
                aria-label="Send reply"
              >
                <Send className="h-5 w-5" />
                <span className="ml-2">{isSubmitting ? 'Sending...' : 'Send'}</span>
              </Button>
            </div>
          </form>

        </div>

        <div className="flex justify-between items-center p-4 border-t border-gray-100">
          <div>
            <button
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium"
              onClick={handleStatusChange}
              aria-label={`Change status to ${editedTicket.status === 'inactive' ? 'active' : 'closed'}`}
            >
              <span className={getStatusColor(editedTicket.status)}>
                Status: {editedTicket.status.charAt(0).toUpperCase() + editedTicket.status.slice(1)}
              </span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-blue-600 text-blue-600 hover:bg-blue-50 rounded-md px-8"
              aria-label="Cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-md px-8"
              aria-label="Save changes"
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}