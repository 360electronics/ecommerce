import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { tickets, ticketReplies } from '@/db/schema/tickets/ticket.schema';

type Params = Promise<{ id: string }>;

export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const userId = id;

  try {
    const userTickets = await db
      .select({
        ticket: {
          id: tickets.id,
          userId: tickets.user_id,
          type: tickets.type,
          issueDesc: tickets.issue_desc,
          status: tickets.status,
          createdAt: tickets.createdAt,
          updatedAt: tickets.updatedAt,
        },
        replies: {
          id: ticketReplies.id,
          ticketId: ticketReplies.ticket_id,
          sender: ticketReplies.sender,
          message: ticketReplies.message,
          createdAt: ticketReplies.createdAt,
        },
      })
      .from(tickets)
      .leftJoin(ticketReplies, eq(ticketReplies.ticket_id, tickets.id))
      .where(eq(tickets.user_id, userId))
      .orderBy(tickets.createdAt);

    const ticketsWithReplies = userTickets.reduce((acc, { ticket, replies }) => {
      const existingTicket = acc.find((t) => t.id === ticket.id);
      if (existingTicket) {
        if (replies) {
          existingTicket.replies.push({
            id: replies.id,
            ticketId: replies.ticketId,
            sender: replies.sender,
            message: replies.message,
            createdAt: replies.createdAt,
          });
        }
      } else {
        acc.push({
          ...ticket,
          replies: replies
            ? [
                {
                  id: replies.id,
                  ticketId: replies.ticketId,
                  sender: replies.sender,
                  message: replies.message,
                  createdAt: replies.createdAt,
                },
              ]
            : [],
        });
      }
      return acc;
    }, [] as Array<{
      id: string;
      userId: string;
      type: string;
      issueDesc: string;
      status: 'active' | 'inactive';
      createdAt: Date;
      updatedAt: Date;
      replies: Array<{
        id: string;
        ticketId: string;
        sender: 'user' | 'support';
        message: string;
        createdAt: Date;
      }>;
    }>);

    return NextResponse.json(ticketsWithReplies);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
  }
}