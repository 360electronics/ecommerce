import Link from "next/link";
import Header from "@/components/Navigations/Header";
import { BUSINESS, POLICY_LAST_UPDATED } from "@/lib/policies/policy-facts";

export function PolicyLayout({
  title,
  intro,
  footerNote,
  children,
}: {
  title: string;
  intro?: React.ReactNode;
  footerNote: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-12 pb-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-8">
              <h1 className="mb-4 text-3xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-600">Last updated: {POLICY_LAST_UPDATED}</p>
              {intro && <div className="mt-4 leading-relaxed text-gray-700">{intro}</div>}
            </div>

            <div className="space-y-8 px-6 py-8">{children}</div>

            <div className="border-t border-gray-200 px-6 py-6">
              <p className="text-center text-sm text-gray-500">{footerNote}</p>
              <p className="mt-2 text-center text-xs text-gray-400">
                Related:{" "}
                <Link href="/terms-and-conditions" className="hover:underline">Terms & Conditions</Link>
                {" · "}
                <Link href="/cancellation-policy" className="hover:underline">Cancellation Policy</Link>
                {" · "}
                <Link href="/refund-policy" className="hover:underline">Return & Refund Policy</Link>
                {" · "}
                <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function PolicySection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        {number}. {title}
      </h2>
      <div className="space-y-3 leading-relaxed text-gray-700">{children}</div>
    </section>
  );
}

export function PolicyList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-6">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function ContactBlock({ purpose }: { purpose: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-5 text-gray-700">
      <p className="mb-3">{purpose}</p>
      <p><strong>Business name:</strong> {BUSINESS.name} (a.k.a. {BUSINESS.aka})</p>
      <p><strong>Proprietor:</strong> {BUSINESS.proprietor}</p>
      <p><strong>Address:</strong> {BUSINESS.address}</p>
      <p><strong>Phone:</strong> {BUSINESS.phone}</p>
      <p><strong>Email:</strong> {BUSINESS.email}</p>
      <p><strong>Business hours:</strong> {BUSINESS.hours}</p>
    </div>
  );
}
