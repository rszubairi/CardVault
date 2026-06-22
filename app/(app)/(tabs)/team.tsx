import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuthStore } from '../../../src/stores/authStore';
import { isEnterprise } from '../../../src/config/appVariant';
import { Redirect } from 'expo-router';
import { E } from '../../../enterprise/constants/theme';
import MembersScreen     from '../../../enterprise/screens/admin/MembersScreen';
import PermissionsScreen from '../../../enterprise/screens/admin/PermissionsScreen';
import AuditLogScreen    from '../../../enterprise/screens/admin/AuditLogScreen';
import { Id } from '../../../convex/_generated/dataModel';

if (!isEnterprise) {
  export default function TeamTabDisabled() {
    return <Redirect href="/(app)/(tabs)/" />;
  }
}

type AdminTab = 'members' | 'permissions' | 'activity';

const TABS: { key: AdminTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'members',     label: 'Members',     icon: 'people-outline' },
  { key: 'permissions', label: 'Permissions', icon: 'shield-outline' },
  { key: 'activity',    label: 'Activity',    icon: 'pulse-outline' },
];

export default function TeamTab() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('members');

  const myOrg = useQuery(
    api.organizations.getMyOrg,
    user ? { userId: user._id as Id<'users'> } : 'skip',
  );

  if (!user) return null;

  if (myOrg === undefined) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (!myOrg) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.noOrg}>
          <View style={styles.noOrgIconWrap}>
            <Ionicons name="business-outline" size={32} color={E.gold} />
          </View>
          <Text style={styles.noOrgTitle}>No organization</Text>
          <Text style={styles.noOrgSub}>
            You're not part of an enterprise organization yet. Ask your admin to invite you.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isAdmin = ['owner', 'admin'].includes(myOrg.myRole);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Org header */}
      <View style={styles.orgHeader}>
        <View style={styles.orgIcon}>
          <Ionicons name="business" size={20} color={E.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.orgName}>{myOrg.name}</Text>
          <Text style={styles.orgRole}>{myOrg.myRole.replace('_', ' ')}</Text>
        </View>
        {/* Gold crown for owner */}
        {myOrg.myRole === 'owner' && (
          <Ionicons name="trophy-outline" size={18} color={E.gold} />
        )}
      </View>

      {/* Sub-tabs — non-admins skip Permissions */}
      <View style={styles.tabBar}>
        {TABS.filter((t) => isAdmin || t.key !== 'permissions').map((t) => {
          const active = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Ionicons name={t.icon} size={15} color={active ? E.gold : E.textMuted} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === 'members' && (
          <MembersScreen
            organizationId={myOrg._id as Id<'organizations'>}
            myRole={myOrg.myRole}
          />
        )}
        {activeTab === 'permissions' && isAdmin && (
          <PermissionsScreen organizationId={myOrg._id as Id<'organizations'>} />
        )}
        {activeTab === 'activity' && (
          <AuditLogScreen organizationId={myOrg._id as Id<'organizations'>} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: E.bg },
  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: E.bg },
  loadingText: { color: E.textMuted, fontSize: 14 },

  orgHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 20,
    paddingVertical:   16,
    borderBottomWidth: 1,
    borderBottomColor: E.border,
    gap:               12,
  },
  orgIcon: {
    width:           44,
    height:          44,
    borderRadius:    12,
    backgroundColor: E.goldTint,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     E.border,
  },
  orgName: { fontSize: 17, fontWeight: '700', color: E.textPrimary },
  orgRole: {
    fontSize:        12,
    color:           E.gold,
    textTransform:   'capitalize',
    marginTop:       2,
    fontWeight:      '600',
  },

  tabBar: {
    flexDirection:     'row',
    paddingHorizontal: 16,
    paddingVertical:   8,
    borderBottomWidth: 1,
    borderBottomColor: E.border,
    gap:               4,
  },
  tabItem: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius:   10,
    gap: 5,
  },
  tabItemActive:  { backgroundColor: E.goldTint },
  tabLabel:       { color: E.textMuted, fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: E.gold },

  noOrg: {
    flex:              1,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 40,
    gap:               16,
  },
  noOrgIconWrap: {
    width:           72,
    height:          72,
    borderRadius:    20,
    backgroundColor: E.goldTint,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     E.border,
  },
  noOrgTitle: { fontSize: 18, fontWeight: '700', color: E.textPrimary },
  noOrgSub:   { fontSize: 14, color: E.textSecondary, textAlign: 'center', lineHeight: 22 },
});
