import { internalQuery, mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, { storageId }) => {
    return await ctx.storage.getUrl(storageId as Id<'_storage'>);
  },
});

export const list = query({
  args: {
    userId: v.id('users'),
    limit:  v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit }) => {
    const q = ctx.db
      .query('contacts')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .order('desc');
    return limit ? q.take(limit) : q.collect();
  },
});

export const getById = query({
  args: { contactId: v.id('contacts') },
  handler: async (ctx, args) => ctx.db.get(args.contactId),
});

export const create = mutation({
  args: {
    userId:       v.id('users'),
    firstName:    v.string(),
    lastName:     v.string(),
    designation:  v.optional(v.string()),
    company:      v.optional(v.string()),
    companyDomain:v.optional(v.string()),
    industry:     v.optional(v.string()),
    country:      v.optional(v.string()),
    email:        v.optional(v.string()),
    phone:        v.optional(v.string()),
    mobile:       v.optional(v.string()),
    website:      v.optional(v.string()),
    address:      v.optional(v.string()),
    linkedinUrl:  v.optional(v.string()),
    cardImageFront: v.optional(v.string()),
    cardImageBack:  v.optional(v.string()),
    companyLogo:  v.optional(v.string()),
    eventId:      v.optional(v.id('events')),
    metDate:      v.optional(v.number()),
    metLocation:  v.optional(v.string()),
    meetingNotes: v.optional(v.string()),
    followUpDate: v.optional(v.number()),
    tags:         v.array(v.string()),
    favorite:     v.boolean(),
    source:       v.union(
      v.literal('scan'), v.literal('manual'),
      v.literal('import'), v.literal('shared'),
    ),
    ocrConfidence:v.optional(v.number()),
    organizationId: v.optional(v.id('organizations')),
    isShared:     v.boolean(),
  },
  handler: async (ctx, args) => {
    const contactId = await ctx.db.insert('contacts', {
      ...args,
      relationshipScore: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log interaction
    await ctx.db.insert('interactions', {
      contactId,
      userId: args.userId,
      type: 'card_scanned',
      timestamp: Date.now(),
    });

    // Increment scan count
    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();
    if (sub) {
      await ctx.db.patch(sub._id, {
        scanCount: sub.scanCount + 1,
        updatedAt: Date.now(),
      });
    }

    return contactId;
  },
});

export const update = mutation({
  args: {
    contactId:   v.id('contacts'),
    firstName:   v.optional(v.string()),
    lastName:    v.optional(v.string()),
    designation: v.optional(v.string()),
    company:     v.optional(v.string()),
    email:       v.optional(v.string()),
    phone:       v.optional(v.string()),
    mobile:      v.optional(v.string()),
    website:     v.optional(v.string()),
    address:     v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    companyLogo: v.optional(v.string()),
    tags:        v.optional(v.array(v.string())),
    favorite:    v.optional(v.boolean()),
    followUpDate:v.optional(v.number()),
    meetingNotes:v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { contactId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );
    await ctx.db.patch(contactId, { ...filtered, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { contactId: v.id('contacts') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.contactId);
  },
});

export const search = query({
  args: {
    userId: v.id('users'),
    query:  v.string(),
  },
  handler: async (ctx, { userId, query }) => {
    return ctx.db
      .query('contacts')
      .withSearchIndex('search_contacts', (q) =>
        q.search('firstName', query).eq('userId', userId),
      )
      .take(20);
  },
});

export const getStats = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const contacts = await ctx.db
      .query('contacts')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    return {
      total:        contacts.length,
      today:        contacts.filter((c) => c.createdAt >= todayStart.getTime()).length,
      thisWeek:     contacts.filter((c) => c.createdAt >= weekAgo).length,
      followUpsDue: contacts.filter((c) => c.followUpDate !== undefined && c.followUpDate <= now).length,
    };
  },
});

export const toggleFavorite = mutation({
  args: { contactId: v.id('contacts') },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return;
    await ctx.db.patch(args.contactId, {
      favorite:  !contact.favorite,
      updatedAt: Date.now(),
    });
  },
});

// ─── Organization sharing ─────────────────────────────────────────────────────

export const shareWithOrg = mutation({
  args: {
    contactId:      v.id('contacts'),
    organizationId: v.id('organizations'),
  },
  handler: async (ctx, { contactId, organizationId }) => {
    await ctx.db.patch(contactId, { organizationId, isShared: true, updatedAt: Date.now() });
  },
});

export const unshareFromOrg = mutation({
  args: { contactId: v.id('contacts') },
  handler: async (ctx, { contactId }) => {
    await ctx.db.patch(contactId, { organizationId: undefined, isShared: false, updatedAt: Date.now() });
  },
});

export const listOrgShared = query({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, { organizationId }) => {
    return ctx.db
      .query('contacts')
      .withIndex('by_org', (q) => q.eq('organizationId', organizationId))
      .order('desc')
      .collect();
  },
});

export const findDuplicate = query({
  args: {
    userId: v.id('users'),
    email:  v.optional(v.string()),
    phone:  v.optional(v.string()),
  },
  handler: async (ctx, { userId, email, phone }) => {
    if (email) {
      const byEmail = await ctx.db
        .query('contacts')
        .withIndex('by_user_email', (q) => q.eq('userId', userId).eq('email', email.toLowerCase()))
        .first();
      if (byEmail) return byEmail;
    }
    if (phone) {
      const byPhone = await ctx.db
        .query('contacts')
        .withIndex('by_user_phone', (q) => q.eq('userId', userId).eq('phone', phone))
        .first();
      if (byPhone) return byPhone;
    }
    return null;
  },
});

export const detectDuplicates = query({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, { organizationId }) => {
    const contacts = await ctx.db
      .query('contacts')
      .withIndex('by_org', (q) => q.eq('organizationId', organizationId))
      .collect();

    const byEmail = new Map<string, typeof contacts>();
    contacts.forEach((c) => {
      if (!c.email) return;
      const key = c.email.toLowerCase();
      byEmail.set(key, [...(byEmail.get(key) ?? []), c]);
    });

    return Array.from(byEmail.values()).filter((g) => g.length > 1);
  },
});

// ─── Follow-ups ───────────────────────────────────────────────────────────────

export const getFollowUps = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const now = Date.now();
    const contacts = await ctx.db
      .query('contacts')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    return contacts
      .filter((c) => c.followUpDate !== undefined)
      .sort((a, b) => (a.followUpDate ?? 0) - (b.followUpDate ?? 0))
      .map((c) => ({
        ...c,
        isOverdue:  (c.followUpDate ?? 0) <= now,
        daysUntil:  Math.ceil(((c.followUpDate ?? 0) - now) / (1000 * 60 * 60 * 24)),
      }));
  },
});

export const setFollowUpDate = mutation({
  args: {
    contactId:   v.id('contacts'),
    followUpDate: v.optional(v.number()),
  },
  handler: async (ctx, { contactId, followUpDate }) => {
    await ctx.db.patch(contactId, { followUpDate, updatedAt: Date.now() });
  },
});

export const markFollowUpDone = mutation({
  args: { contactId: v.id('contacts'), userId: v.id('users') },
  handler: async (ctx, { contactId, userId }) => {
    await ctx.db.patch(contactId, { followUpDate: undefined, updatedAt: Date.now() });
    await ctx.db.insert('interactions', {
      contactId,
      userId,
      type:      'follow_up_completed',
      timestamp: Date.now(),
    });
  },
});

// Internal query used by the cron job
export const getOverdueFollowUpsInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
    const contacts = await ctx.db.query('contacts').collect();
    const due = contacts.filter((c) => c.followUpDate !== undefined && c.followUpDate <= tomorrow);
    return Promise.all(
      due.map(async (contact) => {
        const user = await ctx.db.get(contact.userId);
        return { contact, pushToken: user?.pushToken };
      }),
    );
  },
});

// ─── Relationship score ───────────────────────────────────────────────────────

const INTERACTION_WEIGHTS: Record<string, number> = {
  card_scanned:        5,
  note_added:          10,
  whatsapp_sent:       20,
  linkedin_opened:     8,
  email_sent:          15,
  meeting_added:       25,
  follow_up_completed: 30,
};

export const recalculateRelationshipScore = mutation({
  args: { contactId: v.id('contacts') },
  handler: async (ctx, { contactId }) => {
    const interactions = await ctx.db
      .query('interactions')
      .withIndex('by_contact', (q) => q.eq('contactId', contactId))
      .collect();

    const now = Date.now();
    let score  = 0;
    for (const i of interactions) {
      const weight  = INTERACTION_WEIGHTS[i.type] ?? 5;
      const daysSince = (now - i.timestamp) / (1000 * 60 * 60 * 24);
      const recency   = Math.max(0, 1 - daysSince / 365);
      score += weight * (0.5 + 0.5 * recency);
    }

    const finalScore = Math.min(100, Math.round(score));
    await ctx.db.patch(contactId, { relationshipScore: finalScore, updatedAt: now });
    return finalScore;
  },
});
