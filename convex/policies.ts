import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireAdminOrOwner(
  ctx: any,
  organizationId: string,
  actorUserId: string,
) {
  const membership = await ctx.db
    .query('organizationUsers')
    .withIndex('by_org_user', (q: any) =>
      q.eq('organizationId', organizationId).eq('userId', actorUserId),
    )
    .unique();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw new Error('Only org owners and admins can manage policies.');
  }
}

// ─── Org-wide policy ─────────────────────────────────────────────────────────

export const getOrgPolicy = query({
  args: { organizationId: v.id('organizations') },
  handler: async (ctx, { organizationId }) => {
    return ctx.db
      .query('organizationPolicies')
      .withIndex('by_org', (q) => q.eq('organizationId', organizationId))
      .first();
  },
});

export const upsertOrgPolicy = mutation({
  args: {
    organizationId:     v.id('organizations'),
    actorUserId:        v.id('users'),
    appliesToRoles:     v.array(v.string()),
    canExportContacts:  v.boolean(),
    canDeleteContacts:  v.boolean(),
    canScanCards:       v.boolean(),
    canViewAllContacts: v.boolean(),
    canEditContacts:    v.boolean(),
  },
  handler: async (ctx, { actorUserId, ...args }) => {
    await requireAdminOrOwner(ctx, args.organizationId, actorUserId);

    const existing = await ctx.db
      .query('organizationPolicies')
      .withIndex('by_org', (q) => q.eq('organizationId', args.organizationId))
      .first();

    const payload = { ...args, updatedAt: Date.now() };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert('organizationPolicies', payload);
    }

    await ctx.db.insert('auditLog', {
      organizationId: args.organizationId,
      actorUserId,
      action: 'policy_updated',
      metadata: { scope: 'org' },
      timestamp: Date.now(),
    });
  },
});

// ─── Per-user overrides ───────────────────────────────────────────────────────

export const getUserPolicyOverride = query({
  args: {
    organizationId: v.id('organizations'),
    userId:         v.id('users'),
  },
  handler: async (ctx, { organizationId, userId }) => {
    return ctx.db
      .query('organizationUserPolicies')
      .withIndex('by_org_user', (q) =>
        q.eq('organizationId', organizationId).eq('userId', userId),
      )
      .unique();
  },
});

export const upsertUserPolicyOverride = mutation({
  args: {
    organizationId:     v.id('organizations'),
    actorUserId:        v.id('users'),
    targetUserId:       v.id('users'),
    canExportContacts:  v.optional(v.boolean()),
    canDeleteContacts:  v.optional(v.boolean()),
    canScanCards:       v.optional(v.boolean()),
    canViewAllContacts: v.optional(v.boolean()),
    canEditContacts:    v.optional(v.boolean()),
  },
  handler: async (ctx, { actorUserId, targetUserId, organizationId, ...fields }) => {
    await requireAdminOrOwner(ctx, organizationId, actorUserId);

    const existing = await ctx.db
      .query('organizationUserPolicies')
      .withIndex('by_org_user', (q) =>
        q.eq('organizationId', organizationId).eq('userId', targetUserId),
      )
      .unique();

    const payload = { organizationId, userId: targetUserId, ...fields, updatedAt: Date.now() };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert('organizationUserPolicies', payload);
    }

    await ctx.db.insert('auditLog', {
      organizationId,
      actorUserId,
      targetUserId,
      action: 'policy_updated',
      metadata: { scope: 'user' },
      timestamp: Date.now(),
    });
  },
});

// ─── Resolved effective permissions ──────────────────────────────────────────
// Merges org policy + user override; owner/admin always get full access.

export const getEffectivePermissions = query({
  args: {
    organizationId: v.id('organizations'),
    userId:         v.id('users'),
  },
  handler: async (ctx, { organizationId, userId }) => {
    const membership = await ctx.db
      .query('organizationUsers')
      .withIndex('by_org_user', (q) =>
        q.eq('organizationId', organizationId).eq('userId', userId),
      )
      .unique();

    if (!membership) return null;

    // Owners and admins always have full access
    if (['owner', 'admin'].includes(membership.role)) {
      return {
        canExportContacts:  true,
        canDeleteContacts:  true,
        canScanCards:       true,
        canViewAllContacts: true,
        canEditContacts:    true,
        role: membership.role,
      };
    }

    const orgPolicy = await ctx.db
      .query('organizationPolicies')
      .withIndex('by_org', (q) => q.eq('organizationId', organizationId))
      .first();

    const userOverride = await ctx.db
      .query('organizationUserPolicies')
      .withIndex('by_org_user', (q) =>
        q.eq('organizationId', organizationId).eq('userId', userId),
      )
      .unique();

    // Sensible defaults when no policy has been configured yet
    const defaults = {
      canExportContacts:  true,
      canDeleteContacts:  false,
      canScanCards:       true,
      canViewAllContacts: true,
      canEditContacts:    true,
    };

    const resolved = {
      canExportContacts:  userOverride?.canExportContacts  ?? orgPolicy?.canExportContacts  ?? defaults.canExportContacts,
      canDeleteContacts:  userOverride?.canDeleteContacts  ?? orgPolicy?.canDeleteContacts  ?? defaults.canDeleteContacts,
      canScanCards:       userOverride?.canScanCards       ?? orgPolicy?.canScanCards       ?? defaults.canScanCards,
      canViewAllContacts: userOverride?.canViewAllContacts ?? orgPolicy?.canViewAllContacts ?? defaults.canViewAllContacts,
      canEditContacts:    userOverride?.canEditContacts    ?? orgPolicy?.canEditContacts    ?? defaults.canEditContacts,
      role: membership.role,
    };

    return resolved;
  },
});

// ─── Audit log ───────────────────────────────────────────────────────────────

export const listAuditLog = query({
  args: {
    organizationId: v.id('organizations'),
    limit:          v.optional(v.number()),
  },
  handler: async (ctx, { organizationId, limit }) => {
    const entries = await ctx.db
      .query('auditLog')
      .withIndex('by_org_ts', (q) => q.eq('organizationId', organizationId))
      .order('desc')
      .take(limit ?? 100);

    return Promise.all(
      entries.map(async (e) => {
        const actor  = await ctx.db.get(e.actorUserId);
        const target = e.targetUserId ? await ctx.db.get(e.targetUserId) : null;
        return {
          ...e,
          actorName:  actor?.name  ?? 'Unknown',
          actorEmail: actor?.email ?? '',
          targetName: target?.name ?? null,
        };
      }),
    );
  },
});

export const logContactAction = mutation({
  args: {
    organizationId: v.id('organizations'),
    actorUserId:    v.id('users'),
    action:         v.union(
      v.literal('contact_exported'),
      v.literal('contact_deleted'),
      v.literal('contact_scanned'),
      v.literal('contact_edited'),
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('auditLog', {
      ...args,
      timestamp: Date.now(),
    });
  },
});
