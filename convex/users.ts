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
      return { userId: existing._id, isNew: false };
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

    return { userId, isNew: true };
  },
});

export const getById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    return ctx.db.get(args.userId);
  },
});

export const updatePushToken = mutation({
  args: { userId: v.id('users'), pushToken: v.string() },
  handler: async (ctx, { userId, pushToken }) => {
    await ctx.db.patch(userId, { pushToken });
  },
});

export const getEncryptionConfig = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return {
      encryptionEnabled: user.encryptionEnabled ?? false,
      encryptionSalt:    user.encryptionSalt,
      pinHash:           user.pinHash,
      pinSalt:           user.pinSalt,
    };
  },
});

export const setupPIN = mutation({
  args: {
    userId:         v.id('users'),
    pinHash:        v.string(),
    pinSalt:        v.string(),
    encryptionSalt: v.string(),
  },
  handler: async (ctx, { userId, pinHash, pinSalt, encryptionSalt }) => {
    await ctx.db.patch(userId, {
      pinHash,
      pinSalt,
      encryptionSalt,
      encryptionEnabled: true,
    });
  },
});

export const changePIN = mutation({
  args: {
    userId:            v.id('users'),
    oldPinHash:        v.string(),
    newPinHash:        v.string(),
    newPinSalt:        v.string(),
    newEncryptionSalt: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.pinHash !== args.oldPinHash) {
      throw new Error('Invalid PIN');
    }
    await ctx.db.patch(args.userId, {
      pinHash:        args.newPinHash,
      pinSalt:        args.newPinSalt,
      encryptionSalt: args.newEncryptionSalt,
    });
  },
});

export const disableEncryption = mutation({
  args: {
    userId:  v.id('users'),
    pinHash: v.string(),
  },
  handler: async (ctx, { userId, pinHash }) => {
    const user = await ctx.db.get(userId);
    if (!user || user.pinHash !== pinHash) {
      throw new Error('Invalid PIN');
    }
    await ctx.db.patch(userId, {
      encryptionEnabled: false,
      pinHash:           undefined,
      pinSalt:           undefined,
      encryptionSalt:    undefined,
    });
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
