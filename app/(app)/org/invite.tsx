import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import { useAuthStore } from '../../../src/stores/authStore';

type InviteRole = 'admin' | 'manager' | 'member' | 'read_only';

const ROLES: { value: InviteRole; label: string; desc: string }[] = [
  { value: 'admin',    label: 'Admin',     desc: 'Can manage members and all contacts' },
  { value: 'manager',  label: 'Manager',   desc: 'Can share and edit contacts' },
  { value: 'member',   label: 'Member',    desc: 'Can add contacts and see shared ones' },
  { value: 'read_only',label: 'Read Only', desc: 'Can only view shared contacts' },
];

export default function InviteScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const org      = useQuery(api.organizations.getMyOrg, user ? { userId: user._id } : 'skip');
  const invite   = useMutation(api.organizations.inviteByEmail);

  const [email,  setEmail]  = useState('');
  const [role,   setRole]   = useState<InviteRole>('member');
  const [saving, setSaving] = useState(false);

  const handleInvite = async () => {
    if (!org || !email.trim()) return;
    setSaving(true);
    try {
      await invite({
        organizationId: org._id,
        email:          email.trim().toLowerCase(),
        role,
      });
      Alert.alert(
        'Member Added',
        `${email.trim()} has been added to ${org.name} as ${role}.`,
        [{ text: 'Done', onPress: () => router.back() }],
      );
    } catch (err: unknown) {
      Alert.alert('Invite Failed', err instanceof Error ? err.message : 'Could not add member.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="text-slate-50 text-lg font-bold">Invite Member</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Input
          label="Email Address *"
          value={email}
          onChangeText={setEmail}
          placeholder="colleague@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoFocus
        />

        <Text className="text-slate-400 text-xs uppercase tracking-widest mb-3 mt-2">Role</Text>
        {ROLES.map(({ value, label, desc }) => (
          <TouchableOpacity
            key={value}
            onPress={() => setRole(value)}
            className={`flex-row items-center p-4 rounded-2xl mb-3 border ${
              role === value
                ? 'border-primary-500 bg-primary-900/30'
                : 'border-surface-700 bg-surface-800'
            }`}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 mr-4 items-center justify-center ${
                role === value ? 'border-primary-500' : 'border-slate-500'
              }`}
            >
              {role === value && (
                <View className="w-2.5 h-2.5 bg-primary-500 rounded-full" />
              )}
            </View>
            <View className="flex-1">
              <Text className="text-slate-200 text-sm font-medium">{label}</Text>
              <Text className="text-slate-500 text-xs mt-0.5">{desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        <Button
          label="Send Invitation"
          fullWidth
          loading={saving}
          disabled={!email.trim() || !email.includes('@')}
          onPress={handleInvite}
          className="mt-4"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

