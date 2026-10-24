import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - BillFlow',
  description: 'Privacy policy for the BillFlow SaaS billing and business management platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-3xl px-6 py-12 sm:py-16">
        <Link href="/" className="text-sm font-semibold text-brand-300 hover:text-brand-200">
          BillFlow
        </Link>

        <div className="mt-8 space-y-6">
          <div>
            <p className="text-sm text-slate-400">Effective date: July 27, 2026</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Privacy Policy</h1>
          </div>

          <p className="text-sm leading-7 text-slate-300">
            BillFlow helps businesses manage invoices, customers, inventory, payments, expenses and
            reports. This policy explains the data collected by the platform and how it is used to
            provide the service.
          </p>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Information We Collect</h2>
            <p className="text-sm leading-7 text-slate-300">
              We collect account details, business profile information, customer records, product
              catalog data, invoices, payment records, inventory movements, expenses and subscription
              payment metadata required to operate the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">How We Use Information</h2>
            <p className="text-sm leading-7 text-slate-300">
              Data is used to authenticate users, isolate each business tenant, generate invoices,
              calculate reports, manage subscriptions, provide support and improve platform security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Data Sharing</h2>
            <p className="text-sm leading-7 text-slate-300">
              Business data is not sold. Payment processing data may be shared with Razorpay or other
              payment providers configured by the platform. Data may be disclosed when required by law
              or to protect the service from fraud and abuse.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Security</h2>
            <p className="text-sm leading-7 text-slate-300">
              The platform uses password hashing, token-based authentication, tenant-scoped data
              access and server-side validation. Production deployments must use HTTPS and strong
              environment secrets.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Contact</h2>
            <p className="text-sm leading-7 text-slate-300">
              For privacy questions, contact the BillFlow platform owner at the support email
              published on the deployed application or Google Play listing.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
