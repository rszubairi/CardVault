import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrgPermissions } from '../../src/hooks/useOrgPermissions';
import { E } from '../constants/theme';

type PermissionKey = keyof Omit<OrgPermissions, 'role'>;

interface PermissionGateProps {
  permissions: OrgPermissions | null;
  require: PermissionKey;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function LockedBanner() {
  return (
    <View style={styles.banner}>
      <Ionicons name="lock-closed" size={14} color={E.textMuted} style={{ marginRight: 6 }} />
      <Text style={styles.bannerText}>Your admin has restricted this action.</Text>
    </View>
  );
}

export function PermissionGate({ permissions, require: key, children, fallback }: PermissionGateProps) {
  if (permissions === null) return null;
  if (permissions[key]) return <>{children}</>;
  return <>{fallback ?? <LockedBanner />}</>;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   E.surfaceAlt,
    borderRadius:      10,
    paddingVertical:   10,
    paddingHorizontal: 14,
    borderWidth:       1,
    borderColor:       E.border,
  },
  bannerText: {
    color:     E.textMuted,
    fontSize:  13,
    flexShrink: 1,
  },
});
