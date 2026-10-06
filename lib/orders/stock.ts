import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { orders, products, variants } from "@/db/schema";

/*
 * Stock lifecycle
 *  - reserve:  at order creation (COD and online), inside the same DB batch as
 *              the order insert. The variants_stock_non_negative CHECK makes a
 *              concurrent order for the last unit fail instead of overselling.
 *  - release:  order cancelled, online payment failed/dismissed, order returned,
 *              or an unpaid online order abandoned for STALE_RESERVATION_MINUTES.
 *  - re-reserve: a payment that lands after its stock was released.
 * orders.stock_reserved guards every transition, so each runs at most once.
 */

export const STALE_RESERVATION_MINUTES = 30;
const STOCK_CHECK_CONSTRAINT = "variants_stock_non_negative";

export interface StockLine {
  variantId: string;
  quantity: number;
}

const groupByVariant = (lines: StockLine[]) => {
  const totals = new Map<string, number>();
  for (const { variantId, quantity } of lines) {
    totals.set(variantId, (totals.get(variantId) ?? 0) + quantity);
  }
  return totals;
};

/** UPDATE statements that take stock for a new order (run inside db.batch). */
export function reserveStockStatements(lines: StockLine[]) {
  return [...groupByVariant(lines)].map(([variantId, qty]) =>
    db
      .update(variants)
      .set({ stock: sql`${variants.stock} - ${qty}`, updatedAt: new Date() })
      .where(eq(variants.id, variantId)),
  );
}

/** Recompute products.total_stocks from their variants (derived value). */
export function syncProductTotalsStatement(productIds: string[]) {
  return db
    .update(products)
    .set({
      totalStocks: sql`(
        SELECT COALESCE(SUM(GREATEST(v.stock, 0)), 0)
        FROM ${variants} v WHERE v.product_id = ${sql.raw('"products"."id"')}
      )`,
    })
    .where(inArray(products.id, productIds));
}

async function syncProductTotals(productIds: string[]) {
  const unique = [...new Set(productIds.filter(Boolean))];
  if (unique.length === 0) return;
  await syncProductTotalsStatement(unique).catch((e) =>
    console.error("[STOCK_TOTALS_SYNC_ERROR]", e),
  );
}

/** True when an error is the "stock would go negative" CHECK violation. */
export function isStockShortageError(error: unknown) {
  const e = error as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string }; message?: string };
  const code = e?.code ?? e?.cause?.code;
  const constraint = e?.constraint ?? e?.cause?.constraint;
  return (
    code === "23514" &&
    (constraint === STOCK_CHECK_CONSTRAINT || String(e?.message ?? "").includes(STOCK_CHECK_CONSTRAINT))
  );
}

/** Human message naming the items that don't have enough stock. */
export async function describeShortage(lines: StockLine[]) {
  const wanted = groupByVariant(lines);
  const rows = await db
    .select({
      id: variants.id,
      name: variants.name,
      stock: variants.stock,
      backorder: variants.isBackorderable,
      product: products.shortName,
    })
    .from(variants)
    .innerJoin(products, eq(products.id, variants.productId))
    .where(inArray(variants.id, [...wanted.keys()]));

  const short = rows
    .filter((r) => !r.backorder && Number(r.stock) < (wanted.get(r.id) ?? 0))
    .map((r) => {
      const left = Math.max(0, Number(r.stock));
      return `${r.product}${r.name ? ` (${r.name})` : ""}: ${left === 0 ? "out of stock" : `only ${left} left`}`;
    });

  return short.length
    ? `Not enough stock — ${short.join("; ")}. Please update your cart.`
    : "Some items just went out of stock. Please update your cart.";
}

/**
 * Give an order's stock back. Single statement: flips stock_reserved and adds
 * the quantities back atomically; a second call is a no-op.
 */
export async function releaseOrderStock(orderId: string) {
  try {
    const result = await db.execute(sql`
      WITH claimed AS (
        UPDATE orders SET stock_reserved = false
        WHERE id = ${orderId} AND stock_reserved = true
        RETURNING id
      ),
      items AS (
        SELECT variant_id, SUM(quantity)::int AS qty
        FROM order_items WHERE order_id IN (SELECT id FROM claimed)
        GROUP BY variant_id
      )
      UPDATE variants v SET stock = v.stock + items.qty, updated_at = now()
      FROM items WHERE v.id = items.variant_id
      RETURNING v.product_id
    `);
    await syncProductTotals(result.rows.map((r) => String(r.product_id)));
    return result.rows.length > 0;
  } catch (error) {
    console.error("[STOCK_RELEASE_ERROR]", { orderId, error });
    return false;
  }
}

/**
 * Take stock for an existing order that isn't holding any (late payment after
 * release). Returns "reserved" | "already" | "insufficient".
 */
export async function reserveOrderStock(orderId: string): Promise<"reserved" | "already" | "insufficient"> {
  try {
    const result = await db.execute(sql`
      WITH claimed AS (
        UPDATE orders SET stock_reserved = true
        WHERE id = ${orderId} AND stock_reserved = false
        RETURNING id
      ),
      items AS (
        SELECT variant_id, SUM(quantity)::int AS qty
        FROM order_items WHERE order_id IN (SELECT id FROM claimed)
        GROUP BY variant_id
      )
      UPDATE variants v SET stock = v.stock - items.qty, updated_at = now()
      FROM items WHERE v.id = items.variant_id
      RETURNING v.product_id
    `);
    if (result.rows.length === 0) return "already";
    await syncProductTotals(result.rows.map((r) => String(r.product_id)));
    return "reserved";
  } catch (error) {
    // CHECK violation rolls back the whole statement (order stays unreserved)
    if (isStockShortageError(error)) return "insufficient";
    throw error;
  }
}

/**
 * Release stock held by unpaid online orders older than the reservation window
 * (closed tab, lost connection). Marks them cancelled / payment failed — a
 * late payment still confirms the order via markOrderPaid.
 */
export async function releaseStaleReservations() {
  const result = await db.execute(sql`
    WITH stale AS (
      UPDATE orders
      SET status = 'cancelled', payment_status = 'failed', stock_reserved = false, updated_at = now()
      WHERE payment_method = 'razorpay'
        AND payment_status IN ('pending', 'failed')
        AND status IN ('pending', 'failed')
        AND stock_reserved = true
        AND created_at < now() - make_interval(mins => ${STALE_RESERVATION_MINUTES})
      RETURNING id
    ),
    items AS (
      SELECT variant_id, SUM(quantity)::int AS qty
      FROM order_items WHERE order_id IN (SELECT id FROM stale)
      GROUP BY variant_id
    )
    UPDATE variants v SET stock = v.stock + items.qty, updated_at = now()
    FROM items WHERE v.id = items.variant_id
    RETURNING v.product_id
  `);
  await syncProductTotals(result.rows.map((r) => String(r.product_id)));
  return result.rows.length;
}

export async function flagStockIssue(orderId: string) {
  await db
    .update(orders)
    .set({ stockIssue: "out_of_stock_after_payment", updatedAt: new Date() })
    .where(eq(orders.id, orderId));
}
