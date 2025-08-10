"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Loader2, ShieldCheck, ExternalLink, ChevronRight, Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"

type PaymentGatewayDetails = {
  gateway_name?: string | null
  gateway_order_id?: string | null
  gateway_payment_id?: string | null
  gateway_order_reference_id?: string | null
  gateway_status_code?: string | null
}

type PaymentMethod =
  | { card?: Record<string, unknown> }
  | { upi?: Record<string, unknown> }
  | { netbanking?: Record<string, unknown> }
  | { wallet?: Record<string, unknown> }
  | Record<string, unknown>

type VerifyResponse = {
  success: boolean
  payment?: {
    auth_id?: string | null
    authorization?: string | null
    bank_reference?: string | null
    cf_payment_id?: string | null
    entity?: string
    error_details?: unknown
    international_payment?: { international: boolean }
    is_captured?: boolean
    order_amount?: number
    order_currency?: string
    order_id?: string
    payment_amount?: number
    payment_completion_time?: string
    payment_currency?: string
    payment_gateway_details?: PaymentGatewayDetails
    payment_group?: "card" | "upi" | "net_banking" | "wallet" | string
    payment_message?: string | null
    payment_method?: PaymentMethod | null
    payment_offers?: unknown
    payment_status?: "SUCCESS" | "FAILED" | "PENDING" | string
    payment_surcharge?: number | null
    payment_time?: string
  }
  message?: string
}

type StatusKind = "loading" | "success"

function formatINR(amount?: number, currency = "INR") {
  if (typeof amount !== "number") return "-"
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString("en-IN")}`
  }
}

function getMethodLabel(payment?: VerifyResponse["payment"]) {
  if (!payment) return "-"
  if (payment.payment_group === "net_banking") return "Net Banking"
  if (payment.payment_group === "upi") return "UPI"
  if (payment.payment_group === "card") return "Card"
  if (payment.payment_group === "wallet") return "Wallet"
  return payment.payment_group ? payment.payment_group.toString() : "-"
}

export default function PaymentStatusPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get("order_id")

  const [status, setStatus] = useState<StatusKind>("loading")
  const [result, setResult] = useState<VerifyResponse | null>(null)
  const [countdown, setCountdown] = useState<number>(4)

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const payment = result?.payment
  const pageTitle = useMemo(() => {
    return status === "loading" ? "Confirming your payment" : "Order placed successfully"
  }, [status])

  async function verifyOnce(currentOrderId: string) {
    const res = await fetch("/api/cashfree/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: currentOrderId }),
    })
    if (!res.ok) throw new Error(`Verification failed: ${res.status}`)
    const data: VerifyResponse = await res.json()
    return data
  }

  // Verify once and then poll until success, keeping UI only in "loading" and "success".
  useEffect(() => {
    if (!orderId) return

    let attempts = 0
    const maxAttempts = 20 // ~60s at 3s interval

    const startPolling = () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      pollTimerRef.current = setInterval(async () => {
        try {
          attempts++
          const data = await verifyOnce(orderId)
          // Always set the latest result so we can show receipt immediately upon success
          setResult(data)
          if (data.success && data.payment?.payment_status === "SUCCESS") {
            setStatus("success")
            if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          } else if (attempts >= maxAttempts) {
            // Keep UI simple: stay in "loading" but slow down attempts (optional). Here we just stop.
            if (pollTimerRef.current) clearInterval(pollTimerRef.current)
          }
        } catch {
          // Ignore transient errors; keep loading state and continue polling until attempts exhausted
          if (attempts >= maxAttempts && pollTimerRef.current) clearInterval(pollTimerRef.current)
        }
      }, 3000)
    }

    // Initial verification before polling
    ;(async () => {
      try {
        const data = await verifyOnce(orderId)
        setResult(data)
        if (data.success && data.payment?.payment_status === "SUCCESS") {
          setStatus("success")
        } else {
          setStatus("loading")
          startPolling()
        }
      } catch {
        // Start polling even if the first attempt fails
        setStatus("loading")
        startPolling()
      }
    })()

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [orderId])

  // Auto-redirect when success
  useEffect(() => {
    if (status !== "success") {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
      return
    }

    setCountdown(10)
    countdownTimerRef.current = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0))
    }, 1000)

    redirectTimerRef.current = setTimeout(() => {
      router.replace("/profile/orders") // programmatic navigation [^3]
    }, 10000)

    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [status, router])

  function manualRedirect() {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    router.push("/profile/orders") // user-initiated navigation [^3]
  }

  return (
    <main className="min-h-[100dvh]">
      {/* Subtle gradient header bar */}
      <div className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <div>
                <Image src={'/logo/logo.png'} alt='Logo' width={120} height={120} />
            </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">Checkout</span>
            <ChevronRight className="h-4 w-4 hidden sm:block" />
            <span>Payment</span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">Confirmation</span>
          </div>
          <Badge variant="secondary"  className="gap-1 !bg-primary-light">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secured by Cashfree
          </Badge>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        {/* Loading State (full-page, no boxes) */}
        {status === "loading" && (
          <section
            role="status"
            aria-live="polite"
            className="flex flex-col items-center justify-center text-center py-16"
          >
            <div className="relative mb-6">
              <div className="h-16 w-16 rounded-full border-4 border-primary-LIGHT" />
              <Loader2 className="h-16 w-16 absolute inset-0 m-auto animate-spin text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold">{pageTitle}</h1>
            <p className="mt-2 text-muted-foreground">
              {orderId
                ? `We’re verifying your payment for ${orderId}. This usually takes a few seconds.`
                : "We’re verifying your payment. This usually takes a few seconds."}
            </p>

            <div className="mt-10 w-full">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>Talking to the bank via Cashfree…</span>
              </div>
            </div>
          </section>
        )}

        {/* Success State (confirmation + receipt, no card boxes) */}
        {status === "success" && (
          <section aria-live="polite">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-5">
                <div className="h-20 w-20 rounded-full bg-primary/10 ring-8 ring-primary/10" />
                <CheckCircle2 className="h-20 w-20 absolute inset-0 m-auto text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">Payment confirmed</h1>
              <p className="mt-2 text-muted-foreground">
                Your order has been placed successfully. Redirecting to your orders in {countdown}s…
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button onClick={manualRedirect} className="gap-2 !bg-primary/80">
                  Go to My Orders now
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Link href="/category/all" className="text-sm text-muted-foreground hover:underline">
                  Continue shopping
                </Link>
              </div>
            </div>

            {/* Receipt */}
            <div className="mt-12">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Receipt</h2>
              </div>
              <Separator className="my-4" />
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                  <dt className="text-sm text-muted-foreground">Order ID</dt>
                  <dd className="text-sm font-medium">{payment?.order_id || orderId || "-"}</dd>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                  <dt className="text-sm text-muted-foreground">Payment ID</dt>
                  <dd className="text-sm font-medium">{payment?.cf_payment_id || "-"}</dd>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                  <dt className="text-sm text-muted-foreground">Amount</dt>
                  <dd className="text-sm font-medium">
                    {formatINR(payment?.payment_amount ?? payment?.order_amount, payment?.payment_currency || "INR")}
                  </dd>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                  <dt className="text-sm text-muted-foreground">Method</dt>
                  <dd className="text-sm font-medium">{getMethodLabel(payment)}</dd>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                  <dt className="text-sm text-muted-foreground">Completed at</dt>
                  <dd className="text-sm font-medium">
                    {payment?.payment_completion_time
                      ? new Date(payment.payment_completion_time).toLocaleString()
                      : "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                  <dt className="text-sm text-muted-foreground">Bank reference</dt>
                  <dd className="text-sm font-medium">{payment?.bank_reference || "-"}</dd>
                </div>
                <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                  <dt className="text-sm text-muted-foreground">Gateway</dt>
                  <dd className="text-sm font-medium">
                    {payment?.payment_gateway_details?.gateway_name || "CASHFREE"}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
