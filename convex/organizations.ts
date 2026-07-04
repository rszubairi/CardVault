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

// ── Invite helpers ────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/I/1 confusion
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Create a pending invite ───────────────────────────────────────────────────

export const createInvite = mutation({
  args: {
    organizationId: v.id('organizations'),
    actorUserId:    v.id('users'),
    personalEmail:  v.string(),
    role:           v.union(
      v.literal('admin'),
      v.literal('manager'),
      v.literal('member'),
      v.literal('read_only'),
    ),
  },
  handler: async (ctx, { organizationId, actorUserId, personalEmail, role }) => {
    const email = personalEmail.toLowerCase().trim();

    // Check actor is admin/owner
    const actorMembership = await ctx.db
      .query('organizationUsers')
      .withIndex('by_org_user', (q) =>
        q.eq('organizationId', organizationId).eq('userId', actorUserId),
      )
      .unique();
    if (!actorMembership || !['owner', 'admin'].includes(actorMembership.role)) {
      throw new Error('Only admins can invite members.');
    }

    // If user already has an account, check they're not already a member
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .unique();

    if (existingUser) {
      const alreadyMember = await ctx.db
        .query('organizationUsers')
        .withIndex('by_org_user', (q) =>
          q.eq('organizationId', organizationId).eq('userId', existingUser._id),
        )
        .unique();
      if (alreadyMember) throw new Error('This person is already a member of your organization.');
    }

    // Cancel any existing pending invite for this email in this org
    const existingInvite = await ctx.db
      .query('organizationInvites')
      .withIndex('by_email', (q) => q.eq('personalEmail', email))
      .filter((q) =>
        q.and(
          q.eq(q.field('organizationId'), organizationId),
          q.eq(q.field('status'), 'pending'),
        ),
      )
      .first();
    if (existingInvite) {
      await ctx.db.patch(existingInvite._id, { status: 'expired' });
    }

    const inviteCode = generateInviteCode();
    const now = Date.now();

    const inviteId = await ctx.db.insert('organizationInvites', {
      organizationId,
      invitedByUserId: actorUserId,
      personalEmail:   email,
      role,
      inviteCode,
      status:    'pending',
      expiresAt: now + INVITE_TTL_MS,
      createdAt: now,
    });

    await ctx.db.insert('auditLog', {
      organizationId,
      actorUserId,
      action:   'member_invited',
      metadata: { role, email, inviteCode },
      timestamp: now,
    });

    const org = await ctx.db.get(organizationId);

    // Return the invite code so the admin can share it with the invitee
    return { inviteId, inviteCode, orgName: org?.name ?? '' };
  },
});

// ── Get pending invites for a user (by their personal email) ─────────────────

export const getPendingInvitesForUser = query({
  args: { personalEmail: v.string() },
  handler: async (ctx, { personalEmail }) => {
    const email = personalEmail.toLowerCase().trim();
    const now   = Date.now();

    const invites = await ctx.db
      .query('organizationInvites')
      .withIndex('by_email', (q) => q.eq('personalEmail', email))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .collect();

    return Promise.all(
      invites
        .filter((inv) => inv.expiresAt > now)
        .map(async (inv) => {
          const org     = await ctx.db.get(inv.organizationId);
          const inviter = await ctx.db.get(inv.invitedByUserId);
          return {
            inviteId:       inv._id,
            organizationId: inv.organizationId,
            orgName:        org?.name ?? 'Unknown Organization',
            inviterName:    inviter?.name ?? 'Someone',
            role:           inv.role,
            expiresAt:      inv.expiresAt,
          };
        }),
    );
  },
});

// ── List pending invites for org admins ──────────────────────────────────────

export const listPendingInvites = query({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, { organizationId }) => {
    const now = Date.now();
    const invites = await ctx.db
      .query('organizationInvites')
      .withIndex('by_org', (q) => q.eq('organizationId', organizationId))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .collect();

    return invites
      .filter((inv) => inv.expiresAt > now)
      .map((inv) => ({
        inviteId:      inv._id,
        personalEmail: inv.personalEmail,
        role:          inv.role,
        inviteCode:    inv.inviteCode,
        expiresAt:     inv.expiresAt,
        createdAt:     inv.createdAt,
      }));
  },
});

// ── Cancel a pending invite (admin action) ───────────────────────────────────

export const cancelInvite = mutation({
  args: {
    inviteId:    v.id('organizationInvites'),
    actorUserId: v.id('users'),
  },
  handler: async (ctx, { inviteId, actorUserId }) => {
    const invite = await ctx.db.get(inviteId);
    if (!invite) throw new Error('Invite not found.');

    const membership = await ctx.db
      .query('organizationUsers')
      .withIndex('by_org_user', (q) =>
        q.eq('organizationId', invite.organizationId).eq('userId', actorUserId),
      )
      .unique();
    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      throw new Error('Only admins can cancel invites.');
    }

    await ctx.db.patch(inviteId, { status: 'expired' });
  },
});

// ── Accept an invite ──────────────────────────────────────────────────────────

export const acceptInvite = mutation({
  args: {
    userId:         v.id('users'),
    inviteCode:     v.string(),
    corporateEmail: v.string(),
  },
  handler: async (ctx, { userId, inviteCode, corporateEmail }) => {
    const user = await ctx.db.get(userId);
    if (!user) throw new Error('User not found.');

    const invite = await ctx.db
      .query('organizationInvites')
      .withIndex('by_code', (q) => q.eq('inviteCode', inviteCode.toUpperCase().trim()))
      .unique();

    if (!invite) throw new Error('Invalid invite code. Please check and try again.');
    if (invite.status !== 'pending') throw new Error('This invite has already been used or expired.');
    if (invite.expiresAt < Date.now()) {
      await ctx.db.patch(invite._id, { status: 'expired' });
      throw new Error('This invite has expired. Ask your admin to send a new one.');
    }
    // Validate the personal email matches the invitee
    if (invite.personalEmail !== user.email.toLowerCase().trim()) {
      throw new Error('This invite was sent to a different email address.');
    }

    // Check not already a member
    const alreadyMember = await ctx.db
      .query('organizationUsers')
      .withIndex('by_org_user', (q) =>
        q.eq('organizationId', invite.organizationId).eq('userId', userId),
      )
      .unique();
    if (alreadyMember) throw new Error('You are already a member of this organization.');

    const now = Date.now();

    // Add to org
    await ctx.db.insert('organizationUsers', {
      organizationId: invite.organizationId,
      userId,
      role:     invite.role,
      joinedAt: now,
    });

    // Save corporate email on user profile
    await ctx.db.patch(userId, { corporateEmail: corporateEmail.toLowerCase().trim() });

    // Elevate user's personal subscription to enterprise
    const sub = await ctx.db
      .query('subscriptions')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique();
    if (sub) {
      await ctx.db.patch(sub._id, {
        plan:      'enterprise',
        status:    'active',
        scanLimit: 999999,
        updatedAt: now,
      });
    }

    // Mark invite accepted
    await ctx.db.patch(invite._id, { status: 'accepted' });

    await ctx.db.insert('auditLog', {
      organizationId: invite.organizationId,
      actorUserId:    userId,
      targetUserId:   userId,
      action:         'member_invited',
      metadata:       { role: invite.role, email: user.email, accepted: true },
      timestamp:      now,
    });

    const org = await ctx.db.get(invite.organizationId);
    return { orgName: org?.name ?? '', role: invite.role };
  },
});

// ── Decline an invite ─────────────────────────────────────────────────────────

export const declineInvite = mutation({
  args: {
    userId:   v.id('users'),
    inviteId: v.id('organizationInvites'),
  },
  handler: async (ctx, { userId, inviteId }) => {
    const user   = await ctx.db.get(userId);
    const invite = await ctx.db.get(inviteId);
    if (!invite || !user) throw new Error('Invite not found.');
    if (invite.personalEmail !== user.email.toLowerCase().trim()) {
      throw new Error('This invite was not sent to your email.');
    }
    await ctx.db.patch(inviteId, { status: 'declined' });
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
