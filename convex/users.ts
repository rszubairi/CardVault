import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const getOrCreate = mutation({
  args: {
    name:         v.string(),
    email:        v.string(),
    externalId:   v.string(),
    authProvider: v.union(v.literal('google'), v.literal('linkedin')),
    profilePhoto: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('users')
      .withIndex('by_externalId', (q) => q.eq('externalId', args.externalId))
      .unique();

    if (existing) {
      return existing._id;
    }

    const userId = await ctx.db.insert('users', {
      ...args,
      createdAt: Date.now(),
    });

    // Create free subscription
    await ctx.db.insert('subscriptions', {
      userId,
      plan:      'free',
      status:    'active',
      scanCount: 0,
      scanLimit: 50,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return userId;
  },
});

export const getById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.userId);
  },
});

export const updateProfile = mutation({
  args: {
    userId:      v.id('users'),
    name:        v.optional(v.string()),
    phone:       v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    company:     v.optional(v.string()),
    designation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );
    await ctx.db.patch(userId, filtered);
  },
});
