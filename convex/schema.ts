import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // ─── Users ────────────────────────────────────────────────────────────────
  users: defineTable({
    name:              v.string(),
    email:             v.string(),
    phone:             v.optional(v.string()),
    linkedinUrl:       v.optional(v.string()),
    company:           v.optional(v.string()),
    designation:       v.optional(v.string()),
    profilePhoto:      v.optional(v.string()),
    authProvider:      v.union(v.literal('google'), v.literal('linkedin')),
    externalId:        v.string(),
    pushToken:         v.optional(v.string()),
    createdAt:         v.number(),
    // Encryption
    encryptionEnabled: v.optional(v.boolean()),
    encryptionSalt:    v.optional(v.string()), // random salt for PBKDF2 key derivation
    pinHash:           v.optional(v.string()), // SHA-256(pin + pinSalt) for verification
    pinSalt:           v.optional(v.string()), // salt for PIN hash
  })
    .index('by_email',      ['email'])
    .index('by_externalId', ['externalId']),

  // ─── Subscriptions ────────────────────────────────────────────────────────
  subscriptions: defineTable({
    userId:               v.optional(v.id('users')),
    organizationId:       v.optional(v.id('organizations')),
    plan:                 v.union(
      v.literal('free'),
      v.literal('personal_pro'),
      v.literal('enterprise'),
    ),
    status:               v.union(
      v.literal('active'),
      v.literal('cancelled'),
      v.literal('past_due'),
      v.literal('trialing'),
    ),
    stripeCustomerId:       v.optional(v.string()),
    stripeSubscriptionId:   v.optional(v.string()),
    stripePriceId:          v.optional(v.string()),
    currentPeriodEnd:       v.optional(v.number()),
    scanCount:              v.number(),
    scanLimit:              v.number(),
    createdAt:              v.number(),
    updatedAt:              v.number(),
  })
    .index('by_userId',   ['userId'])
    .index('by_orgId',    ['organizationId'])
    .index('by_stripeCustomer', ['stripeCustomerId']),

  // ─── Organizations ────────────────────────────────────────────────────────
  organizations: defineTable({
    name:           v.string(),
    logo:           v.optional(v.string()),
    billingEmail:   v.string(),
    createdAt:      v.number(),
  }),

  organizationUsers: defineTable({
    organizationId: v.id('organizations'),
    userId:         v.id('users'),
    role:           v.union(
      v.literal('owner'),
      v.literal('admin'),
      v.literal('manager'),
      v.literal('member'),
      v.literal('read_only'),
    ),
    joinedAt:       v.number(),
  })
    .index('by_org',  ['organizationId'])
    .index('by_user', ['userId'])
    .index('by_org_user', ['organizationId', 'userId']),

  // ─── Events ───────────────────────────────────────────────────────────────
  events: defineTable({
    userId:           v.id('users'),
    organizationId:   v.optional(v.id('organizations')),
    title:            v.string(),
    location:         v.optional(v.string()),
    date:             v.number(),
    endDate:          v.optional(v.number()),
    calendarSource:   v.optional(v.string()),
    calendarEventId:  v.optional(v.string()),
    createdAt:        v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_org',  ['organizationId'])
    .index('by_date', ['date']),

  // ─── Contacts ─────────────────────────────────────────────────────────────
  contacts: defineTable({
    userId:         v.id('users'),
    organizationId: v.optional(v.id('organizations')),

    // Identity
    firstName:    v.string(),
    lastName:     v.string(),
    designation:  v.optional(v.string()),
    company:      v.optional(v.string()),
    companyDomain:v.optional(v.string()),
    industry:     v.optional(v.string()),
    country:      v.optional(v.string()),

    // Contact details
    email:        v.optional(v.string()),
    phone:        v.optional(v.string()),
    mobile:       v.optional(v.string()),
    website:      v.optional(v.string()),
    address:      v.optional(v.string()),
    linkedinUrl:  v.optional(v.string()),

    // Media (Convex Storage IDs)
    cardImageFront: v.optional(v.string()),
    cardImageBack:  v.optional(v.string()),
    companyLogo:    v.optional(v.string()),
    photo:          v.optional(v.string()),

    // Event
    eventId:        v.optional(v.id('events')),
    metDate:        v.optional(v.number()),
    metLocation:    v.optional(v.string()),
    meetingNotes:   v.optional(v.string()),
    followUpDate:   v.optional(v.number()),

    // Meta
    tags:             v.array(v.string()),
    favorite:         v.boolean(),
    source:           v.union(
      v.literal('scan'),
      v.literal('manual'),
      v.literal('import'),
      v.literal('shared'),
    ),
    ocrConfidence:    v.optional(v.number()),
    relationshipScore:v.optional(v.number()),

    // Enterprise sharing
    isShared:   v.boolean(),
    sharedBy:   v.optional(v.id('users')),

    // Client-side encryption: base64(IV):base64(ciphertext) of sensitive fields JSON
    encryptedPayload: v.optional(v.string()),

    createdAt:  v.number(),
    updatedAt:  v.number(),
  })
    .index('by_user',       ['userId'])
    .index('by_org',        ['organizationId'])
    .index('by_event',      ['eventId'])
    .index('by_email',      ['email'])
    .index('by_company',    ['company'])
    .index('by_user_email', ['userId', 'email'])
    .index('by_user_phone', ['userId', 'phone'])
    .searchIndex('search_contacts', {
      searchField: 'firstName',
      filterFields: ['userId', 'organizationId', 'tags'],
    }),

  // ─── Notes ────────────────────────────────────────────────────────────────
  notes: defineTable({
    contactId:  v.id('contacts'),
    userId:     v.id('users'),
    content:    v.string(),
    type:       v.union(
      v.literal('text'),
      v.literal('voice'),
      v.literal('ai_summary'),
    ),
    audioUrl:   v.optional(v.string()),
    aiSummary:  v.optional(v.string()),
    createdAt:  v.number(),
  })
    .index('by_contact', ['contactId'])
    .index('by_user',    ['userId']),

  // ─── Interactions ─────────────────────────────────────────────────────────
  interactions: defineTable({
    contactId:  v.id('contacts'),
    userId:     v.id('users'),
    type:       v.union(
      v.literal('card_scanned'),
      v.literal('whatsapp_sent'),
      v.literal('linkedin_opened'),
      v.literal('note_added'),
      v.literal('follow_up_completed'),
      v.literal('meeting_added'),
      v.literal('email_sent'),
    ),
    metadata:   v.optional(v.any()),
    timestamp:  v.number(),
  })
    .index('by_contact',   ['contactId'])
    .index('by_user',      ['userId'])
    .index('by_timestamp', ['timestamp']),

  // ─── App Releases ─────────────────────────────────────────────────────────
  appReleases: defineTable({
    version:      v.string(),   // semver e.g. "1.2.0"
    releaseType:  v.union(v.literal('major'), v.literal('minor')),
    platform:     v.union(v.literal('ios'), v.literal('android'), v.literal('both')),
    edition:      v.union(v.literal('personal'), v.literal('enterprise'), v.literal('all')),
    releaseNotes: v.string(),
    iosUrl:       v.optional(v.string()),
    androidUrl:   v.optional(v.string()),
    isPublished:  v.boolean(),
    publishedAt:  v.optional(v.number()),
    createdAt:    v.number(),
    createdBy:    v.optional(v.string()),
  })
    .index('by_published', ['isPublished'])
    .index('by_version',   ['version']),

  // ─── Organization Permission Policies ────────────────────────────────────
  // Org-wide defaults. Per-user overrides live in organizationUserPolicies.
  organizationPolicies: defineTable({
    organizationId:     v.id('organizations'),
    // Which roles these defaults apply to (e.g. ['member', 'read_only'])
    appliesToRoles:     v.array(v.string()),
    canExportContacts:  v.boolean(),
    canDeleteContacts:  v.boolean(),
    canScanCards:       v.boolean(),
    canViewAllContacts: v.boolean(),
    canEditContacts:    v.boolean(),
    updatedAt:          v.number(),
  })
    .index('by_org', ['organizationId']),

  // Per-user overrides on top of org policy; null = inherit
  organizationUserPolicies: defineTable({
    organizationId:     v.id('organizations'),
    userId:             v.id('users'),
    canExportContacts:  v.optional(v.boolean()),
    canDeleteContacts:  v.optional(v.boolean()),
    canScanCards:       v.optional(v.boolean()),
    canViewAllContacts: v.optional(v.boolean()),
    canEditContacts:    v.optional(v.boolean()),
    updatedAt:          v.number(),
  })
    .index('by_org',      ['organizationId'])
    .index('by_org_user', ['organizationId', 'userId']),

  // ─── Audit Log ────────────────────────────────────────────────────────────
  auditLog: defineTable({
    organizationId: v.id('organizations'),
    actorUserId:    v.id('users'),
    targetUserId:   v.optional(v.id('users')),
    action:         v.union(
      v.literal('member_invited'),
      v.literal('member_removed'),
      v.literal('member_role_changed'),
      v.literal('policy_updated'),
      v.literal('contact_exported'),
      v.literal('contact_deleted'),
      v.literal('contact_scanned'),
      v.literal('contact_edited'),
    ),
    metadata:       v.optional(v.any()),
    timestamp:      v.number(),
  })
    .index('by_org',    ['organizationId'])
    .index('by_org_ts', ['organizationId', 'timestamp'])
    .index('by_actor',  ['actorUserId']),

  // ─── Company Cache ────────────────────────────────────────────────────────
  companyCache: defineTable({
    domain:       v.string(),
    name:         v.string(),
    logo:         v.optional(v.string()),
    industry:     v.optional(v.string()),
    description:  v.optional(v.string()),
    employeeCount:v.optional(v.string()),
    headquarters: v.optional(v.string()),
    country:      v.optional(v.string()),
    fetchedAt:    v.number(),
  })
    .index('by_domain', ['domain']),
});
