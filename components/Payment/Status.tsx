"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Receipt,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react"

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
    payment_status?: "SUCCESS" | "FAILED" | "PENDING" | "USER_DROPPED" | string
    payment_surcharge?: number | null
    payment_time?: string
  }
  message?: string
}

type StatusKind = "loading" | "success" | "pending" | "failed" | "user_dropped"

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

  // Polling logic
  useEffect(() => {
    if (!orderId) return

    let attempts = 0
    const maxAttempts = 20

    const startPolling = () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      pollTimerRef.current = setInterval(async () => {
        try {
          attempts++
          const data = await verifyOnce(orderId)
          setResult(data)

          if (data.success) {
            const s = data.payment?.payment_status
            if (s === "SUCCESS") {
              setStatus("success")
              clearInterval(pollTimerRef.current!)
            } else if (s === "PENDING") {
              setStatus("pending")
            } else if (s === "USER_DROPPED") {
              setStatus("user_dropped")
              clearInterval(pollTimerRef.current!)
            } else if (s === "FAILED") {
              setStatus("failed")
              clearInterval(pollTimerRef.current!)
            }
          }
          if (attempts >= maxAttempts) clearInterval(pollTimerRef.current!)
        } catch {
          if (attempts >= maxAttempts && pollTimerRef.current) clearInterval(pollTimerRef.current)
        }
      }, 3000)
    }

    ;(async () => {
      try {
        const data = await verifyOnce(orderId)
        setResult(data)

        if (data.success) {
          const s = data.payment?.payment_status
          if (s === "SUCCESS") {
            setStatus("success")
          } else if (s === "PENDING") {
            setStatus("pending")
            startPolling()
          } else if (s === "USER_DROPPED") {
            setStatus("user_dropped")
          } else if (s === "FAILED") {
            setStatus("failed")
          }
        }
      } catch {
        setStatus("loading")
        startPolling()
      }
    })()

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
    }
  }, [orderId])

  // Auto redirect only on success
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
      router.replace("/profile/orders")
    }, 10000)

    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    }
  }, [status, router])

  function manualRedirect() {
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current)
    router.push("/profile/orders")
  }

  return (
    <main className="min-h-[100dvh]">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 via-transparent to-transparent">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <Image src={"/logo/logo.png"} alt="Logo" width={120} height={120} />
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">Checkout</span>
            <ChevronRight className="h-4 w-4 hidden sm:block" />
            <span>Payment</span>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">Confirmation</span>
          </div>
          <Badge variant="secondary" className="gap-1 !bg-primary-light">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secured by Cashfree
          </Badge>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        {/* LOADING */}
        {status === "loading" && (
          <section className="flex flex-col items-center text-center py-16">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
            <h1 className="text-2xl md:text-3xl font-semibold">Confirming your payment</h1>
            <p className="mt-2 text-muted-foreground">
              {orderId
                ? `We’re verifying your payment for ${orderId}. This usually takes a few seconds.`
                : "We’re verifying your payment. This usually takes a few seconds."}
            </p>
          </section>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <section aria-live="polite">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="h-20 w-20 text-primary mb-5" />
              <h1 className="text-2xl md:text-3xl font-bold">Payment confirmed</h1>
              <p className="mt-2 text-muted-foreground">
                Your order has been placed successfully. Redirecting to your orders in {countdown}s…
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button onClick={manualRedirect} className="gap-2 !bg-primary/80">
                  Go to My Orders now
                  <ExternalLink className="h-4 w-4" />
                </Button>
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
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Order ID</dt>
                  <dd className="text-sm font-medium">{payment?.order_id || orderId || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Payment ID</dt>
                  <dd className="text-sm font-medium">{payment?.cf_payment_id || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Amount</dt>
                  <dd className="text-sm font-medium">
                    {formatINR(payment?.payment_amount ?? payment?.order_amount, payment?.payment_currency || "INR")}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Method</dt>
                  <dd className="text-sm font-medium">{getMethodLabel(payment)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Completed at</dt>
                  <dd className="text-sm font-medium">
                    {payment?.payment_completion_time
                      ? new Date(payment.payment_completion_time).toLocaleString()
                      : "-"}
                  </dd>
                </div>
              </dl>
            </div>
          </section>
        )}

        {/* PENDING */}
        {status === "pending" && (
          <section className="flex flex-col items-center text-center py-16">
            <Clock className="h-16 w-16 text-yellow-500 mb-6" />
            <h1 className="text-2xl md:text-3xl font-bold text-yellow-600">Payment Pending</h1>
            <p className="mt-2 text-muted-foreground">
              Your payment is still being processed. We’ll update your order once the bank confirms it.
            </p>
          </section>
        )}

        {/* FAILED */}
        {status === "failed" && (
          <section className="flex flex-col items-center text-center py-16">
            <XCircle className="h-16 w-16 text-red-500 mb-6" />
            <h1 className="text-2xl md:text-3xl font-bold text-red-600">Payment Failed</h1>
            <p className="mt-2 text-muted-foreground">Unfortunately, your payment could not be completed.</p>
            <Button onClick={() => router.replace("/")} className="mt-6">
              Close
            </Button>
          </section>
        )}

        {/* USER DROPPED */}
        {status === "user_dropped" && (
          <section className="flex flex-col items-center text-center py-16">
            <AlertCircle className="h-16 w-16 text-orange-500 mb-6" />
            <h1 className="text-2xl md:text-3xl font-bold text-orange-600">Payment Not Completed</h1>
            <p className="mt-2 text-muted-foreground">
              Looks like you left the payment flow before finishing. You can retry anytime.
            </p>
            <Button onClick={() => router.replace("/")} className="mt-6">
              Close
            </Button>
          </section>
        )}
      </div>
    </main>
  )
}
