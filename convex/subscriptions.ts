import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const getByUserId = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return ctx.db
      .query('subscriptions')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();
  },
});

export const upgradeToPersonalPro = mutation({
  args: {
    userId:              v.id('users'),
    stripeCustomerId:    v.string(),
    stripeSubscriptionId:v.string(),
    currentPeriodEnd:    v.number(),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();

    if (!sub) throw new Error('Subscription not found');

    await ctx.db.patch(sub._id, {
      plan:                'personal_pro',
      status:              'active',
      stripeCustomerId:    args.stripeCustomerId,
      stripeSubscriptionId:args.stripeSubscriptionId,
      currentPeriodEnd:    args.currentPeriodEnd,
      scanLimit:           999999,
      updatedAt:           Date.now(),
    });
  },
});

export const handleStripeWebhook = mutation({
  args: {
    event:  v.string(),
    data:   v.any(),
  },
  handler: async (ctx, { event, data }) => {
    if (event === 'customer.subscription.updated' || event === 'customer.subscription.deleted') {
      const stripeSubId = data.id as string;
      const status      = data.status as string;
      const periodEnd   = data.current_period_end as number;

      const sub = await ctx.db
        .query('subscriptions')
        .withIndex('by_stripeCustomer', (q) => q.eq('stripeCustomerId', data.customer))
        .unique();

      if (sub) {
        await ctx.db.patch(sub._id, {
          status:          status === 'active' ? 'active' : status === 'past_due' ? 'past_due' : 'cancelled',
          currentPeriodEnd:periodEnd * 1000,
          updatedAt:       Date.now(),
        });
      }
    }
  },
});
