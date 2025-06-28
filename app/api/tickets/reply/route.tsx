import { NextResponse } from "next/server";
import { db } from "@/db/drizzle";
import { tickets, ticketReplies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Define input validation schema
const replySchema = z.object({
  ticket_id: z.string().uuid("Invalid ticket ID"),
  sender: z.enum(["user", "support"], { message: "Sender must be 'user' or 'support'" }),
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message cannot exceed 2000 characters"),
});

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { ticket_id, sender, message } = replySchema.parse(body);

    // Verify ticket exists
    const [ticket] = await db
      .select({ id: tickets.id })
      .from(tickets)
      .where(eq(tickets.id, ticket_id))
      .limit(1);

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Insert new reply
    const [newReply] = await db
      .insert(ticketReplies)
      .values({
        ticket_id,
        sender,
        message,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      message: "Reply submitted successfully",
      reply: {
        id: newReply.id,
        ticket_id: newReply.ticket_id,
        sender: newReply.sender,
        message: newReply.message,
        createdAt: newReply.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Ticket reply error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
