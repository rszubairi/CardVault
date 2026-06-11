import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const list = query({
  args: { contactId: v.id('contacts') },
  handler: async (ctx, args) => {
    return ctx.db
      .query('interactions')
      .withIndex('by_contact', (q) => q.eq('contactId', args.contactId))
      .order('desc')
      .collect();
  },
});

export const log = mutation({
  args: {
    contactId: v.id('contacts'),
    userId:    v.id('users'),
    type:      v.union(
      v.literal('card_scanned'),
      v.literal('whatsapp_sent'),
      v.literal('linkedin_opened'),
      v.literal('note_added'),
      v.literal('follow_up_completed'),
      v.literal('meeting_added'),
      v.literal('email_sent'),
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert('interactions', {
      ...args,
      timestamp: Date.now(),
    });
  },
});
