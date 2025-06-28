import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { ticketReplies, tickets } from '@/db/schema/tickets/ticket.schema';
import { users, savedAddresses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    // Build the query with joins for users and saved_addresses
    const query = db
      .select({
        id: tickets.id,
        user_id: tickets.user_id,
        type: tickets.type,
        issueDesc: tickets.issue_desc,
        status: tickets.status,
        createdAt: tickets.createdAt,
        customer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phoneNumber: users.phoneNumber,
          role: users.role,
        },
        address: {
          id: savedAddresses.id,
          fullName: savedAddresses.fullName,
          phoneNumber: savedAddresses.phoneNumber,
          addressLine1: savedAddresses.addressLine1,
          addressLine2: savedAddresses.addressLine2,
          city: savedAddresses.city,
          state: savedAddresses.state,
          postalCode: savedAddresses.postalCode,
          country: savedAddresses.country,
          addressType: savedAddresses.addressType,
          isDefault: savedAddresses.isDefault,
        },
        replies: ticketReplies,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.user_id, users.id))
      .leftJoin(savedAddresses, eq(users.id, savedAddresses.userId))
      .leftJoin(ticketReplies, eq(tickets.id, ticketReplies.ticket_id));

    // If user_id is provided, filter by user_id
    let ticketData;
    if (userId) {
      ticketData = await query.where(eq(tickets.user_id, userId));
    } else {
      ticketData = await query;
    }

    // Group replies and addresses by ticket
    const groupedTickets = ticketData.reduce((acc, row) => {
      const ticketId = row.id;
      if (!acc[ticketId]) {
        acc[ticketId] = {
          id: row.id,
          user_id: row.user_id,
          type: row.type,
          issueDesc: row.issueDesc,
          status: row.status,
          createdAt: row.createdAt.toISOString(),
          customer: {
            id: row.customer?.id ?? '',
            name: row.customer?.firstName
              ? `${row.customer.firstName} ${row.customer.lastName || ''}`.trim()
              : 'Guest',
            email: row.customer?.email ?? '',
            phoneNumber: row.customer?.phoneNumber ?? '',
            role: row.customer?.role ?? 'user',
          },
          addresses: [],
          replies: [],
        };
      }
      if (row.address?.id) {
        acc[ticketId].addresses.push({
          id: row.address.id,
          fullName: row.address.fullName,
          phoneNumber: row.address.phoneNumber,
          addressLine1: row.address.addressLine1,
          addressLine2: row.address.addressLine2,
          city: row.address.city,
          state: row.address.state,
          postalCode: row.address.postalCode,
          country: row.address.country,
          addressType: row.address.addressType,
          isDefault: row.address.isDefault,
        });
      }
      if (row.replies?.id) {
        acc[ticketId].replies.push({
          id: row.replies.id,
          sender: row.replies.sender,
          message: row.replies.message,
          createdAt: row.replies.createdAt.toISOString(),
        });
      }
      return acc;
    }, {} as Record<string, any>);

    const ticketsArray = Object.values(groupedTickets);

    return NextResponse.json(ticketsArray);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, type, issue_desc } = body;

    if (!user_id || !type || !issue_desc) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await db.insert(tickets).values({
      user_id,
      type,
      issue_desc,
    });

    return NextResponse.json({ message: 'Ticket submitted successfully', result });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const body = await req.json();
    const { status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    if (!status || !['active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'Invalid or missing status' }, { status: 400 });
    }

    const [updatedTicket] = await db
      .update(tickets)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();

    if (!updatedTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Ticket status updated successfully',
      ticket: {
        id: updatedTicket.id,
        user_id: updatedTicket.user_id,
        type: updatedTicket.type,
        issueDesc: updatedTicket.issue_desc,
        status: updatedTicket.status,
        createdAt: updatedTicket.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}