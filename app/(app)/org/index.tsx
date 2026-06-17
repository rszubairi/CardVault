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
      <SafeAreaView className="flex-1 bg-surface-900 items-center justify-center">
        <ActivityIndicator color="#6366F1" />
      </SafeAreaView>
    );
  }

  if (org === null) {
    return (
      <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#94A3B8" />
          </TouchableOpacity>
          <Text className="text-slate-50 text-lg font-bold">Organization</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-primary-900/40 rounded-3xl items-center justify-center mb-5">
            <Ionicons name="business-outline" size={40} color="#6366F1" />
          </View>
          <Text className="text-slate-50 text-xl font-bold mb-2 text-center">
            No Organization Yet
          </Text>
          <Text className="text-slate-400 text-sm text-center mb-8 leading-6">
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
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="flex-1 text-slate-50 text-lg font-bold">{org.name}</Text>
        <Badge label={ROLE_LABELS[org.myRole] ?? 'Member'} variant={ROLE_COLORS[org.myRole] ?? 'neutral'} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Stats */}
        <View className="flex-row gap-3 mb-6">
          <Card className="flex-1 p-4 items-center">
            <Text className="text-slate-50 text-2xl font-bold">{members?.length ?? 0}</Text>
            <Text className="text-slate-400 text-xs mt-1">Members</Text>
          </Card>
          <Card className="flex-1 p-4 items-center">
            <Text className="text-slate-50 text-2xl font-bold">
              {duplicates ? duplicates.length : 'â€“'}
            </Text>
            <Text className="text-slate-400 text-xs mt-1">Duplicates</Text>
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
            <Text className="text-slate-400 text-xs mt-1 leading-5">
              Multiple team members have contacts with the same email address.
            </Text>
          </Card>
        )}

        {/* Members */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-slate-400 text-xs uppercase tracking-widest font-semibold">
            Members
          </Text>
          {isOwnerOrAdmin && (
            <TouchableOpacity onPress={() => router.push('/(app)/org/invite')}>
              <View className="flex-row items-center gap-1">
                <Ionicons name="add" size={18} color="#6366F1" />
                <Text className="text-primary-400 text-sm">Invite</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {members === undefined && <ActivityIndicator color="#6366F1" />}

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
                <View className="w-10 h-10 bg-primary-800 rounded-full items-center justify-center mr-3">
                  <Text className="text-primary-200 text-sm font-bold">{initials || '?'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-slate-200 text-sm font-medium">
                    {member.name} {isSelf ? '(you)' : ''}
                  </Text>
                  <Text className="text-slate-500 text-xs mt-0.5">{member.email}</Text>
                </View>
                <Badge
                  label={ROLE_LABELS[member.role] ?? member.role}
                  variant={ROLE_COLORS[member.role] ?? 'neutral'}
                />
              </View>

              {(isOwnerOrAdmin && !isSelf && member.role !== 'owner') && (
                <View className="flex-row gap-2 mt-3 pt-3 border-t border-surface-700">
                  {(['admin', 'manager', 'member', 'read_only'] as const)
                    .filter((r) => r !== member.role)
                    .map((r) => (
                      <TouchableOpacity
                        key={r}
                        onPress={() =>
                          updateRole({ membershipId: member.membershipId as any, role: r })
                        }
                        className="bg-surface-700 px-2.5 py-1 rounded-full"
                      >
                        <Text className="text-slate-400 text-xs">â†’ {ROLE_LABELS[r]}</Text>
                      </TouchableOpacity>
                    ))}
                  <TouchableOpacity
                    onPress={() => handleRemove(member.membershipId, member.name, false)}
                    className="ml-auto"
                  >
                    <Ionicons name="remove-circle-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}

              {isSelf && (
                <TouchableOpacity
                  onPress={() => handleRemove(member.membershipId, member.name, true)}
                  className="mt-2"
                >
                  <Text className="text-red-400 text-xs text-right">Leave organization</Text>
                </TouchableOpacity>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

