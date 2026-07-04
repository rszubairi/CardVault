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
import { useAppTheme } from '../../../src/theme/useAppTheme';

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
  const theme    = useAppTheme();
  const org      = useQuery(api.organizations.getMyOrg, user ? { userId: user._id } : 'skip');
  const createInvite = useMutation(api.organizations.createInvite);

  const [email,  setEmail]  = useState('');
  const [role,   setRole]   = useState<InviteRole>('member');
  const [saving, setSaving] = useState(false);

  const handleInvite = async () => {
    if (!org || !user || !email.trim()) return;
    setSaving(true);
    try {
      const result = await createInvite({
        organizationId: org._id,
        actorUserId:    user._id,
        personalEmail:  email.trim().toLowerCase(),
        role,
      });
      Alert.alert(
        'Invitation Sent',
        `An invite has been created for ${email.trim()}.\n\nInvite Code: ${result.inviteCode}\n\nShare this code with them so they can accept the invitation in the app.`,
        [{ text: 'Done', onPress: () => router.back() }],
      );
    } catch (err: unknown) {
      Alert.alert('Invite Failed', err instanceof Error ? err.message : 'Could not add member.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700' }}>Invite Member</Text>
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

        <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, marginTop: 8 }}>Role</Text>
        {ROLES.map(({ value, label, desc }) => (
          <TouchableOpacity
            key={value}
            onPress={() => setRole(value)}
            style={[
              { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1 },
              role === value
                ? { borderColor: theme.accent, backgroundColor: theme.accentFaint }
                : { borderColor: theme.border, backgroundColor: theme.surface },
            ]}
          >
            <View
              style={[
                { width: 20, height: 20, borderRadius: 10, borderWidth: 2, marginRight: 16, alignItems: 'center', justifyContent: 'center' },
                { borderColor: role === value ? theme.accent : theme.textMuted },
              ]}
            >
              {role === value && (
                <View style={{ width: 10, height: 10, backgroundColor: theme.accent, borderRadius: 5 }} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '500' }}>{label}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{desc}</Text>
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

