import Link from "next/link";
import {
  ContactBlock,
  PolicyLayout,
  PolicyList,
  PolicySection,
} from "@/components/Policies/PolicyLayout";

export const metadata = {
  title: "Return & Refund Policy | 360 Electronics",
  description: "When 360 Electronics accepts returns, how to raise a return request and how refunds are paid.",
};

export default function RefundPolicy() {
  return (
    <PolicyLayout
      title="Return & Refund Policy"
      intro={
        <p>
          This policy covers returns and refunds for products delivered by 360 Electronics. For cancelling an order
          before delivery (and cancellation charges), see our{" "}
          <Link href="/cancellation-policy" className="text-primary hover:underline">Cancellation Policy</Link>.
        </p>
      }
      footerNote="By purchasing from 360 Electronics, you acknowledge that you have read and agree to this Return & Refund Policy."
    >
      <PolicySection number={1} title="When We Accept Returns">
        <p>We accept return and refund requests <strong>only</strong> if the product delivered by us is:</p>
        <PolicyList
          items={[
            "Damaged on arrival",
            "The wrong product (different from what you ordered)",
            "Dead on arrival (does not power on / work at all)",
            "Defective",
          ]}
        />
        <p>
          We do not accept returns for change of mind, ordering the wrong item by mistake, or products that are working
          as described.
        </p>
      </PolicySection>

      <PolicySection number={2} title="Time Limit to Report">
        <PolicyList
          items={[
            <><strong>3 days</strong> from delivery to report any issue, for all products.</>,
            <><strong>7 days</strong> from delivery for complete PC set purchases.</>,
          ]}
        />
        <p>Requests raised after these periods cannot be accepted as returns; warranty claims are handled by the brand (see section 5).</p>
      </PolicySection>

      <PolicySection number={3} title="Conditions">
        <PolicyList
          items={[
            "If the product seal has been opened and the product is not faulty, return/refund is not applicable.",
            "Return/refund requests will be cancelled if any part or accessory is missing from the product box.",
            "The product must be packed exactly as originally received. Do not apply tape or glue directly on the product or its box — doing so may lead to cancellation of the return request.",
            "Gaming chairs: only part replacement is provided if the delivered product is defective or damaged. No refunds are issued for gaming chair orders.",
          ]}
        />
      </PolicySection>

      <PolicySection number={4} title="How to Raise a Return Request">
        <PolicyList
          items={[
            <>Raise a request from <strong>My Account → Help</strong>, or call / email us (details below), within the time limit above.</>,
            "Share your order number, the product, a description of the issue and photos of the product and packaging.",
            "Our team will verify the request and share the next steps for pickup or drop-off.",
            "After we receive and inspect the product, we will provide a replacement or a refund as applicable.",
            "Because returns are accepted only for damaged, wrong, dead or defective products, you are not charged for return shipping on approved returns.",
          ]}
        />
      </PolicySection>

      <PolicySection number={5} title="Manufacturer Warranty">
        <p>
          Products that come with a manufacturer&apos;s warranty are covered by the respective brand for issues that
          appear after the return period. Please contact the brand&apos;s service centre; we are happy to assist you
          with the process. 360 Electronics follows a liberal policy and will help as much as possible, subject to the
          terms above.
        </p>
      </PolicySection>

      <PolicySection number={6} title="How Refunds Are Paid">
        <PolicyList
          items={[
            <><strong>Paid online</strong> (card, UPI, net banking, wallet via Razorpay): refunded to the same payment method.</>,
            <><strong>Cash on Delivery or bank transfer:</strong> refunded only to the buyer&apos;s bank account — we will ask for your account details.</>,
            <>Refunds usually take <strong>7–10 working days</strong> to reflect after they are initiated, depending on your bank.</>,
            <>For refunds of <strong>cancelled</strong> orders and any cancellation charges, see the{" "}
              <Link href="/cancellation-policy" className="text-primary hover:underline">Cancellation Policy</Link>.</>,
          ]}
        />
      </PolicySection>

      <PolicySection number={7} title="Changes to This Policy">
        <p>
          We may update this policy from time to time. The updated version will be posted on this page with a new
          &quot;Last updated&quot; date. The policy in effect when you placed your order applies to that order.
        </p>
      </PolicySection>

      <ContactBlock purpose="For return and refund requests, contact us with your order number:" />
    </PolicyLayout>
  );
}
