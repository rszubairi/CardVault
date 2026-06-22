import { internalAction, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export const create = mutation({
  args: {
    userId:       v.id('users'),
    name:         v.string(),
    billingEmail: v.string(),
  },
  handler: async (ctx, { userId, name, billingEmail }) => {
    const orgId = await ctx.db.insert('organizations', {
      name,
      billingEmail,
      createdAt: Date.now(),
    });

    await ctx.db.insert('organizationUsers', {
      organizationId: orgId,
      userId,
      role:     'owner',
      joinedAt: Date.now(),
    });

    await ctx.db.insert('subscriptions', {
      organizationId: orgId,
      plan:      'enterprise',
      status:    'trialing',
      scanCount: 0,
      scanLimit: 999999,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return orgId;
  },
});

export const getById = query({
  args: { orgId: v.id('organizations') },
  handler: async (ctx, { orgId }) => ctx.db.get(orgId),
});

export const getMyOrg = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const membership = await ctx.db
      .query('organizationUsers')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();
    if (!membership) return null;
    const org = await ctx.db.get(membership.organizationId);
    if (!org) return null;
    return { ...org, myRole: membership.role, membershipId: membership._id };
  },
});

export const listMembers = query({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, { organizationId }) => {
    const memberships = await ctx.db
      .query('organizationUsers')
      .withIndex('by_org', (q) => q.eq('organizationId', organizationId))
      .collect();

    return Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          membershipId: m._id,
          role:         m.role,
          joinedAt:     m.joinedAt,
          userId:       m.userId,
          name:         user?.name   ?? 'Unknown',
          email:        user?.email  ?? '',
          photo:        user?.profilePhoto,
        };
      }),
    );
  },
});

export const inviteByEmail = mutation({
  args: {
    organizationId: v.id('organizations'),
    actorUserId:    v.id('users'),
    email:          v.string(),
    role:           v.union(
      v.literal('admin'),
      v.literal('manager'),
      v.literal('member'),
      v.literal('read_only'),
    ),
  },
  handler: async (ctx, { organizationId, actorUserId, email, role }) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email.toLowerCase().trim()))
      .unique();

    if (!user) {
      throw new Error(`No CardVault account found for ${email}. They must sign up first.`);
    }

    const existing = await ctx.db
      .query('organizationUsers')
      .withIndex('by_org_user', (q) =>
        q.eq('organizationId', organizationId).eq('userId', user._id),
      )
      .unique();

    if (existing) {
      throw new Error('This user is already a member of your organization.');
    }

    await ctx.db.insert('organizationUsers', {
      organizationId,
      userId:  user._id,
      role,
      joinedAt: Date.now(),
    });

    await ctx.db.insert('auditLog', {
      organizationId,
      actorUserId,
      targetUserId: user._id,
      action: 'member_invited',
      metadata: { role, email },
      timestamp: Date.now(),
    });

    return user._id;
  },
});

export const updateRole = mutation({
  args: {
    membershipId: v.id('organizationUsers'),
    actorUserId:  v.id('users'),
    role: v.union(
      v.literal('admin'),
      v.literal('manager'),
      v.literal('member'),
      v.literal('read_only'),
    ),
  },
  handler: async (ctx, { membershipId, actorUserId, role }) => {
    const membership = await ctx.db.get(membershipId);
    if (!membership) throw new Error('Membership not found.');

    await ctx.db.patch(membershipId, { role });

    await ctx.db.insert('auditLog', {
      organizationId: membership.organizationId,
      actorUserId,
      targetUserId: membership.userId,
      action: 'member_role_changed',
      metadata: { newRole: role },
      timestamp: Date.now(),
    });
  },
});

export const removeMember = mutation({
  args: {
    membershipId: v.id('organizationUsers'),
    actorUserId:  v.id('users'),
  },
  handler: async (ctx, { membershipId, actorUserId }) => {
    const membership = await ctx.db.get(membershipId);
    if (!membership) throw new Error('Membership not found.');

    const { organizationId, userId: removedUserId } = membership;

    // Look up the removed user's push token before deleting the membership
    const removedUser = await ctx.db.get(removedUserId);

    await ctx.db.delete(membershipId);

    // Also remove any per-user policy overrides for this user
    const userPolicy = await ctx.db
      .query('organizationUserPolicies')
      .withIndex('by_org_user', (q) =>
        q.eq('organizationId', organizationId).eq('userId', removedUserId),
      )
      .unique();
    if (userPolicy) await ctx.db.delete(userPolicy._id);

    await ctx.db.insert('auditLog', {
      organizationId,
      actorUserId,
      targetUserId: removedUserId,
      action: 'member_removed',
      timestamp: Date.now(),
    });

    // Fire-and-forget push notification to trigger device-side org data purge
    if (removedUser?.pushToken) {
      await ctx.scheduler.runAfter(0, internal.organizations.sendRevocationPush, {
        pushToken:      removedUser.pushToken,
        organizationId: organizationId as string,
        orgName:        (await ctx.db.get(organizationId))?.name ?? 'your organization',
      });
    }
  },
});

export const sendRevocationPush = internalAction({
  args: {
    pushToken:      v.string(),
    organizationId: v.string(),
    orgName:        v.string(),
  },
  handler: async (_ctx, { pushToken, organizationId, orgName }) => {
    await fetch(EXPO_PUSH_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to:    pushToken,
        title: 'Access revoked',
        body:  `Your access to ${orgName} has been removed.`,
        data:  { type: 'org_revoked', organizationId },
        sound: 'default',
      }),
    });
  },
});

export const updateOrg = mutation({
  args: {
    orgId:        v.id('organizations'),
    name:         v.optional(v.string()),
    billingEmail: v.optional(v.string()),
  },
  handler: async (ctx, { orgId, ...updates }) => {
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );
    await ctx.db.patch(orgId, filtered);
  },
});
