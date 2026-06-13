import type { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ContactForm from '../../components/ContactForm';

export const metadata: Metadata = { title: 'Contact Sales' };

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-24 px-5 sm:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

            {/* Left — copy */}
            <div className="lg:sticky lg:top-28">
              <span className="inline-block text-xs font-semibold uppercase tracking-widest text-brand-400 mb-4">
                Enterprise Sales
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
                Let&apos;s talk about<br />your team.
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed mb-10">
                CardVault Enterprise gives your whole team a shared, real-time contact database with role-based access,
                duplicate detection, and dedicated support. Fill in the form and we&apos;ll reach out to schedule a call.
              </p>

              <ul className="space-y-4">
                {[
                  {
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                    ),
                    text: 'Shared CRM across your whole team',
                  },
                  {
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                      </svg>
                    ),
                    text: 'Role-based access & admin controls',
                  },
                  {
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                      </svg>
                    ),
                    text: 'Dedicated onboarding & SLA support',
                  },
                  {
                    icon: (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    ),
                    text: 'We respond within one business day',
                  },
                ].map(({ icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 text-brand-400 shrink-0">{icon}</span>
                    <span className="text-gray-300 text-sm leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — form */}
            <div className="rounded-2xl border border-white/10 bg-[#0d1117] p-8">
              <h2 className="text-white font-bold text-xl mb-6">Get in touch</h2>
              <ContactForm />
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
