import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuthStore } from '../../../src/stores/authStore';
import { Id } from '../../../convex/_generated/dataModel';
import { E } from '../../constants/theme';

const ROLES = ['admin', 'manager', 'member', 'read_only'] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABELS: Record<Role | 'owner', string> = {
  owner:     'Owner',
  admin:     'Admin',
  manager:   'Manager',
  member:    'Member',
  read_only: 'Read Only',
};

interface Props {
  organizationId: Id<'organizations'>;
  myRole: string;
}

export default function MembersScreen({ organizationId, myRole }: Props) {
  const { user } = useAuthStore();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole]   = useState<Role>('member');
  const [inviting, setInviting]       = useState(false);
  const [showInvite, setShowInvite]   = useState(false);

  const members    = useQuery(api.organizations.listMembers, { organizationId });
  const inviteMut  = useMutation(api.organizations.inviteByEmail);
  const removeMut  = useMutation(api.organizations.removeMember);
  const updateRole = useMutation(api.organizations.updateRole);

  const isAdmin = ['owner', 'admin'].includes(myRole);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user) return;
    setInviting(true);
    try {
      await inviteMut({
        organizationId,
        actorUserId: user._id as Id<'users'>,
        email:       inviteEmail.trim().toLowerCase(),
        role:        inviteRole,
      });
      setInviteEmail('');
      setShowInvite(false);
      Alert.alert('Invited', `${inviteEmail} has been added to the team.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = (membershipId: Id<'organizationUsers'>, name: string) => {
    Alert.alert(
      'Remove Member',
      `Remove ${name} from the organization? Their enterprise contacts will be deleted from their device.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMut({ membershipId, actorUserId: user!._id as Id<'users'> });
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ],
    );
  };

  const handleRoleChange = (membershipId: Id<'organizationUsers'>) => {
    if (!isAdmin) return;
    Alert.alert(
      'Change Role',
      'Select new role',
      [
        ...ROLES.map((r) => ({
          text: ROLE_LABELS[r],
          onPress: () =>
            updateRole({ membershipId, actorUserId: user!._id as Id<'users'>, role: r }).catch(
              (e) => Alert.alert('Error', e.message),
            ),
        })),
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  if (!members) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={E.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Members</Text>
        <Text style={styles.subtitle}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>
        {isAdmin && (
          <TouchableOpacity style={styles.inviteBtn} onPress={() => setShowInvite(!showInvite)}>
            <Ionicons name="person-add-outline" size={15} color={E.gold} />
            <Text style={styles.inviteBtnText}>Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      {showInvite && (
        <View style={styles.invitePanel}>
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={E.textMuted}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleChip, inviteRole === r && styles.roleChipActive]}
                onPress={() => setInviteRole(r)}
              >
                <Text style={[styles.roleChipText, inviteRole === r && styles.roleChipTextActive]}>
                  {ROLE_LABELS[r]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, inviting && { opacity: 0.6 }]}
            onPress={handleInvite}
            disabled={inviting}
          >
            {inviting ? (
              <ActivityIndicator color={E.bg} size="small" />
            ) : (
              <Text style={styles.sendBtnText}>Send Invite</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={members}
        keyExtractor={(m) => m.membershipId}
        contentContainerStyle={styles.list}
        renderItem={({ item: m }) => {
          const roleColor = E.roleColors[m.role as keyof typeof E.roleColors] ?? E.textMuted;
          return (
            <View style={styles.memberRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(m.name?.[0] ?? '?').toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{m.name}</Text>
                <Text style={styles.memberEmail}>{m.email}</Text>
              </View>
              <TouchableOpacity
                style={[styles.roleBadge, { backgroundColor: `${roleColor}18` }]}
                onPress={() => handleRoleChange(m.membershipId as Id<'organizationUsers'>)}
                disabled={!isAdmin || m.role === 'owner'}
              >
                <Text style={[styles.roleBadgeText, { color: roleColor }]}>
                  {ROLE_LABELS[m.role as Role | 'owner']}
                </Text>
                {isAdmin && m.role !== 'owner' && (
                  <Ionicons name="chevron-down" size={10} color={roleColor} style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>
              {isAdmin && m.role !== 'owner' && m.userId !== user?._id && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(m.membershipId as Id<'organizationUsers'>, m.name)}
                >
                  <Ionicons name="close-circle-outline" size={20} color={E.error} />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: E.bg },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: 20,
    paddingTop:        20,
    paddingBottom:     16,
    flexDirection:     'row',
    alignItems:        'center',
    flexWrap:          'wrap',
    gap:               8,
  },
  title:    { fontSize: 20, fontWeight: '700', color: E.textPrimary, flex: 1 },
  subtitle: { fontSize: 13, color: E.textMuted },

  inviteBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   E.goldTint,
    borderRadius:      20,
    paddingVertical:   6,
    paddingHorizontal: 14,
    borderWidth:       1,
    borderColor:       E.border,
    gap: 5,
  },
  inviteBtnText: { color: E.gold, fontSize: 13, fontWeight: '600' },

  invitePanel: {
    marginHorizontal: 20,
    marginBottom:     16,
    backgroundColor:  E.surface,
    borderRadius:     14,
    padding:          16,
    gap:              12,
    borderWidth:      1,
    borderColor:      E.border,
  },
  input: {
    backgroundColor:   E.bg,
    borderRadius:      10,
    paddingHorizontal: 14,
    paddingVertical:   10,
    color:             E.textPrimary,
    fontSize:          14,
    borderWidth:       1,
    borderColor:       E.border,
  },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      20,
    backgroundColor:   E.bg,
    borderWidth:       1,
    borderColor:       E.border,
  },
  roleChipActive:     { backgroundColor: E.gold, borderColor: E.gold },
  roleChipText:       { color: E.textMuted, fontSize: 12 },
  roleChipTextActive: { color: E.bg, fontWeight: '700' },

  sendBtn: {
    backgroundColor: E.gold,
    borderRadius:    10,
    paddingVertical: 12,
    alignItems:      'center',
  },
  sendBtnText: { color: E.bg, fontWeight: '700', fontSize: 14 },

  list:      { paddingHorizontal: 20, paddingBottom: 40 },
  memberRow: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   12,
    borderBottomWidth: 1,
    borderBottomColor: E.borderSub,
    gap:               10,
  },
  avatar: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: E.surfaceAlt,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     E.border,
  },
  avatarText:  { color: E.gold, fontSize: 16, fontWeight: '700' },
  memberInfo:  { flex: 1 },
  memberName:  { color: E.textPrimary, fontSize: 14, fontWeight: '600' },
  memberEmail: { color: E.textMuted, fontSize: 12, marginTop: 2 },

  roleBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:      20,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '600' },
  removeBtn:     { padding: 4 },
});
