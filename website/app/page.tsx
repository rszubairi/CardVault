import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HowItWorksSection from '../components/HowItWorksSection';

export const metadata: Metadata = {
  title: 'CardVault — AI Business Card CRM',
};

// ─── Feature icons ────────────────────────────────────────────────────────────

const IconCamera = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const IconTag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const IconMic = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/>
  </svg>
);

const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/>
  </svg>
);

// ─── Feature data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: IconCamera,
    title: 'Instant AI Scanning',
    desc:  'Point your camera at any card. Our ML engine extracts every field — name, company, email, phone, website — in under a second.',
  },
  {
    Icon: IconTag,
    title: 'Smart Organization',
    desc:  'Auto-tag contacts by company, event, or topic. Full-text search across thousands of contacts in milliseconds.',
  },
  {
    Icon: IconMic,
    title: 'Voice Notes',
    desc:  'Record what matters right after a conversation. Voice and text notes are linked to each contact and searchable.',
  },
  {
    Icon: IconCalendar,
    title: 'Follow-up Reminders',
    desc:  'Set follow-up dates and get notified automatically. CardVault tracks every interaction so you never miss a touchpoint.',
  },
  {
    Icon: IconUsers,
    title: 'Team Sharing',
    desc:  'Enterprise teams share a live contact database. Role-based access, duplicate detection, and real-time sync.',
  },
  {
    Icon: IconLock,
    title: 'Biometric Lock',
    desc:  'Face ID and fingerprint protection keep your contacts private. Auto-locks when the app goes to background.',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-5 pt-24 pb-20 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-950/80 border border-brand-800/60 rounded-full px-4 py-1.5 text-xs font-medium text-brand-300 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Now in beta — free to download
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[1.05] tracking-tight text-white mb-6">
            Scan.{' '}
            <span className="text-gradient">Save.</span>
            <br />
            Connect.
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto mb-10">
            CardVault turns every business card into a lasting relationship.
            AI-powered scanning, smart follow-ups, and a CRM that fits in your pocket.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4" id="download">
            <a
              href="#"
              className="flex items-center gap-3 bg-white text-gray-900 font-semibold px-7 py-3.5 rounded-xl hover:bg-gray-100 transition-colors w-full sm:w-auto justify-center"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              App Store
            </a>
            <a
              href="#"
              className="flex items-center gap-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors w-full sm:w-auto justify-center"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14 8.5c.6.37.6 1.23 0 1.6l-14 8.5c-.66.5-1.6.03-1.6-.8z"/>
              </svg>
              Google Play
            </a>
          </div>
        </div>

        {/* App mockup placeholder */}
        <div className="relative mt-20 max-w-5xl mx-auto w-full">
          <div className="flex justify-center gap-4 sm:gap-8 items-start">
            {/* Center phone */}
            <div className="w-48 sm:w-56 aspect-[9/19] rounded-[2.5rem] bg-[#0d1117] border border-white/10 shadow-2xl glow-lg overflow-hidden flex flex-col p-3 z-10 relative">
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-3" />
              <div className="flex-1 rounded-2xl bg-gradient-to-b from-[#1e1b4b]/50 to-[#0d1117] flex flex-col p-3 gap-2">
                <div className="h-28 rounded-xl bg-brand-900/40 border border-brand-800/30 flex items-center justify-center">
                  <span className="text-3xl">📷</span>
                </div>
                {['John Smith', 'Sarah Lee', 'Mike Chen'].map((name) => (
                  <div key={name} className="h-10 rounded-lg bg-white/5 flex items-center gap-2 px-2">
                    <div className="w-6 h-6 rounded-full bg-brand-700 flex items-center justify-center text-[10px] text-white font-bold">
                      {name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-white/20 rounded w-20 mb-1" />
                      <div className="h-1.5 bg-white/10 rounded w-14" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-12 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          <p className="text-center text-xs uppercase tracking-widest text-gray-600 mb-8">
            Trusted by networkers at leading companies
          </p>
          <div className="flex flex-wrap justify-center gap-10 items-center opacity-40">
            {['Acme Corp', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Pied Piper'].map((co) => (
              <span key={co} className="text-sm font-semibold text-gray-400 tracking-wide">
                {co}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to manage your network
            </h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              CardVault combines an AI-powered card scanner with a full CRM — so you spend less time typing and more time building relationships.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="border-gradient rounded-2xl p-6 bg-[#0d1117] hover:bg-[#111827] transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-900/50 border border-brand-800/30 flex items-center justify-center text-brand-400 mb-4 group-hover:bg-brand-900/70 transition-colors">
                  <f.Icon />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-brand-300 transition-colors">
                  {f.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <HowItWorksSection />

      {/* ── Pricing preview ── */}
      <section className="py-24 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-400 text-lg mb-14">
            Start free. Upgrade when you&apos;re ready.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-7 text-left">
              <h3 className="text-white font-bold text-lg mb-1">Free</h3>
              <div className="text-3xl font-black text-white mb-4">$0</div>
              <ul className="space-y-2 text-sm text-gray-400 mb-8">
                {['50 scans / month', 'Contact notes', 'Basic search', 'Follow-up reminders'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-brand-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="#download"
                className="block text-center border border-white/15 hover:border-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Download Free
              </Link>
            </div>

            {/* Pro — highlighted */}
            <div className="rounded-2xl border border-brand-600/50 bg-gradient-to-b from-brand-950/60 to-[#0d1117] p-7 text-left relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </div>
              <h3 className="text-white font-bold text-lg mb-1">Personal Pro</h3>
              <div className="text-3xl font-black text-white mb-1">$10</div>
              <div className="text-xs text-gray-500 mb-4">per year · billed annually</div>
              <ul className="space-y-2 text-sm text-gray-300 mb-8">
                {['Unlimited scans', 'Voice notes', 'AI follow-up drafts', 'Company enrichment', 'Export VCF/CSV/PDF'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-brand-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="block text-center bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Get Pro
              </Link>
            </div>

            {/* Enterprise */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-7 text-left">
              <h3 className="text-white font-bold text-lg mb-1">Enterprise</h3>
              <div className="text-3xl font-black text-white mb-1">$15</div>
              <div className="text-xs text-gray-500 mb-4">per user / month</div>
              <ul className="space-y-2 text-sm text-gray-400 mb-8">
                {['Everything in Pro', 'Shared contact database', 'Role-based access', 'Duplicate detection', 'Priority support'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-brand-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/contact"
                className="block text-center border border-white/15 hover:border-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-5 sm:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-brand-600/15 to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
            Start building better<br />relationships today.
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            Download CardVault free. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="#download"
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-center glow-sm"
            >
              Download for iOS
            </a>
            <a
              href="#download"
              className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-center"
            >
              Download for Android
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
