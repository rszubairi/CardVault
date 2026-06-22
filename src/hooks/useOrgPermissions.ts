import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthStore } from '../stores/authStore';
import { Id } from '../../convex/_generated/dataModel';

export interface OrgPermissions {
  canExportContacts:  boolean;
  canDeleteContacts:  boolean;
  canScanCards:       boolean;
  canViewAllContacts: boolean;
  canEditContacts:    boolean;
  role: string;
}

const FULL_ACCESS: OrgPermissions = {
  canExportContacts:  true,
  canDeleteContacts:  true,
  canScanCards:       true,
  canViewAllContacts: true,
  canEditContacts:    true,
  role: 'owner',
};

/**
 * Returns the effective permissions for the current user within their org.
 * Returns null while loading, FULL_ACCESS if no org (personal use).
 */
export function useOrgPermissions(organizationId?: Id<'organizations'> | null): OrgPermissions | null {
  const { user } = useAuthStore();

  const permissions = useQuery(
    api.policies.getEffectivePermissions,
    user && organizationId
      ? { organizationId, userId: user._id as Id<'users'> }
      : 'skip',
  );

  if (!organizationId) return FULL_ACCESS;
  if (!user) return null;
  if (permissions === undefined) return null; // loading

  return permissions ?? FULL_ACCESS;
}

/**
 * Convenience — returns false while loading so UI stays locked until resolved.
 */
export function useCanExport(organizationId?: Id<'organizations'> | null): boolean {
  const p = useOrgPermissions(organizationId);
  return p?.canExportContacts ?? false;
}

export function useCanDelete(organizationId?: Id<'organizations'> | null): boolean {
  const p = useOrgPermissions(organizationId);
  return p?.canDeleteContacts ?? false;
}

export function useCanScan(organizationId?: Id<'organizations'> | null): boolean {
  const p = useOrgPermissions(organizationId);
  return p?.canScanCards ?? false;
}
