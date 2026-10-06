import { db } from "@/db/drizzle";
import {
  cart_offer_products,
  checkout,
  checkoutSessions,
  orderItems,
  orders,
  products,
  savedAddresses,
  variants,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sendOrderConfirmationEmail, sendAdminOrderNotification } from "@/lib/nodemailer";
import { getOrderEmailData } from "@/lib/order-email-helper";
import { requireUser } from "@/lib/server-auth";
import { consumeCoupon, normalizeCouponCode, validateCoupon } from "@/lib/coupon-service";
import {
  calculateCheckoutTotals,
  codIneligibleMessage,
  effectiveQuantity,
  getCodEligibility,
  isExpressDeliveryAvailable,
  roundCurrency,
  type DeliveryMode,
  type PaymentMethod,
  type PricingCoupon,
} from "@/lib/checkout/pricing";
import { getCheckoutSettings } from "@/lib/settings/checkout-settings.server";

const DELIVERY_MODES: DeliveryMode[] = ["standard", "express"];
const PAYMENT_METHODS: PaymentMethod[] = ["razorpay", "cod"];

const errorResponse = (error: string, code: string, status = 400) =>
  NextResponse.json({ error, code }, { status });

/*
 * POST /api/orders
 * Creates an order from the user's active checkout session.
 * Everything money-related (prices, discount, shipping, total, COD eligibility)
 * is computed here from the DB — client-sent amounts are ignored.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      userId: claimedUserId,
      checkoutSessionId,
      addressId,
      couponCode,
      deliveryMode,
      paymentMethod,
    } = body ?? {};

    const auth = await requireUser(req, claimedUserId);
    if (auth.error) return auth.error;
    const userId = auth.user.userId;

    if (!checkoutSessionId || !addressId) {
      return errorResponse("Missing required fields", "MISSING_FIELDS");
    }

    if (!DELIVERY_MODES.includes(deliveryMode)) {
      return errorResponse("Invalid delivery mode", "INVALID_DELIVERY_MODE");
    }

    if (!PAYMENT_METHODS.includes(paymentMethod)) {
      return errorResponse("Invalid payment method", "INVALID_PAYMENT_METHOD");
    }

    /* 1️⃣ Checkout session must be this user's and still active */
    const [session] = await db
      .select()
      .from(checkoutSessions)
      .where(
        and(
          eq(checkoutSessions.id, checkoutSessionId),
          eq(checkoutSessions.userId, userId),
        ),
      )
      .limit(1);

    if (!session) {
      return errorResponse("Checkout session not found", "SESSION_NOT_FOUND", 404);
    }

    if (session.status !== "active") {
      return errorResponse(
        "This checkout session is no longer active",
        "SESSION_NOT_ACTIVE",
        409,
      );
    }

    /* 2️⃣ Address must belong to the user */
    const [address] = await db
      .select()
      .from(savedAddresses)
      .where(and(eq(savedAddresses.id, addressId), eq(savedAddresses.userId, userId)))
      .limit(1);

    if (!address) {
      return errorResponse("Delivery address not found", "ADDRESS_NOT_FOUND");
    }

    /* 3️⃣ Load checkout items with live prices */
    const items = await db
      .select({
        productId: checkout.productId,
        variantId: checkout.variantId,
        cartOfferProductId: checkout.cartOfferProductId,
        quantity: checkout.quantity,
        ourPrice: variants.ourPrice,
        mrp: variants.mrp,
        productDeliveryMode: products.deliveryMode,
        offerPrice: cart_offer_products.ourPrice,
      })
      .from(checkout)
      .innerJoin(variants, eq(checkout.variantId, variants.id))
      .innerJoin(products, eq(checkout.productId, products.id))
      .leftJoin(
        cart_offer_products,
        eq(checkout.cartOfferProductId, cart_offer_products.id),
      )
      .where(
        and(
          eq(checkout.checkoutSessionId, session.id),
          eq(checkout.userId, userId),
        ),
      );

    if (items.length === 0) {
      return errorResponse("Checkout empty", "CHECKOUT_EMPTY");
    }

    if (items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) {
      return errorResponse("Invalid item quantity", "INVALID_QUANTITY");
    }

    const settings = await getCheckoutSettings();

    if (
      deliveryMode === "express" &&
      !isExpressDeliveryAvailable(
        items.map((item) => item.productDeliveryMode),
        address.city,
        settings.express,
        { skipCityCheck: true },
      )
    ) {
      return errorResponse(
        "Express delivery is not available for these items",
        "EXPRESS_NOT_AVAILABLE",
      );
    }

    const lines = items.map((item) => {
      const ourPrice = Number(item.ourPrice) || 0;
      return {
        ourPrice,
        mrp: Number(item.mrp) || ourPrice,
        quantity: item.quantity,
        hasOffer: !!item.cartOfferProductId,
        offerPrice: item.cartOfferProductId ? Number(item.offerPrice) || 0 : 0,
      };
    });

    /* 4️⃣ Re-validate coupon against the real subtotal */
    const baseTotals = calculateCheckoutTotals(lines, deliveryMode, null, settings);

    let appliedCoupon: { id: string; code: string; pricing: PricingCoupon } | null = null;
    if (normalizeCouponCode(couponCode)) {
      const result = await validateCoupon(couponCode, userId, baseTotals.subtotal);
      if (!result.ok) {
        return errorResponse(result.error, `COUPON_${result.code}`);
      }
      appliedCoupon = {
        id: result.coupon.id,
        code: result.coupon.code,
        pricing: { type: result.coupon.type, value: result.coupon.value },
      };
    }

    const totals = calculateCheckoutTotals(
      lines,
      deliveryMode,
      appliedCoupon?.pricing ?? null,
      settings,
    );

    /* 5️⃣ COD rules from admin settings (enabled, amount limit, pincodes) */
    if (paymentMethod === "cod") {
      const cod = getCodEligibility(totals.grandTotal, address.postalCode, settings.cod);
      if (!cod.eligible) {
        return errorResponse(
          codIneligibleMessage(cod.reason, settings.cod),
          "COD_NOT_AVAILABLE",
        );
      }
    }

    /* 6️⃣ Atomically claim the session — guarantees one order per session */
    const claimed = await db
      .update(checkoutSessions)
      .set({ status: "converted", lockedAt: new Date() })
      .where(
        and(
          eq(checkoutSessions.id, session.id),
          eq(checkoutSessions.status, "active"),
        ),
      )
      .returning({ id: checkoutSessions.id });

    if (claimed.length === 0) {
      return errorResponse(
        "An order has already been placed for this checkout",
        "SESSION_NOT_ACTIVE",
        409,
      );
    }

    /* 7️⃣ Create order + items and clear checkout rows in one DB transaction */
    const isCod = paymentMethod === "cod";
    const orderId = randomUUID();

    let order: typeof orders.$inferSelect;
    try {
      const [insertedOrders] = await db.batch([
        db
          .insert(orders)
          .values({
            id: orderId,
            userId,
            checkoutSessionId: session.id,
            addressId: address.id,
            totalAmount: totals.grandTotal.toFixed(2),
            discountAmount: totals.discountAmount.toFixed(2),
            shippingAmount: totals.shippingAmount.toFixed(2),
            couponId: appliedCoupon?.id ?? null,
            couponCode: appliedCoupon?.code ?? null,
            deliveryMode,
            paymentMethod,
            // COD is confirmed immediately; online orders wait for payment
            status: isCod ? "confirmed" : "pending",
            paymentStatus: isCod ? "cod" : "pending",
          })
          .returning(),
        db.insert(orderItems).values(
          items.map((item, i) => ({
            orderId,
            productId: item.productId,
            variantId: item.variantId,
            cartOfferProductId: item.cartOfferProductId,
            quantity: effectiveQuantity(lines[i]),
            // Offer lines are qty 1 and carry the bundled offer price
            unitPrice: roundCurrency(lines[i].ourPrice + lines[i].offerPrice).toFixed(2),
          })),
        ),
        db.delete(checkout).where(eq(checkout.checkoutSessionId, session.id)),
      ]);
      order = insertedOrders[0];
    } catch (err) {
      // Release the session so the user can retry
      await db
        .update(checkoutSessions)
        .set({ status: "active", lockedAt: null })
        .where(
          and(
            eq(checkoutSessions.id, session.id),
            eq(checkoutSessions.status, "converted"),
          ),
        )
        .catch((e) => console.error("[ORDER_SESSION_RELEASE_ERROR]", e));
      throw err;
    }

    /* 8️⃣ COD is final now: consume coupon + send emails */
    if (isCod) {
      if (appliedCoupon) {
        const consumed = await consumeCoupon(appliedCoupon.code, userId).catch((e) => {
          console.error("[ORDER_COUPON_CONSUME_ERROR]", e);
          return false;
        });
        if (!consumed) {
          console.warn("[ORDER_COUPON_NOT_CONSUMED]", { orderId, code: appliedCoupon.code });
        }
      }

      getOrderEmailData(order.id).then((emailData) => {
        if (emailData) {
          sendOrderConfirmationEmail(emailData);
          sendAdminOrderNotification(emailData);
        }
      }).catch((err) => console.error("[ORDER_EMAIL_FETCH_ERROR]", err));
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("ORDER CREATE FAILED", err);
    return NextResponse.json(
      { error: "Failed to create order", code: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}

// Admin order listing lives at GET /api/admin/orders (paginated).
