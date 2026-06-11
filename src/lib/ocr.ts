import TextRecognition from '@react-native-ml-kit/text-recognition';
import { OcrResult } from '../types';

// ─── Regex patterns ──────────────────────────────────────────────────────────

const EMAIL_RE    = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const PHONE_RE    = /(?:\+?[\d\s\-().]{7,20})/;
const URL_RE      = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9\-]+\.[a-zA-Z]{2,})(?:\/[^\s]*)*/i;
const LINKEDIN_RE = /linkedin\.com\/in\/([a-zA-Z0-9\-_%.]+)/i;

const JOB_KEYWORDS = [
  'ceo', 'cto', 'coo', 'cfo', 'vp', 'vice president', 'director', 'manager',
  'engineer', 'developer', 'designer', 'consultant', 'analyst', 'founder',
  'partner', 'associate', 'specialist', 'head of', 'lead', 'principal',
  'president', 'executive', 'officer', 'representative', 'coordinator',
  'doctor', 'dr.', 'professor', 'prof.',
];

// ─── Main extraction ──────────────────────────────────────────────────────────

export async function extractFromImage(imageUri: string): Promise<OcrResult> {
  const result = await TextRecognition.recognize(imageUri);
  const rawText = result.text ?? '';

  if (!rawText.trim()) {
    return { rawText: '', confidence: 0 };
  }

  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const email      = extractEmail(rawText);
  const phone      = extractPhone(rawText, email);
  const website    = extractWebsite(rawText);
  const linkedinUrl= extractLinkedIn(rawText);
  const name       = inferName(lines, email, phone, website);
  const designation= inferDesignation(lines, name);
  const company    = inferCompany(lines, name, designation, email, website);
  const domain     = company && website ? inferDomain(website) : undefined;
  const country    = inferCountry(rawText);
  const confidence = calcConfidence({ name, email, phone, website });

  return {
    rawText,
    firstName:     name?.first,
    lastName:      name?.last,
    designation,
    company,
    email,
    phone:         phone?.main,
    mobile:        phone?.mobile,
    website,
    linkedinUrl,
    companyDomain: domain,
    country,
    confidence,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractEmail(text: string) {
  return EMAIL_RE.exec(text)?.[0];
}

function extractPhone(text: string, email?: string) {
  const cleaned = email ? text.replace(email, '') : text;
  const matches = cleaned.match(new RegExp(PHONE_RE.source, 'g')) ?? [];
  const phones  = matches
    .map((m) => m.replace(/[^\d+\-() ]/g, '').trim())
    .filter((m) => m.replace(/\D/g, '').length >= 7);

  if (phones.length === 0) return undefined;

  const mobile = phones.find((p) => {
    const digits = p.replace(/\D/g, '');
    return digits.startsWith('60') || digits.startsWith('01') ||
           digits.startsWith('+6') || digits.length === 10 || digits.length === 11;
  });

  return { main: phones[0], mobile: mobile !== phones[0] ? mobile : undefined };
}

function extractWebsite(text: string) {
  const match = URL_RE.exec(text);
  if (!match) return undefined;
  const url = match[0];
  return url.startsWith('http') ? url : `https://${url}`;
}

function extractLinkedIn(text: string) {
  const m = LINKEDIN_RE.exec(text);
  return m ? `https://www.linkedin.com/in/${m[1]}` : undefined;
}

function inferName(lines: string[], email?: string, phone?: { main?: string }, website?: string) {
  const skip = new Set([email, phone?.main, website].filter(Boolean));
  for (const line of lines.slice(0, 6)) {
    if (skip.has(line)) continue;
    if (EMAIL_RE.test(line) || PHONE_RE.test(line) || URL_RE.test(line)) continue;
    if (/\d{3,}/.test(line)) continue;
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 5) continue;
    const allCapOrTitle = words.every((w) => /^[A-Z]/.test(w) || /^[A-Z]+$/.test(w));
    if (allCapOrTitle) {
      return { first: words[0], last: words.slice(1).join(' ') };
    }
  }
  return undefined;
}

function inferDesignation(lines: string[], name?: { first: string; last: string }) {
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (name && line.toLowerCase().includes(name.first.toLowerCase())) continue;
    if (JOB_KEYWORDS.some((kw) => lower.includes(kw))) {
      return line;
    }
  }
  return undefined;
}

function inferCompany(
  lines: string[],
  name?: { first: string; last: string },
  designation?: string,
  email?: string,
  website?: string,
) {
  const skipWords = [name?.first, name?.last, designation, email, website]
    .filter(Boolean)
    .map((s) => s!.toLowerCase());

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (EMAIL_RE.test(line) || PHONE_RE.test(line) || URL_RE.test(line)) continue;
    if (skipWords.some((w) => lower.includes(w))) continue;
    if (/^[A-Z]/.test(line) && line.length > 3 && line.length < 60) {
      return line;
    }
  }

  if (email) {
    const domain = email.split('@')[1];
    if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
      return domain.split('.')[0];
    }
  }
  return undefined;
}

function inferDomain(website: string) {
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function inferCountry(text: string) {
  const countries: Record<string, string> = {
    'malaysia': 'Malaysia', 'singapore': 'Singapore', 'indonesia': 'Indonesia',
    'thailand': 'Thailand', 'philippines': 'Philippines', 'vietnam': 'Vietnam',
    'japan': 'Japan', 'korea': 'South Korea', 'china': 'China', 'india': 'India',
    'united states': 'United States', 'usa': 'United States',
    'united kingdom': 'United Kingdom', 'uk': 'United Kingdom',
    'australia': 'Australia', 'germany': 'Germany', 'france': 'France',
  };
  const lower = text.toLowerCase();
  for (const [key, value] of Object.entries(countries)) {
    if (lower.includes(key)) return value;
  }
  return undefined;
}

function calcConfidence(fields: {
  name?: { first: string; last: string };
  email?: string;
  phone?: { main?: string };
  website?: string;
}) {
  let score = 0;
  if (fields.name) score += 35;
  if (fields.email) score += 30;
  if (fields.phone) score += 20;
  if (fields.website) score += 15;
  return Math.min(score, 100);
}
