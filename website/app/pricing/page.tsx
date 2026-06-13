import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata: Metadata = { title: 'Pricing' };

const FREE_FEATURES = [
  '50 card scans per month',
  'Unlimited contacts',
  'Text notes',
  'Follow-up reminders',
  'Basic search & tags',
  'VCF export',
];

const PRO_FEATURES = [
  'Unlimited card scans',
  'Everything in Free',
  'Voice notes (audio recording)',
  'AI follow-up message drafts',
  'Company enrichment (logo, description)',
  'Export CSV / XLSX / PDF',
  'Relationship score tracking',
  'Timeline of all interactions',
  'Biometric app lock',
  'Priority email support',
];

const ENT_FEATURES = [
  'Everything in Personal Pro',
  'Shared organization CRM',
  'Role-based access (Owner / Admin / Member)',
  'Invite team members by email',
  'Duplicate contact detection',
  'Shared contact tagging',
  'Admin dashboard',
  'Dedicated onboarding',
  'SLA support',
];

function Check() {
  return (
    <svg className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function X() {
  return (
    <svg className="w-4 h-4 text-gray-700 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-4">
              Simple, honest pricing
            </h1>
            <p className="text-gray-400 text-lg">
              Free to start. Upgrade when your network grows.
            </p>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {/* Free */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-8">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-3">Free</h2>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-gray-500 text-sm">/ forever</span>
              </div>
              <ul className="space-y-3 mb-8">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                    <Check /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/#download"
                className="block text-center border border-white/15 hover:border-white/30 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
              >
                Download Free
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border border-brand-600/50 bg-gradient-to-b from-brand-950/60 to-[#0d1117] p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                Most Popular
              </div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-brand-300 mb-3">Personal Pro</h2>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-white">$10</span>
                <span className="text-gray-500 text-sm">/ year</span>
              </div>
              <p className="text-xs text-gray-600 mb-6">That&apos;s just $0.83 / month</p>
              <ul className="space-y-3 mb-8">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/#download"
                className="block text-center bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
              >
                Get Personal Pro
              </Link>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-8">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-3">Enterprise</h2>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-white">$15</span>
                <span className="text-gray-500 text-sm">/ user / month</span>
              </div>
              <p className="text-xs text-gray-600 mb-6">Minimum 3 users. Annual billing.</p>
              <ul className="space-y-3 mb-8">
                {ENT_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                    <Check /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="block text-center border border-white/15 hover:border-white/30 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-10">Frequently asked questions</h2>
            <div className="space-y-6">
              {[
                {
                  q: 'What counts as a "scan"?',
                  a: 'Any time you photograph a business card and save the extracted contact to your vault. Editing an existing contact does not count.',
                },
                {
                  q: 'Can I cancel my Pro subscription?',
                  a: 'Yes. Cancel anytime from the Settings screen. Your Pro features remain active until the end of your billing period.',
                },
                {
                  q: 'Is my contact data private?',
                  a: 'Your data is stored securely in your own Convex database. We never sell or share contact information. All data in transit is encrypted.',
                },
                {
                  q: 'Do you offer refunds?',
                  a: 'We offer a full refund within 14 days of purchase if you are not satisfied.',
                },
                {
                  q: 'How does the Enterprise trial work?',
                  a: 'Enterprise accounts receive a 14-day free trial. No credit card required until the trial ends.',
                },
              ].map(({ q, a }) => (
                <div key={q} className="border-b border-white/5 pb-6">
                  <h3 className="text-white font-semibold mb-2">{q}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
