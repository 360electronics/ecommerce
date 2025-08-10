import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import PaymentStatusPage from "@/components/Payment/Status";

export default function PaymentStatus() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex flex-col items-center justify-center text-center py-16">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <h1 className="text-2xl md:text-3xl font-semibold">Loading payment status...</h1>
          <p className="mt-2 text-muted-foreground">Please wait while we fetch your payment details.</p>
        </div>
      }
    >
      <PaymentStatusPage />
    </Suspense>
  );
}