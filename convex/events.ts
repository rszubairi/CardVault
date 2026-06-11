import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return ctx.db
      .query('events')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect();
  },
});

export const getById = query({
  args: { eventId: v.id('events') },
  handler: async (ctx, args) => ctx.db.get(args.eventId),
});

export const create = mutation({
  args: {
    userId:          v.id('users'),
    title:           v.string(),
    location:        v.optional(v.string()),
    date:            v.number(),
    endDate:         v.optional(v.number()),
    calendarSource:  v.optional(v.string()),
    calendarEventId: v.optional(v.string()),
    organizationId:  v.optional(v.id('organizations')),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('events', { ...args, createdAt: Date.now() });
  },
});

export const getNearby = query({
  args: {
    userId:    v.id('users'),
    timestamp: v.number(),
    windowMs:  v.optional(v.number()),
  },
  handler: async (ctx, { userId, timestamp, windowMs = 4 * 60 * 60 * 1000 }) => {
    const all = await ctx.db
      .query('events')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();

    return all.filter((e) => Math.abs(e.date - timestamp) <= windowMs);
  },
});
