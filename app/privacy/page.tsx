import Link from "next/link";
import { BUSINESS } from "@/lib/policies/policy-facts";
import {
  ContactBlock,
  PolicyLayout,
  PolicyList,
  PolicySection,
} from "@/components/Policies/PolicyLayout";

export const metadata = {
  title: "Privacy Policy | 360 Electronics",
  description: "What personal information 360 Electronics collects, how it is used and shared, and your rights.",
};

export default function PrivacyPolicy() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      intro={
        <p>
          At {BUSINESS.name} ({BUSINESS.aka}) we are committed to protecting your privacy. This policy explains what
          information we collect when you use 360electronics.in, how we use and share it, and the choices you have.
          By using our services, you consent to the practices described here.
        </p>
      }
      footerNote="By using our services, you acknowledge that you have read and understood this Privacy Policy."
    >
      <PolicySection number={1} title="Information We Collect">
        <p><strong>Information you give us</strong></p>
        <PolicyList
          items={[
            "Account details: name, mobile number and/or email address.",
            "Delivery addresses, including the recipient's name and phone number, and GST number if you provide one.",
            "Orders: products purchased, amounts, delivery choice, coupons used, and cancellation / return requests.",
            "Product reviews (including any photos you upload) and support tickets you raise.",
            "EMI enquiries: name, phone number and the product you are interested in.",
          ]}
        />
        <p><strong>Information collected automatically</strong></p>
        <PolicyList
          items={[
            "Technical data such as IP address, browser and device type, recorded in our hosting provider's server logs for security and troubleshooting.",
            "Your cart, wishlist and referral activity while you are signed in.",
            "Approximate location — only if you allow your browser to share it, to show delivery options for your area. You can also enter a PIN code instead.",
          ]}
        />
        <p><strong>What we do not collect</strong></p>
        <PolicyList
          items={[
            "Card, UPI or bank login details — payments are entered on and processed by Razorpay, our payment partner. We only receive the payment status and reference IDs.",
            "Passwords — you sign in with a one-time password (OTP).",
          ]}
        />
      </PolicySection>

      <PolicySection number={2} title="How We Use Your Information">
        <PolicyList
          items={[
            <><strong>Orders:</strong> to process, deliver and support your orders, including cancellations, returns and refunds.</>,
            <><strong>Account:</strong> to sign you in (via OTP) and keep your addresses, orders and wishlist.</>,
            <><strong>Communication:</strong> to send OTPs, order confirmations and order status updates, and to reply to your support tickets and EMI enquiries.</>,
            <><strong>Payments and fraud prevention:</strong> to confirm payments and protect against fraudulent orders.</>,
            <><strong>Improving our service</strong> and <strong>legal compliance</strong>, including tax and accounting records.</>,
          ]}
        />
      </PolicySection>

      <PolicySection number={3} title="Who We Share It With">
        <p>We share only what each service provider needs to do its job:</p>
        <PolicyList
          items={[
            <><strong>Razorpay</strong> — payment processing and refunds.</>,
            <><strong>MSG91</strong> — sending OTPs by SMS (your mobile number and the OTP).</>,
            <><strong>Google (Gmail)</strong> — sending OTP and order emails (your email address and the message).</>,
            <><strong>Courier and logistics partners</strong> — delivering your order (name, delivery address, phone number).</>,
            <><strong>Vercel, Neon and Cloudflare</strong> — hosting our website, storing our database and storing product / review images.</>,
            <><strong>OpenStreetMap (Nominatim) and India Post PIN code service</strong> — if you use location or PIN code lookup, your coordinates or PIN code are sent from your browser to find your area.</>,
            <><strong>Google Maps</strong> — only if you open directions to one of our stores.</>,
            <><strong>Legal requirements</strong> — when required by law, court order, or to protect our rights and safety, and in connection with a merger or sale of the business.</>,
          ]}
        />
        <p>We do not sell, trade or rent your personal information, and we do not use advertising or third-party analytics trackers.</p>
      </PolicySection>

      <PolicySection number={4} title="Cookies and Browser Storage">
        <PolicyList
          items={[
            <>We use one essential cookie to keep you signed in. It expires after 12 hours or when you sign out.</>,
            <>Your browser&apos;s local storage keeps your selected location, recent searches and sign-in state so the site works smoothly. This stays on your device.</>,
            <>We do not use advertising, tracking pixels or analytics cookies. You can clear cookies and site data in your browser at any time (you will be signed out).</>,
          ]}
        />
      </PolicySection>

      <PolicySection number={5} title="Where Your Data Is Stored">
        <p>
          Our website and database are hosted in Singapore by our hosting providers, and our service providers may
          process data in other countries. We use providers with appropriate security safeguards.
        </p>
      </PolicySection>

      <PolicySection number={6} title="Data Security">
        <PolicyList
          items={[
            "All traffic to our website is encrypted (HTTPS).",
            "Sign-in uses one-time passwords with attempt limits; payments are handled by Razorpay, so we never see your card or UPI details.",
            "Access to customer data is restricted to authorised staff.",
            "No method of transmission over the internet is 100% secure, and we cannot guarantee absolute security. Never share your OTP with anyone — we will never ask for it.",
          ]}
        />
      </PolicySection>

      <PolicySection number={7} title="Data Retention">
        <PolicyList
          items={[
            "We keep your account information while your account is active and for a reasonable period afterwards.",
            "Order and payment records are kept for as long as required for accounting, tax and legal purposes.",
            "You may request deletion of your personal information, subject to these legal requirements.",
          ]}
        />
      </PolicySection>

      <PolicySection number={8} title="Your Rights">
        <p>Under applicable Indian law, including the Digital Personal Data Protection Act, 2023, you can:</p>
        <PolicyList
          items={[
            "Access a summary of the personal information we hold about you.",
            "Correct or update inaccurate information (you can edit your profile and addresses in My Account).",
            "Request erasure of your information, subject to legal retention requirements.",
            "Withdraw consent, which may stop us from providing some services.",
            "Raise a grievance with us using the contact details below.",
          ]}
        />
      </PolicySection>

      <PolicySection number={9} title="Messages We Send">
        <p>
          We currently send only service messages — OTPs, order confirmations and order status updates — which are
          needed to provide our service. If we send promotional messages in future, each will include a way to opt
          out.
        </p>
      </PolicySection>

      <PolicySection number={10} title="Children's Privacy">
        <p>
          Our services are not intended for children under 18. We do not knowingly collect personal information from
          children under 18; if we learn that we have, we will delete it. Parents or guardians who believe their child
          has provided personal information should contact us.
        </p>
      </PolicySection>

      <PolicySection number={11} title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this page with a new
          &quot;Last updated&quot; date. Please also see our{" "}
          <Link href="/terms-and-conditions" className="text-primary hover:underline">Terms and Conditions</Link>.
        </p>
      </PolicySection>

      <ContactBlock purpose="For privacy questions, data requests or grievances, contact us:" />
    </PolicyLayout>
  );
}
