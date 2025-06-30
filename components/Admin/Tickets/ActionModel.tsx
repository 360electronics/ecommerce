'use client';

import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Send, X } from 'lucide-react';
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
      inactive: 'closed',
      closed: 'active',
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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 "
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto animate-in fade-in zoom-in-95 duration-300 focus:outline-none"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
            Ticket #{editedTicket.id.slice(-6).toUpperCase()}
          </h2>
          <Button
            variant="ghost"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Ticket Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Issue Details</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Type:</span>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{editedTicket.type}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Description:</span>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-200 whitespace-pre-wrap">
                    {editedTicket.issueDesc}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Raised:</span>
                  <p className="text-sm text-gray-700">
                    {new Date(editedTicket.createdAt).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Customer Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex">
                  <span className="text-gray-500 w-24 font-medium">Name:</span>
                  <span className="font-medium">{editedTicket.customer.name}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-24 font-medium">Email:</span>
                  <span className="font-medium">{editedTicket.customer.email}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-24 font-medium">Phone:</span>
                  <span className="font-medium">{editedTicket.customer.phoneNumber}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-24 font-medium">Role:</span>
                  <span className="font-medium capitalize">{editedTicket.customer.role}</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-24 font-medium">Referral:</span>
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
            </div>
          </div>

          {/* Addresses */}
          {editedTicket.addresses.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Addresses</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editedTicket.addresses.map((address) => (
                  <div
                    key={address.id}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm"
                  >
                    <p className="font-medium text-gray-900">
                      {address.fullName}{' '}
                      {address.isDefault && (
                        <span className="text-blue-600 text-xs">(Default)</span>
                      )}
                    </p>
                    <p className="text-gray-700">
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                    </p>
                    <p className="text-gray-700">
                      {address.city}, {address.state} {address.postalCode}, {address.country}
                    </p>
                    <p className="text-gray-700">Phone: {address.phoneNumber}</p>
                    <p className="text-gray-700 capitalize">Type: {address.addressType}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Conversation</h3>
            <div className="max-h-[300px] overflow-y-auto p-4 bg-gray-50 rounded-lg border border-gray-200">
              {editedTicket.replies.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">No replies yet.</p>
              ) : (
                <div className="space-y-4">
                  {editedTicket.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className={`flex ${reply.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                          reply.sender === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                        }`}
                      >
                        <p className="text-sm">{reply.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {reply.sender === 'user' ? 'Customer' : 'Support'} •{' '}
                          {new Date(reply.createdAt).toLocaleString('en-US', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Reply Form */}
          <form onSubmit={handleReplySubmit}>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Add Reply</h3>
            <div className="flex items-end gap-3">
              <Textarea
                ref={replyInputRef}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                className="flex-1 resize-none border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg"
                rows={4}
                disabled={isSubmitting}
                aria-label="Reply message"
              />
              <Button
                type="submit"
                disabled={isSubmitting || !replyMessage.trim()}
                className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-4 py-2 flex items-center"
                aria-label="Send reply"
              >
                <Send className="h-5 w-5 mr-2" />
                {isSubmitting ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            onClick={handleStatusChange}
            className={`flex items-center gap-2 font-medium border ${getStatusColor(editedTicket.status)}`}
            aria-label={`Change status to ${
              editedTicket.status === 'active' ? 'inactive' : editedTicket.status === 'inactive' ? 'closed' : 'active'
            }`}
          >
            <span>
              Status: {editedTicket.status.charAt(0).toUpperCase() + editedTicket.status.slice(1)}
            </span>
            <ChevronRight className="h-5 w-5" />
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg px-6"
              aria-label="Cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-6"
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