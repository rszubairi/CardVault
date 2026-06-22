import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// ─── Version comparison ────────────────────────────────────────────────────────

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

// ─── Admin guard ──────────────────────────────────────────────────────────────

async function assertAdmin(ctx: any, userId: string): Promise<void> {
  const user = await ctx.db.get(userId);
  if (!user) throw new Error('User not found');
  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e: string) => e.trim()).filter(Boolean);
  if (!adminEmails.includes(user.email)) {
    throw new Error('Not authorized — admin access required');
  }
}

// ─── Public queries ───────────────────────────────────────────────────────────

/**
 * Returns the latest published release applicable to this platform + edition.
 * Called on every app launch to check for updates.
 */
export const getLatestRelease = query({
  args: {
    platform: v.union(v.literal('ios'), v.literal('android')),
    edition:  v.union(v.literal('personal'), v.literal('enterprise')),
  },
  handler: async (ctx, { platform, edition }) => {
    const published = await ctx.db
      .query('appReleases')
      .withIndex('by_published', (q) => q.eq('isPublished', true))
      .collect();

    const applicable = published.filter((r) => {
      const platformOk = r.platform === 'both' || r.platform === platform;
      const editionOk  = r.edition  === 'all'  || r.edition  === edition;
      return platformOk && editionOk;
    });

    applicable.sort((a, b) => compareVersions(b.version, a.version));
    return applicable[0] ?? null;
  },
});

export const checkIsAdmin = query({
  args: { userId: v.id('users') },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return false;
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e: string) => e.trim()).filter(Boolean);
    return adminEmails.includes(user.email);
  },
});

// ─── Admin queries ─────────────────────────────────────────────────────────────

export const listAllReleases = query({
  args: { adminUserId: v.id('users') },
  handler: async (ctx, { adminUserId }) => {
    await assertAdmin(ctx, adminUserId);
    const releases = await ctx.db
      .query('appReleases')
      .order('desc')
      .collect();
    return releases;
  },
});

// ─── Admin mutations ──────────────────────────────────────────────────────────

export const createRelease = mutation({
  args: {
    adminUserId:  v.id('users'),
    version:      v.string(),
    releaseType:  v.union(v.literal('major'), v.literal('minor')),
    platform:     v.union(v.literal('ios'), v.literal('android'), v.literal('both')),
    edition:      v.union(v.literal('personal'), v.literal('enterprise'), v.literal('all')),
    releaseNotes: v.string(),
    iosUrl:       v.optional(v.string()),
    androidUrl:   v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminUserId);
    const user = await ctx.db.get(args.adminUserId);
    return ctx.db.insert('appReleases', {
      version:      args.version,
      releaseType:  args.releaseType,
      platform:     args.platform,
      edition:      args.edition,
      releaseNotes: args.releaseNotes,
      iosUrl:       args.iosUrl,
      androidUrl:   args.androidUrl,
      isPublished:  false,
      createdAt:    Date.now(),
      createdBy:    user?.email,
    });
  },
});

export const updateRelease = mutation({
  args: {
    adminUserId:  v.id('users'),
    releaseId:    v.id('appReleases'),
    version:      v.optional(v.string()),
    releaseType:  v.optional(v.union(v.literal('major'), v.literal('minor'))),
    platform:     v.optional(v.union(v.literal('ios'), v.literal('android'), v.literal('both'))),
    edition:      v.optional(v.union(v.literal('personal'), v.literal('enterprise'), v.literal('all'))),
    releaseNotes: v.optional(v.string()),
    iosUrl:       v.optional(v.string()),
    androidUrl:   v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminUserId);
    const { adminUserId, releaseId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );
    await ctx.db.patch(releaseId, filtered);
  },
});

export const publishRelease = mutation({
  args: {
    adminUserId: v.id('users'),
    releaseId:   v.id('appReleases'),
  },
  handler: async (ctx, { adminUserId, releaseId }) => {
    await assertAdmin(ctx, adminUserId);
    await ctx.db.patch(releaseId, {
      isPublished: true,
      publishedAt: Date.now(),
    });
  },
});

export const unpublishRelease = mutation({
  args: {
    adminUserId: v.id('users'),
    releaseId:   v.id('appReleases'),
  },
  handler: async (ctx, { adminUserId, releaseId }) => {
    await assertAdmin(ctx, adminUserId);
    await ctx.db.patch(releaseId, {
      isPublished: false,
      publishedAt: undefined,
    });
  },
});

export const deleteRelease = mutation({
  args: {
    adminUserId: v.id('users'),
    releaseId:   v.id('appReleases'),
  },
  handler: async (ctx, { adminUserId, releaseId }) => {
    await assertAdmin(ctx, adminUserId);
    const release = await ctx.db.get(releaseId);
    if (release?.isPublished) {
      throw new Error('Cannot delete a published release — unpublish it first');
    }
    await ctx.db.delete(releaseId);
  },
});
