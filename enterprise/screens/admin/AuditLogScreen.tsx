import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { E } from '../../constants/theme';

const ACTION_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  member_invited:      { icon: 'person-add-outline',   color: E.success,  label: 'Member invited' },
  member_removed:      { icon: 'person-remove-outline', color: E.error,   label: 'Member removed' },
  member_role_changed: { icon: 'shield-outline',        color: E.gold,    label: 'Role changed' },
  policy_updated:      { icon: 'settings-outline',      color: E.goldDim, label: 'Policy updated' },
  contact_exported:    { icon: 'download-outline',      color: E.textSecondary, label: 'Contact exported' },
  contact_deleted:     { icon: 'trash-outline',         color: E.error,   label: 'Contact deleted' },
  contact_scanned:     { icon: 'scan-outline',          color: E.gold,    label: 'Card scanned' },
  contact_edited:      { icon: 'create-outline',        color: E.textMuted, label: 'Contact edited' },
};

function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Props {
  organizationId: Id<'organizations'>;
}

export default function AuditLogScreen({ organizationId }: Props) {
  const entries = useQuery(api.policies.listAuditLog, { organizationId, limit: 200 });

  if (!entries) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={E.gold} />
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="document-text-outline" size={40} color={E.border} />
        <Text style={styles.empty}>No activity yet.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={entries}
        keyExtractor={(e) => e._id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.title}>Activity Log</Text>}
        renderItem={({ item: e }) => {
          const meta = ACTION_META[e.action] ?? { icon: 'ellipse-outline', color: E.textMuted, label: e.action };
          return (
            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: `${meta.color}18` }]}>
                <Ionicons name={meta.icon} size={15} color={meta.color} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowLabel}>
                  <Text style={styles.actor}>{e.actorName}</Text>
                  {'  ·  '}
                  <Text>{meta.label}</Text>
                  {e.targetName ? <Text style={styles.target}>  {e.targetName}</Text> : null}
                </Text>
                <Text style={styles.rowTime}>{formatRelative(e.timestamp)}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  empty:     { color: E.textMuted, fontSize: 14 },
  list:      { padding: 20, paddingBottom: 40 },
  title:     { fontSize: 20, fontWeight: '700', color: E.textPrimary, marginBottom: 16 },

  row: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    paddingVertical:   11,
    borderBottomWidth: 1,
    borderBottomColor: E.borderSub,
    gap:               12,
  },
  iconWrap: {
    width:          34,
    height:         34,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      1,
  },
  rowBody:  { flex: 1 },
  rowLabel: { color: E.textSecondary, fontSize: 13, lineHeight: 18 },
  actor:    { color: E.textPrimary, fontWeight: '700' },
  target:   { color: E.gold },
  rowTime:  { color: E.textMuted, fontSize: 11, marginTop: 3 },
});
