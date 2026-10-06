import Link from "next/link";
import { BUSINESS, getPolicyFacts } from "@/lib/policies/policy-facts";
import {
  ContactBlock,
  PolicyLayout,
  PolicyList,
  PolicySection,
} from "@/components/Policies/PolicyLayout";

// Delivery charges / COD rules come from Admin → Settings (refreshed every 5 min)
export const revalidate = 300;

export const metadata = {
  title: "Terms and Conditions | 360 Electronics",
  description: "Terms for using 360electronics.in: accounts, orders, payments, shipping, returns and more.",
};

export default async function TermsAndConditions() {
  const { cod, shipping, express } = await getPolicyFacts();

  return (
    <PolicyLayout
      title="Terms and Conditions"
      footerNote="By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions."
    >
      <PolicySection number={1} title="Introduction">
        <p>
          These Terms and Conditions govern your use of our e-commerce platform (360electronics.in) and services. By
          accessing or using our website, you agree to be bound by these terms.
        </p>
        <p>
          &quot;We,&quot; &quot;us,&quot; or &quot;our&quot; refers to {BUSINESS.name} ({BUSINESS.aka}), operating from{" "}
          {BUSINESS.address}. &quot;You&quot; or &quot;your&quot; refers to any individual or entity using our services.
        </p>
      </PolicySection>

      <PolicySection number={2} title="Your Account">
        <PolicyList
          items={[
            "You sign in with a one-time password (OTP) sent to your registered mobile number or email address. We do not use passwords.",
            "Never share your OTP with anyone. 360 Electronics will never ask you for your OTP.",
            "You must provide accurate and complete information, including delivery addresses and contact details.",
            "You are responsible for activity on your account and must notify us immediately of any unauthorized use.",
            "We reserve the right to suspend or terminate accounts that violate these terms.",
          ]}
        />
      </PolicySection>

      <PolicySection number={3} title="Products and Services">
        <PolicyList
          items={[
            "All product descriptions, images, and specifications are provided for informational purposes.",
            "We strive for accuracy but do not guarantee that all information is error-free.",
            "Product availability is subject to change without notice.",
            "We reserve the right to modify or discontinue products at any time.",
          ]}
        />
      </PolicySection>

      <PolicySection number={4} title="Orders, Prices and Payment">
        <PolicyList
          items={[
            "All orders are subject to acceptance and availability.",
            "Prices are displayed in Indian Rupees (INR) and include applicable taxes unless stated otherwise. The final amount payable — including any discount and delivery charges — is calculated and shown at checkout.",
            "Discount coupons are subject to their own validity, minimum order value and usage limits, which are checked again when you place the order.",
            <><strong>Online payment:</strong> cards, UPI, net banking and wallets, processed securely by our payment partner Razorpay. Payment must be completed for the order to be confirmed. Card transactions are subject to validation by your card issuer and limits agreed with our acquiring bank.</>,
            cod.enabled ? (
              <><strong>Cash on Delivery (COD):</strong> available for orders below <strong>{cod.maxAmount}</strong> to {cod.region}
                {cod.hasExclusions ? " (some PIN codes are excluded)" : ""}. COD availability is shown at checkout for your address and order value.</>
            ) : (
              <><strong>Cash on Delivery</strong> is currently not available.</>
            ),
            "We reserve the right to cancel orders due to pricing errors, product unavailability, or suspected fraudulent activity. In such cases, any amount paid is refunded in full.",
          ]}
        />
      </PolicySection>

      <PolicySection number={5} title="Shipping and Delivery">
        <PolicyList
          items={[
            <><strong>Delivery area:</strong> we currently deliver only within India.</>,
            <><strong>Standard delivery:</strong> {shipping.ratePerItem} per item, <strong>free</strong> when your order subtotal is above {shipping.freeAbove}. Estimated delivery within about {shipping.days} days.</>,
            express.enabled ? (
              <><strong>Express delivery:</strong> {express.ratePerItem} per item, estimated within {express.days} day{express.days === 1 ? "" : "s"}. Available only in {express.cities}, and only when every product in the order is eligible for express delivery. Availability is shown at checkout.</>
            ) : (
              <><strong>Express delivery</strong> is currently not available.</>
            ),
            <><strong>Processing time:</strong> orders are handed over to the courier within 0–7 days from order confirmation (and payment, for prepaid orders), or as per the delivery date agreed at the time of confirmation.</>,
            <><strong>Couriers:</strong> orders are shipped through registered domestic courier companies and/or speed post. Delivery timelines are subject to the courier&apos;s / post office&apos;s norms; estimated dates are not guaranteed.</>,
            <><strong>Delivery address:</strong> orders are delivered to the address selected at checkout. Please make sure it is complete and correct.</>,
            <><strong>Liability:</strong> 360 Electronics is not liable for delays caused by the courier company or postal authorities.</>,
            <>Order confirmations and status updates are sent to your registered email address.</>,
          ]}
        />
      </PolicySection>

      <PolicySection number={6} title="Cancellations, Returns and Refunds">
        <p>
          Cancellations (including cancellation charges) are governed by our{" "}
          <Link href="/cancellation-policy" className="text-primary hover:underline">Cancellation Policy</Link>, and returns
          and refunds by our{" "}
          <Link href="/refund-policy" className="text-primary hover:underline">Return &amp; Refund Policy</Link>. In short:
          returns are accepted only for damaged, wrong, dead or defective products reported within 3 days of delivery
          (7 days for complete PC sets), and refunds usually reflect within 7–10 working days of being initiated.
        </p>
      </PolicySection>

      <PolicySection number={7} title="Intellectual Property">
        <PolicyList
          items={[
            "All content on our website, including text, graphics, logos, and software, is our property or licensed to us.",
            "You may not reproduce, distribute, or create derivative works without our written consent.",
            "Trademarks and brand names belong to their respective owners.",
          ]}
        />
      </PolicySection>

      <PolicySection number={8} title="User Conduct">
        <PolicyList
          items={[
            "You agree not to use our platform for any unlawful or prohibited activities.",
            "You may not interfere with the proper functioning of our website or services.",
            "Reviews and comments must be truthful and not violate any third-party rights.",
            "We reserve the right to remove content that violates these terms.",
          ]}
        />
      </PolicySection>

      <PolicySection number={9} title="Privacy and Data Protection">
        <p>
          Your privacy is important to us. Please review our{" "}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link> for details on how we
          collect and use your information. By using our services, you consent to the collection and use of information
          as described there.
        </p>
      </PolicySection>

      <PolicySection number={10} title="Limitation of Liability">
        <PolicyList
          items={[
            "We provide our services \"as is\" without warranties of any kind, other than those required by law.",
            "We are not liable for any indirect, incidental, or consequential damages.",
            "Our total liability shall not exceed the amount paid by you for the specific product or service.",
            "We exclude liability for inaccuracies or errors to the fullest extent permitted by law.",
          ]}
        />
      </PolicySection>

      <PolicySection number={11} title="Governing Law and Disputes">
        <PolicyList
          items={[
            "These terms are governed by the laws of India.",
            "Any disputes arising from your use of our services shall be subject to the jurisdiction of Indian courts.",
            "We encourage resolving disputes through direct communication before pursuing legal action.",
          ]}
        />
      </PolicySection>

      <PolicySection number={12} title="Changes to Terms">
        <PolicyList
          items={[
            "We reserve the right to modify these terms at any time.",
            "Changes will be effective immediately upon posting on our website with a new \"Last updated\" date.",
            "Continued use of our services constitutes acceptance of modified terms.",
          ]}
        />
      </PolicySection>

      <ContactBlock purpose="For questions regarding these terms, shipping, or any service-related issue, contact us:" />
    </PolicyLayout>
  );
}
