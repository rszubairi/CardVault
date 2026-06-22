import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuthStore } from '../../../src/stores/authStore';
import { Id } from '../../../convex/_generated/dataModel';
import { E } from '../../constants/theme';

const PERMISSION_LABELS: Record<string, { label: string; description: string; icon: keyof typeof Ionicons.glyphMap }> = {
  canExportContacts:  { label: 'Export / Download Contacts', icon: 'download-outline',  description: 'Allow members to export contacts as vCard or CSV to their device.' },
  canDeleteContacts:  { label: 'Delete Contacts',            icon: 'trash-outline',     description: 'Allow members to permanently delete shared org contacts.' },
  canScanCards:       { label: 'Scan Business Cards',        icon: 'scan-outline',      description: 'Allow members to scan new cards and add them to the org.' },
  canViewAllContacts: { label: 'View All Team Contacts',     icon: 'people-outline',    description: 'Allow members to see contacts added by other team members.' },
  canEditContacts:    { label: 'Edit Contacts',              icon: 'create-outline',    description: 'Allow members to edit existing org contacts.' },
};

type PolicyFields = {
  canExportContacts:  boolean;
  canDeleteContacts:  boolean;
  canScanCards:       boolean;
  canViewAllContacts: boolean;
  canEditContacts:    boolean;
};

interface Props {
  organizationId: Id<'organizations'>;
}

export default function PermissionsScreen({ organizationId }: Props) {
  const { user } = useAuthStore();
  const existingPolicy = useQuery(api.policies.getOrgPolicy, { organizationId });
  const upsert = useMutation(api.policies.upsertOrgPolicy);
  const [saving, setSaving] = useState(false);

  const [policy, setPolicy] = useState<PolicyFields>({
    canExportContacts:  true,
    canDeleteContacts:  false,
    canScanCards:       true,
    canViewAllContacts: true,
    canEditContacts:    true,
  });

  useEffect(() => {
    if (existingPolicy) {
      setPolicy({
        canExportContacts:  existingPolicy.canExportContacts,
        canDeleteContacts:  existingPolicy.canDeleteContacts,
        canScanCards:       existingPolicy.canScanCards,
        canViewAllContacts: existingPolicy.canViewAllContacts,
        canEditContacts:    existingPolicy.canEditContacts,
      });
    }
  }, [existingPolicy?._id]);

  const toggle = (key: keyof PolicyFields) =>
    setPolicy((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await upsert({
        organizationId,
        actorUserId:    user._id as Id<'users'>,
        appliesToRoles: ['manager', 'member', 'read_only'],
        ...policy,
      });
      Alert.alert('Saved', 'Permissions updated for all team members.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (existingPolicy === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={E.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Team Permissions</Text>
        <Text style={styles.subtitle}>
          These defaults apply to managers, members, and read-only users.{'\n'}Owners and admins always have full access.
        </Text>

        <View style={styles.card}>
          {(Object.keys(PERMISSION_LABELS) as (keyof PolicyFields)[]).map((key, idx, arr) => {
            const meta = PERMISSION_LABELS[key];
            return (
              <View key={key} style={[styles.row, idx < arr.length - 1 && styles.rowBorder]}>
                <View style={[styles.iconWrap, { backgroundColor: policy[key] ? E.goldTint : E.surfaceAlt }]}>
                  <Ionicons name={meta.icon} size={16} color={policy[key] ? E.gold : E.textMuted} />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowLabel}>{meta.label}</Text>
                  <Text style={styles.rowDesc}>{meta.description}</Text>
                </View>
                <Switch
                  value={policy[key]}
                  onValueChange={() => toggle(key)}
                  trackColor={{ false: E.surfaceAlt, true: E.goldDim }}
                  thumbColor={policy[key] ? E.gold : E.textMuted}
                />
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={E.bg} size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save Permissions</Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={15} color={E.gold} style={{ marginRight: 6, marginTop: 1 }} />
          <Text style={styles.infoText}>
            Per-person overrides are available from the Members tab — tap any member's role badge.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:   { padding: 20, paddingBottom: 40 },

  title:    { fontSize: 22, fontWeight: '700', color: E.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 13, color: E.textSecondary, lineHeight: 20, marginBottom: 24 },

  card: {
    backgroundColor: E.surface,
    borderRadius:    16,
    overflow:        'hidden',
    marginBottom:    24,
    borderWidth:     1,
    borderColor:     E.border,
  },
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 16,
    paddingVertical:   14,
    gap:               12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: E.borderSub },
  iconWrap: {
    width:           34,
    height:          34,
    borderRadius:    10,
    alignItems:      'center',
    justifyContent:  'center',
  },
  rowText:  { flex: 1 },
  rowLabel: { color: E.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  rowDesc:  { color: E.textSecondary, fontSize: 12, lineHeight: 17 },

  saveBtn: {
    backgroundColor: E.gold,
    borderRadius:    14,
    paddingVertical: 14,
    alignItems:      'center',
    marginBottom:    20,
  },
  saveBtnText: { color: E.bg, fontSize: 15, fontWeight: '700' },

  infoBox: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    backgroundColor: E.goldTint,
    borderRadius:    12,
    padding:         14,
    borderWidth:     1,
    borderColor:     E.border,
  },
  infoText: { color: E.textSecondary, fontSize: 12, lineHeight: 18, flex: 1 },
});
