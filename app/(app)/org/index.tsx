import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Card from '../../../src/components/ui/Card';
import Badge from '../../../src/components/ui/Badge';
import Button from '../../../src/components/ui/Button';
import { useAuthStore } from '../../../src/stores/authStore';
import { useAppTheme } from '../../../src/theme/useAppTheme';

const ROLE_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'neutral' | 'error'> = {
  owner:    'primary',
  admin:    'warning',
  manager:  'success',
  member:   'neutral',
  read_only:'neutral',
};

const ROLE_LABELS: Record<string, string> = {
  owner:    'Owner',
  admin:    'Admin',
  manager:  'Manager',
  member:   'Member',
  read_only:'Read Only',
};

export default function OrgScreen() {
  const router    = useRouter();
  const { user }  = useAuthStore();
  const theme     = useAppTheme();
  const org       = useQuery(api.organizations.getMyOrg, user ? { userId: user._id } : 'skip');
  const members   = useQuery(
    api.organizations.listMembers,
    org ? { organizationId: org._id } : 'skip',
  );
  const duplicates = useQuery(
    api.contacts.detectDuplicates,
    org ? { organizationId: org._id } : 'skip',
  );
  const removeMember = useMutation(api.organizations.removeMember);
  const updateRole   = useMutation(api.organizations.updateRole);

  const isOwnerOrAdmin = org?.myRole === 'owner' || org?.myRole === 'admin';

  if (org === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  if (org === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700' }}>Organization</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 80, height: 80, backgroundColor: theme.accentFaint, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Ionicons name="business-outline" size={40} color={theme.accent} />
          </View>
          <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
            No Organization Yet
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
            Create an organization to share contacts with your team, collaborate on follow-ups,
            and manage your business network together.
          </Text>
          <Button
            label="Create Organization"
            fullWidth
            onPress={() => router.push('/(app)/org/create')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleRemove = (membershipId: string, name: string, isSelf: boolean) => {
    if (isSelf) {
      Alert.alert('Leave Organization', 'Are you sure you want to leave this organization?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => removeMember({ membershipId: membershipId as any }),
        },
      ]);
    } else if (isOwnerOrAdmin) {
      Alert.alert(`Remove ${name}`, 'Remove this member from the organization?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeMember({ membershipId: membershipId as any }),
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, color: theme.textPrimary, fontSize: 18, fontWeight: '700' }}>{org.name}</Text>
        <Badge label={ROLE_LABELS[org.myRole] ?? 'Member'} variant={ROLE_COLORS[org.myRole] ?? 'neutral'} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Stats */}
        <View className="flex-row gap-3 mb-6">
          <Card className="flex-1 p-4 items-center">
            <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: '700' }}>{members?.length ?? 0}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>Members</Text>
          </Card>
          <Card className="flex-1 p-4 items-center">
            <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: '700' }}>
              {duplicates ? duplicates.length : '-'}
            </Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>Duplicates</Text>
          </Card>
        </View>

        {/* Duplicate warning */}
        {duplicates && duplicates.length > 0 && (
          <Card className="p-4 mb-6 border border-amber-700/50 bg-amber-900/20">
            <View className="flex-row items-center">
              <Ionicons name="warning-outline" size={18} color="#FBBF24" />
              <Text className="text-amber-400 text-sm font-semibold ml-2">
                {duplicates.length} duplicate contact{duplicates.length > 1 ? 's' : ''} detected
              </Text>
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 4, lineHeight: 20 }}>
              Multiple team members have contacts with the same email address.
            </Text>
          </Card>
        )}

        {/* Members */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600' }}>
            Members
          </Text>
          {isOwnerOrAdmin && (
            <TouchableOpacity onPress={() => router.push('/(app)/org/invite')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="add" size={18} color={theme.accent} />
                <Text style={{ color: theme.accent, fontSize: 14 }}>Invite</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {members === undefined && <ActivityIndicator color={theme.accent} />}

        {members?.map((member) => {
          const isSelf = member.userId === user?._id;
          const initials = member.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <Card key={member.membershipId} className="p-4 mb-3">
              <View className="flex-row items-center">
                <View style={{ width: 40, height: 40, backgroundColor: theme.accentFaint, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '700' }}>{initials || '?'}</Text>
                </View>
                <View className="flex-1">
                  <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '500' }}>
                    {member.name} {isSelf ? '(you)' : ''}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{member.email}</Text>
                </View>
                <Badge
                  label={ROLE_LABELS[member.role] ?? member.role}
                  variant={ROLE_COLORS[member.role] ?? 'neutral'}
                />
              </View>

              {(isOwnerOrAdmin && !isSelf && member.role !== 'owner') && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
                  {(['admin', 'manager', 'member', 'read_only'] as const)
                    .filter((r) => r !== member.role)
                    .map((r) => (
                      <TouchableOpacity
                        key={r}
                        onPress={() =>
                          updateRole({ membershipId: member.membershipId as any, role: r })
                        }
                        style={{ backgroundColor: theme.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}
                      >
                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>→ {ROLE_LABELS[r]}</Text>
                      </TouchableOpacity>
                    ))}
                  <TouchableOpacity
                    onPress={() => handleRemove(member.membershipId, member.name, false)}
                    style={{ marginLeft: 'auto' }}
                  >
                    <Ionicons name="remove-circle-outline" size={20} color={theme.error} />
                  </TouchableOpacity>
                </View>
              )}

              {isSelf && (
                <TouchableOpacity
                  onPress={() => handleRemove(member.membershipId, member.name, true)}
                  style={{ marginTop: 8 }}
                >
                  <Text style={{ color: theme.error, fontSize: 12, textAlign: 'right' }}>Leave organization</Text>
                </TouchableOpacity>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
