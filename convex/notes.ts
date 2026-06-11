import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
  args: { contactId: v.id('contacts') },
  handler: async (ctx, args) => {
    return ctx.db
      .query('notes')
      .withIndex('by_contact', (q) => q.eq('contactId', args.contactId))
      .order('desc')
      .collect();
  },
});

export const create = mutation({
  args: {
    contactId: v.id('contacts'),
    userId:    v.id('users'),
    content:   v.string(),
    type:      v.union(v.literal('text'), v.literal('voice'), v.literal('ai_summary')),
    audioUrl:  v.optional(v.string()),
    aiSummary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const noteId = await ctx.db.insert('notes', {
      ...args,
      createdAt: Date.now(),
    });

    await ctx.db.insert('interactions', {
      contactId: args.contactId,
      userId:    args.userId,
      type:      'note_added',
      timestamp: Date.now(),
    });

    return noteId;
  },
});

export const remove = mutation({
  args: { noteId: v.id('notes') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.noteId);
  },
});
