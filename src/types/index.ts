import { Id } from '../../convex/_generated/dataModel';

// ─── Auth ────────────────────────────────────────────────────────────────────

export type AuthProvider = 'google' | 'linkedin';

export interface UserProfile {
  _id: Id<'users'>;
  name: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  company?: string;
  designation?: string;
  profilePhoto?: string;
  createdAt?: number;
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export type ContactSource = 'scan' | 'manual' | 'import' | 'shared';

export interface Contact {
  _id: Id<'contacts'>;
  userId: Id<'users'>;
  organizationId?: Id<'organizations'>;

  // Identity
  firstName: string;
  lastName: string;
  designation?: string;
  company?: string;
  companyDomain?: string;
  industry?: string;
  country?: string;

  // Contact details
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  linkedinUrl?: string;

  // Media
  cardImageFront?: string;
  cardImageBack?: string;
  companyLogo?: string;
  photo?: string;

  // Event
  eventId?: Id<'events'>;
  metDate?: number;
  metLocation?: string;
  meetingNotes?: string;
  followUpDate?: number;

  // Meta
  tags: string[];
  favorite: boolean;
  source: ContactSource;
  ocrConfidence?: number;
  relationshipScore?: number;

  // Sharing (enterprise)
  isShared: boolean;
  sharedBy?: Id<'users'>;

  createdAt: number;
  updatedAt: number;
}

export type ContactDraft = Omit<Contact, '_id' | 'userId' | 'createdAt' | 'updatedAt'>;

// ─── Event ───────────────────────────────────────────────────────────────────

export interface Event {
  _id: Id<'events'>;
  userId: Id<'users'>;
  organizationId?: Id<'organizations'>;
  title: string;
  location?: string;
  date: number;
  endDate?: number;
  calendarSource?: string;
  calendarEventId?: string;
  createdAt: number;
}

// ─── Note ────────────────────────────────────────────────────────────────────

export type NoteType = 'text' | 'voice' | 'ai_summary';

export interface Note {
  _id: Id<'notes'>;
  contactId: Id<'contacts'>;
  userId: Id<'users'>;
  content: string;
  type: NoteType;
  audioUrl?: string;
  aiSummary?: string;
  createdAt: number;
}

// ─── Interaction ─────────────────────────────────────────────────────────────

export type InteractionType =
  | 'card_scanned'
  | 'whatsapp_sent'
  | 'linkedin_opened'
  | 'note_added'
  | 'follow_up_completed'
  | 'meeting_added'
  | 'email_sent';

export interface Interaction {
  _id: Id<'interactions'>;
  contactId: Id<'contacts'>;
  userId: Id<'users'>;
  type: InteractionType;
  metadata?: Record<string, string | number | boolean>;
  timestamp: number;
}

// ─── Organization ─────────────────────────────────────────────────────────────

export type OrgRole = 'owner' | 'admin' | 'manager' | 'member' | 'read_only';

export interface Organization {
  _id: Id<'organizations'>;
  name: string;
  logo?: string;
  billingEmail: string;
  subscriptionStatus: SubscriptionStatus;
  activeUserCount: number;
  createdAt: number;
}

export interface OrganizationMember {
  _id: Id<'organizationUsers'>;
  organizationId: Id<'organizations'>;
  userId: Id<'users'>;
  role: OrgRole;
  joinedAt: number;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export type SubscriptionPlan = 'free' | 'personal_pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';

export interface Subscription {
  _id: Id<'subscriptions'>;
  userId?: Id<'users'>;
  organizationId?: Id<'organizations'>;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: number;
  scanCount: number;
  scanLimit: number;
  createdAt: number;
}

// ─── OCR ─────────────────────────────────────────────────────────────────────

export interface OcrResult {
  rawText: string;
  firstName?: string;
  lastName?: string;
  designation?: string;
  company?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  linkedinUrl?: string;
  companyDomain?: string;
  country?: string;
  confidence: number;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootTabParamList = {
  index: undefined;
  scan: undefined;
  contacts: undefined;
  settings: undefined;
};
