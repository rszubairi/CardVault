'use client';

import { useState, ChangeEvent, FormEvent } from 'react';

const COUNTRIES = [
  'Australia', 'Bangladesh', 'Brazil', 'Canada', 'China', 'Denmark',
  'Egypt', 'Finland', 'France', 'Germany', 'Ghana', 'Hong Kong',
  'India', 'Indonesia', 'Ireland', 'Israel', 'Italy', 'Japan',
  'Kenya', 'Malaysia', 'Mexico', 'Netherlands', 'New Zealand',
  'Nigeria', 'Norway', 'Pakistan', 'Philippines', 'Poland', 'Portugal',
  'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea', 'Spain',
  'Sweden', 'Switzerland', 'Taiwan', 'Thailand', 'Turkey', 'UAE',
  'United Kingdom', 'United States', 'Vietnam', 'Other',
];

const TIME_SLOTS = [
  '9:00 AM – 12:00 PM',
  '12:00 PM – 3:00 PM',
  '3:00 PM – 6:00 PM',
  'Flexible (any time works)',
];

interface FormState {
  name: string;
  email: string;
  company: string;
  country: string;
  designation: string;
  timeSlot: string;
}

const EMPTY: FormState = {
  name: '', email: '', company: '', country: '', designation: '', timeSlot: '',
};

const inputClass =
  'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-600/60 focus:bg-white/8 transition-colors';

const labelClass = 'block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-5">
        <div className="w-16 h-16 rounded-full bg-brand-900/60 border border-brand-700/40 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">You&apos;re on our radar</h2>
        <p className="text-gray-400 max-w-sm leading-relaxed">
          Thanks, <span className="text-white">{form.name}</span>. We&apos;ll reach out to{' '}
          <span className="text-white">{form.email}</span> within one business day to schedule a call.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Full name">
          <input
            required
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Jane Smith"
            className={inputClass}
          />
        </Field>
        <Field label="Designation / Title">
          <input
            required
            name="designation"
            value={form.designation}
            onChange={handleChange}
            placeholder="Head of Operations"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Business email">
        <input
          required
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="jane@company.com"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Company">
          <input
            required
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="Acme Corp"
            className={inputClass}
          />
        </Field>
        <Field label="Country">
          <select
            required
            name="country"
            value={form.country}
            onChange={handleChange}
            className={inputClass + ' appearance-none cursor-pointer'}
          >
            <option value="" disabled className="bg-[#0d1117]">Select country…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c} className="bg-[#0d1117]">{c}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Preferred time slot (your local time)">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TIME_SLOTS.map((slot) => (
            <label
              key={slot}
              className={`relative flex flex-col items-center text-center cursor-pointer rounded-xl border px-3 py-3.5 text-xs font-medium transition-colors select-none ${
                form.timeSlot === slot
                  ? 'border-brand-600/70 bg-brand-900/40 text-brand-300'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-200'
              }`}
            >
              <input
                type="radio"
                name="timeSlot"
                value={slot}
                checked={form.timeSlot === slot}
                onChange={handleChange}
                className="sr-only"
                required
              />
              {slot}
            </label>
          ))}
        </div>
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Sending…
          </>
        ) : (
          'Send Request'
        )}
      </button>

      <p className="text-center text-xs text-gray-600">
        We respond within one business day. No spam, ever.
      </p>
    </form>
  );
}
