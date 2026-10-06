import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server-auth";
import {
  cancelOrder,
  loadOrderForCancel,
  previewCancellation,
} from "@/lib/orders/cancel.server";
import type { CancelInitiator } from "@/lib/orders/cancellation";

type Params = Promise<{ id: string }>;

const isUuid = (id: string) => /^[0-9a-f-]{36}$/i.test(id);

// Customers always cancel as "customer" (charge applies). Admins choose:
// "customer" = cancelling on the buyer's request, "store" = we cancelled (full refund).
function resolveInitiator(
  requestedBy: unknown,
  isOwner: boolean,
  isAdmin: boolean,
): CancelInitiator | null {
  if (!isAdmin) return isOwner ? "customer" : null;
  if (requestedBy === "customer" || requestedBy === "store") return requestedBy;
  // An admin cancelling their OWN order from the customer page sends no choice —
  // treat it like any customer cancellation
  return isOwner && requestedBy == null ? "customer" : null;
}

async function authorize(request: Request, id: string) {
  // Log-in check first, so anonymous callers can't probe which orders exist
  const auth = await requireUser(request);
  if (auth.error) return { error: auth.error };

  if (!isUuid(id)) {
    return { error: NextResponse.json({ error: "Invalid order id" }, { status: 400 }) };
  }
  const order = await loadOrderForCancel(id);
  const isAdmin = auth.user.role === "admin";
  const isOwner = !!order && order.userId === auth.user.userId;
  // Same 404 for "missing" and "not yours"
  if (!order || (!isOwner && !isAdmin)) {
    return { error: NextResponse.json({ error: "Order not found" }, { status: 404 }) };
  }
  return { order, isOwner, isAdmin };
}

// GET /api/orders/[id]/cancel?by=customer|store → charge / refund preview
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const auth = await authorize(request, id);
    if ("error" in auth) return auth.error;

    const by = new URL(request.url).searchParams.get("by");
    const initiatedBy = resolveInitiator(by ?? "customer", auth.isOwner, auth.isAdmin);
    if (!initiatedBy) {
      return NextResponse.json({ error: "by must be customer or store" }, { status: 400 });
    }

    const quote = await previewCancellation(auth.order, initiatedBy);
    return NextResponse.json({ initiatedBy, ...quote });
  } catch (error) {
    console.error("[ORDER_CANCEL_PREVIEW_ERROR]", error);
    return NextResponse.json({ error: "Failed to load cancellation details" }, { status: 500 });
  }
}

// POST /api/orders/[id]/cancel  { reason?, cancelledBy? (admin only) }
export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const auth = await authorize(request, id);
    if ("error" in auth) return auth.error;

    const body = await request.json().catch(() => ({}));
    const initiatedBy = resolveInitiator(body?.cancelledBy, auth.isOwner, auth.isAdmin);
    if (!initiatedBy) {
      return NextResponse.json(
        { error: "cancelledBy must be 'customer' or 'store'" },
        { status: 400 },
      );
    }

    const reason = typeof body?.reason === "string" ? body.reason : null;
    const result = await cancelOrder(auth.order, initiatedBy, reason);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      orderId: result.order.id,
      ...result.quote,
    });
  } catch (error) {
    console.error("[ORDER_CANCEL_ERROR]", error);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
