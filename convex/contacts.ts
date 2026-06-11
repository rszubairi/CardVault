import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

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
