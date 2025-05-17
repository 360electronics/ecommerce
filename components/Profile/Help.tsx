'use client';

import { useState, useCallback, useEffect } from 'react';
import { IoArrowForwardCircleSharp as RightArrow } from 'react-icons/io5';
import { FaCheckCircle, FaTimesCircle, FaPlus, FaSpinner } from 'react-icons/fa';
import { BiSend } from 'react-icons/bi';
import { MdAttachFile, MdRefresh } from 'react-icons/md';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { useProfileStore } from '@/store/profile-store';

interface Ticket {
  id: string;
  type: string;
  issueDesc: string;
  status: 'active' | 'inactive' | 'resolved';
  createdAt: string;
  replies: Reply[];
}

interface Reply {
  id: string;
  sender: 'user' | 'support';
  message: string;
  createdAt: string;
}

export default function Help() {
  const { user } = useAuthStore();
  const { tickets, isLoading, isRefetching, refetch } = useProfileStore();
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newReply, setNewReply] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Handle modal close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  // Handle ticket submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user?.id) {
        setError('Please sign in to submit a ticket.');
        toast.error('Please sign in to submit a ticket.');
        return;
      }
      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            type: issueType,
            issue_desc: description,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit ticket');

        toast.success('Your ticket has been submitted successfully.');
        setIssueType('');
        setDescription('');
        setIsModalOpen(false);
        refetch('tickets', user.id, true);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to submit ticket';
        setError(message);
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.id, issueType, description, refetch]
  );

  // Handle reply submission
  const handleReplySubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedTicket || !newReply.trim()) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch('/api/ticket-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket_id: selectedTicket.id,
            sender: 'user',
            message: newReply,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to submit reply');

        setNewReply('');
        refetch('tickets', user?.id!, true);
        toast.success('Reply submitted successfully.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to submit reply';
        setError(message);
        toast.error(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [selectedTicket, newReply, refetch]
  );

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch {
      return 'Invalid date';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'p');
    } catch {
      return 'Invalid time';
    }
  };

  // Select ticket
  const handleTicketSelect = useCallback((ticket: Ticket) => {
    setSelectedTicket(ticket);
    setError(null);
  }, []);

  // Filter tickets based on status
  const filteredTickets = filterStatus === 'all' ? tickets : tickets.filter((ticket: { status: string }) => ticket.status === filterStatus);

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FaCheckCircle className="mr-1" />
            Active
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FaTimesCircle className="mr-1" />
            Inactive
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FaCheckCircle className="mr-1" />
            Resolved
          </span>
        );
      default:
        return null;
    }
  };

  // Map ticket types to readable labels
  const getTicketTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      feature: 'Shipping & Delivery',
      account: 'Order Related',
      payment: 'Payment Problem',
      bug: 'Technical Issue',
      other: 'Other',
    };
    return typeMap[type] || type;
  };

  return (
    <div className="flex items-start justify-center p-4 md:p-6 min-h-screen">
      <div className="w-full max-w-7xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <FaTimesCircle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 nohemi-bold">
              Support <span className="text-primary border-b-3 border-primary">Tickets</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Submit and track your support requests</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-auto pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter tickets by status"
              >
                <option value="all">All Tickets</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition w-full sm:w-auto"
              aria-label="Create new ticket"
            >
              <FaPlus size={16} /> New Ticket
            </Button>

            <Button
              onClick={() => refetch('tickets', user?.id!, true)}
              variant="outline"
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition w-full sm:w-auto"
              disabled={isLoading || isRefetching}
              aria-label="Refresh tickets"
            >
              {isLoading || isRefetching ? (
                <FaSpinner className="animate-spin" size={16} />
              ) : (
                <MdRefresh size={16} />
              )}
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-medium text-gray-900">Your Tickets</h2>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center p-10 text-gray-500">
                  <FaSpinner className="animate-spin mr-2" /> Loading tickets...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {filterStatus === 'all'
                    ? 'No tickets found. Create a new ticket to get started.'
                    : `No ${filterStatus} tickets found.`}
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto">
                  <div className="divide-y divide-gray-200">
                    {filteredTickets.map((ticket: Ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => handleTicketSelect(ticket)}
                        className={`w-full p-4 text-left cursor-pointer hover:bg-gray-50 transition ${
                          selectedTicket?.id === ticket.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        }`}
                        aria-label={`Select ticket: ${getTicketTypeLabel(ticket.type)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-md font-semibold text-gray-900 capitalize truncate">
                              {getTicketTypeLabel(ticket.type)}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.issueDesc}</p>
                            <div className="flex items-center mt-2 text-xs text-gray-500">
                              <span>{formatDate(ticket.createdAt)}</span>
                              <span className="mx-2">•</span>
                              <span>{ticket.replies.length} {ticket.replies.length === 1 ? 'reply' : 'replies'}</span>
                            </div>
                          </div>
                          <div className="ml-4">{getStatusBadge(ticket.status)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Ticket and Replies */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="bg-white rounded-lg border border-slate-200 h-full flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{getTicketTypeLabel(selectedTicket.type)}</h2>
                    <p className="text-sm text-gray-500">
                      {formatDate(selectedTicket.createdAt)} • {getStatusBadge(selectedTicket.status)}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap bg-white p-3 rounded-md">
                    {selectedTicket.issueDesc}
                  </p>
                </div>

                {/* Replies */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-100 min-h-[300px]">
                  {selectedTicket.replies.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No replies yet. Add a reply below.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedTicket.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className={`flex ${reply.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              reply.sender === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white text-gray-800 rounded-tl-none'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{reply.message}</p>
                            <div className="flex justify-end mt-1">
                              <span className={`text-xs ${reply.sender === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                                {formatTime(reply.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reply Input */}
                {selectedTicket.status === 'active' ? (
                  <form onSubmit={handleReplySubmit} className="p-4 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        disabled={isSubmitting}
                        aria-label="Reply to ticket"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
                        title="Attach Files (coming soon)"
                        disabled={true}
                        aria-label="Attach files (disabled)"
                      >
                        <MdAttachFile size={18} />
                      </Button>
                      <Button
                        type="submit"
                        className="px-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
                        disabled={!newReply.trim() || isSubmitting}
                        aria-label="Send reply"
                      >
                        {isSubmitting ? <FaSpinner className="animate-spin" size={16} /> : <BiSend size={18} />}
                        <span className="hidden sm:inline">Send</span>
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-gray-500">
                    This ticket is {selectedTicket.status}. Replies are disabled.
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center h-full flex flex-col items-center justify-center text-gray-500">
                <div className="p-4 rounded-full bg-gray-100 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">No Ticket Selected</h2>
                <p className="mb-4">Select a ticket from the list or create a new one to get started.</p>
                <Button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  aria-label="Create new ticket"
                >
                  <FaPlus size={16} /> New Ticket
                </Button>
              </div>
            )}
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 flex flex-col items-center justify-center w-full max-h-screen overflow-auto bg-black/80">
            <section className="max-w-4xl w-full mx-auto p-6 bg-white border border-slate-200 rounded-lg mt-10">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 nohemi-bold">
                Describe your <span className="text-primary">Issue</span>
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
                  <FaTimesCircle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 text-base font-medium text-gray-700" htmlFor="issue-type">
                    Issue Type
                  </label>
                  <select
                    id="issue-type"
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    disabled={isSubmitting}
                    aria-label="Select issue type"
                  >
                    <option value="" disabled>
                      Select an issue
                    </option>
                    <option value="feature">Shipping & Delivery</option>
                    <option value="account">Order Related</option>
                    <option value="payment">Payment Problem</option>
                    <option value="bug">Technical Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-base font-medium text-gray-700" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    required
                    placeholder="Please describe your issue in detail..."
                    className="w-full border border-gray-300 rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    disabled={isSubmitting}
                    aria-label="Describe your issue"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition text-base"
                    disabled={isSubmitting}
                    onClick={() => setIsModalOpen(false)}
                    aria-label="Cancel ticket submission"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700 transition flex items-center gap-2 text-base"
                    disabled={isSubmitting}
                    aria-label="Submit ticket"
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin" size={16} /> Submitting...
                      </>
                    ) : (
                      <>
                        Submit Ticket <RightArrow className="" size={20} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}