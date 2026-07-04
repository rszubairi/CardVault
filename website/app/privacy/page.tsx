import type { Metadata } from 'next';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | CardVault',
  description: 'How CardVault collects, uses, and protects your personal data.',
};

const UPDATED = 'July 4, 2026';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    items: [
      { label: 'Account data', body: 'Your name, email address, and profile photo provided when you sign in with Google or LinkedIn.' },
      { label: 'Contact data', body: 'Business card images you scan, and the contact details extracted from them — name, company, title, email, phone, address, and LinkedIn URL.' },
      { label: 'Usage data', body: 'Which features you use, scan counts, follow-up activity, and interaction history. Used to improve the product and are not sold.' },
      { label: 'Device data', body: 'Push notification token, device platform (iOS/Android), and app version.' },
      { label: 'Camera, microphone, and calendar access', body: 'Used only when you actively use the scan, voice note, or event-linking features. We do not record or store audio or video streams.' },
      { label: 'Device contacts', body: 'If you enable "Sync to Phone", scanned cards are written to your local contacts app. This data stays on your device and is not transmitted to our servers.' },
      { label: 'Biometric data', body: 'We do not collect biometric data. Face ID and fingerprint authentication are handled entirely by your device OS and never transmitted to us.' },
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use collected data to operate the CardVault service — storing, retrieving, and syncing your contacts; sending push notifications you configure (follow-up reminders, org access changes); processing payments via Stripe; and improving OCR and AI extraction accuracy using anonymised scan data. We do not sell your personal information or contact data to any third party.',
  },
  {
    title: '3. Data Storage & Security',
    items: [
      { label: 'Cloud storage', body: 'Your data is stored in Convex, a cloud database with encryption at rest (AES-256) and in transit (TLS 1.3).' },
      { label: 'Optional PIN encryption', body: 'If you enable the PIN lock, sensitive contact fields are encrypted client-side on your device before upload. The encryption key is derived from your PIN and never leaves your device.' },
      { label: 'Payments', body: 'Payment details are handled exclusively by Stripe and are never stored on CardVault servers.' },
    ],
  },
  {
    title: '4. Sharing of Information',
    body: 'We share data only with the following service providers, strictly to operate the product: Convex (cloud database), Stripe (payment processing), Expo and Firebase (push notifications), and Google (sign-in and OCR services). We may disclose data to law enforcement when legally required. We do not share data with advertisers or data brokers.',
  },
  {
    title: '5. Enterprise Plans',
    body: 'Within Enterprise organizations, contacts you explicitly mark as "shared" are visible to other members of your organization. Organization admins can view team activity logs and restrict member permissions (export, delete, edit contacts). If an admin removes you from an organization, your access is revoked and shared org contacts are automatically deleted from your device. Admins cannot access your private (non-shared) contacts.',
  },
  {
    title: '6. Data Retention',
    body: 'We retain your data for as long as your account is active. If you delete your account, all associated contact data is permanently deleted within 30 days, except where retention is required by applicable law. You can export your contacts at any time from the Export screen before deleting your account.',
  },
  {
    title: '7. Your Rights',
    items: [
      { label: 'Access & export', body: 'You can export your contacts as a CSV or vCard directly from the app at any time.' },
      { label: 'Correction', body: 'You can edit any contact detail directly in the app.' },
      { label: 'Deletion', body: 'To delete your account and all associated data, email privacy@cardvault.app. We respond within 30 days.' },
      { label: 'EEA / UK residents', body: 'You may lodge a complaint with your local data protection authority if you believe we have not handled your data lawfully.' },
    ],
  },
  {
    title: '8. Children',
    body: 'CardVault is not directed at children under 13. We do not knowingly collect personal information from children. If we discover we have inadvertently collected data from a child, we will delete it promptly.',
  },
  {
    title: '9. Changes to This Policy',
    body: 'We may update this policy periodically. We will notify you of material changes via an in-app notice or email at least 14 days before they take effect. Continued use of the app after that date constitutes acceptance of the updated policy.',
  },
  {
    title: '10. Contact',
    body: 'Questions or privacy requests? Email us at privacy@cardvault.app and we\'ll respond within 30 days.',
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-24 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto">

          {/* Hero */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-indigo-950/60 border border-indigo-800/40 rounded-full px-3 py-1 text-xs text-indigo-300 mb-5">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
              Your data, your control
            </div>
            <h1 className="text-4xl font-black text-white mb-3">Privacy Policy</h1>
            <p className="text-gray-500 text-sm">Last updated: {UPDATED}</p>
          </div>

          {/* Intro callout */}
          <div className="bg-indigo-950/40 border border-indigo-800/30 rounded-xl p-5 mb-12 text-indigo-200 text-sm leading-relaxed">
            CardVault is built around the principle that your contact data is yours. We collect only what is necessary to run the service, never sell it, and give you full control to export or delete it at any time.
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {SECTIONS.map(({ title, body, items }) => (
              <section key={title}>
                <h2 className="text-white font-bold text-lg mb-4 pb-2 border-b border-white/5">{title}</h2>
                {body && (
                  <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
                )}
                {items && (
                  <ul className="space-y-3">
                    {items.map(({ label, body: itemBody }) => (
                      <li key={label} className="text-sm text-gray-400 leading-relaxed">
                        <span className="text-gray-200 font-medium">{label}: </span>
                        {itemBody}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mt-14 p-6 bg-white/[0.03] border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-semibold mb-1">Privacy questions?</p>
              <p className="text-gray-400 text-sm">We respond to all privacy requests within 30 days.</p>
            </div>
            <a
              href="mailto:privacy@cardvault.app"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white text-sm font-semibold px-4 py-2.5 rounded-lg whitespace-nowrap"
            >
              <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              privacy@cardvault.app
            </a>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
