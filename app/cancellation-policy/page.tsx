import Link from "next/link";
import { getPolicyFacts } from "@/lib/policies/policy-facts";
import {
  ContactBlock,
  PolicyLayout,
  PolicyList,
  PolicySection,
} from "@/components/Policies/PolicyLayout";

// Charges come from Admin → Settings → Cancellation & Refunds (refreshed every 5 min)
export const revalidate = 300;

export const metadata = {
  title: "Cancellation Policy | 360 Electronics",
  description: "How to cancel an order at 360 Electronics, cancellation charges and refunds for cancelled orders.",
};

export default async function CancellationPolicy() {
  const { cancellation } = await getPolicyFacts();
  const { beforeShippingChargePercent: before, afterShippingChargePercent: after } = cancellation;
  const selfService = cancellation.customerCanCancel;

  return (
    <PolicyLayout
      title="Cancellation Policy"
      intro={
        <p>
          This policy explains how you can cancel an order placed on 360electronics.in, what it costs,
          and how refunds for cancelled orders work. For returns of delivered products, see our{" "}
          <Link href="/refund-policy" className="text-primary hover:underline">Return &amp; Refund Policy</Link>.
        </p>
      }
      footerNote="By purchasing from 360 Electronics, you acknowledge that you have read and agree to this Cancellation Policy."
    >
      <PolicySection number={1} title="How to Cancel an Order">
        {selfService ? (
          <PolicyList
            items={[
              <>
                Go to <strong>My Account → My Orders</strong>, open the order and click{" "}
                <strong>Cancel order</strong>. You will see the exact cancellation charge and refund amount before you confirm.
              </>,
              <>
                You can cancel online while the order is <strong>confirmed</strong>
                {cancellation.customerCanCancelAfterShipping
                  ? <> or after it has <strong>shipped</strong> (before delivery).</>
                  : <> and not yet shipped. Once an order has shipped, please contact us to cancel it.</>}
              </>,
              <>You can also cancel by calling or emailing us (details below).</>,
              <>Delivered orders cannot be cancelled. If there is a problem with a delivered product, please see the Return &amp; Refund Policy.</>,
            ]}
          />
        ) : (
          <PolicyList
            items={[
              <>To cancel an order, please call or email us with your order number (details below).</>,
              <>Delivered orders cannot be cancelled. If there is a problem with a delivered product, please see the Return &amp; Refund Policy.</>,
            ]}
          />
        )}
      </PolicySection>

      <PolicySection number={2} title="Cancellation Charges">
        <p>
          A convenience fee is deducted from the refund only when <strong>you (the buyer)</strong> cancel an order that
          has already been <strong>paid online</strong>:
        </p>
        <PolicyList
          items={[
            <><strong>{before}%</strong> of the amount paid if cancelled <strong>before the order is shipped</strong>.</>,
            <><strong>{after}%</strong> of the amount paid if cancelled <strong>after the order has been shipped</strong>.</>,
            <><strong>Cash on Delivery orders:</strong> no charge — nothing has been paid, so there is nothing to deduct or refund.</>,
            <><strong>Cancelled by us</strong> (for example due to stock unavailability or a pricing error): <strong>no charge</strong> — the full amount paid is refunded.</>,
          ]}
        />
        <p className="text-sm text-gray-600">
          Example: on a prepaid order of ₹10,000 cancelled by the buyer before shipping, ₹
          {((10000 * before) / 100).toLocaleString("en-IN")} is deducted and ₹
          {(10000 - (10000 * before) / 100).toLocaleString("en-IN")} is refunded.
        </p>
      </PolicySection>

      <PolicySection number={3} title="Refunds for Cancelled Orders">
        <PolicyList
          items={[
            <>Refunds for prepaid orders are sent to the <strong>original payment method</strong> (card, UPI, net banking or wallet) through our payment partner, Razorpay.</>,
            <>We initiate the refund after the cancellation is processed. It usually takes <strong>7–10 working days</strong> to reflect in your account, depending on your bank.</>,
            <>If a shipped order is cancelled, the refund is initiated once the product is returned to us in the same condition in which it was shipped.</>,
            <>You can see the cancellation charge, refund amount and refund status on the order page in your account.</>,
          ]}
        />
      </PolicySection>

      <PolicySection number={4} title="Order Modifications">
        <PolicyList
          items={[
            <>No charges apply for modifications requested <strong>before</strong> the order is shipped.</>,
            <>A <strong>3%</strong> charge applies if you want to modify the order <strong>after</strong> it has been shipped.</>,
            <>Modification requests are handled by our support team — please call or email us with your order number.</>,
          ]}
        />
      </PolicySection>

      <PolicySection number={5} title="Other Conditions">
        <PolicyList
          items={[
            <>The charges above apply only to cancellations and modifications initiated by the buyer. No charges apply when we initiate them.</>,
            <>A <strong>5%</strong> deduction applies to orders placed using <strong>Bajaj EMI</strong> if cancelled by the buyer.</>,
            <>We may cancel orders due to pricing errors, product unavailability or suspected fraudulent activity; in such cases the full amount paid is refunded.</>,
          ]}
        />
      </PolicySection>

      <ContactBlock purpose="To cancel an order or for any questions about this policy, contact us with your order number:" />
    </PolicyLayout>
  );
}
