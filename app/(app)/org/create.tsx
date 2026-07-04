import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import { useAuthStore } from '../../../src/stores/authStore';
import { useAppTheme } from '../../../src/theme/useAppTheme';

export default function CreateOrgScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const theme    = useAppTheme();
  const createOrg = useMutation(api.organizations.create);

  const [name,         setName]         = useState('');
  const [billingEmail, setBillingEmail] = useState(user?.email ?? '');
  const [saving,       setSaving]       = useState(false);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;
    if (!billingEmail.trim() || !billingEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid billing email address.');
      return;
    }
    setSaving(true);
    try {
      await createOrg({
        userId:       user._id,
        name:         name.trim(),
        billingEmail: billingEmail.trim(),
      });
      router.replace('/(app)/org/');
    } catch (err: unknown) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Could not create organization.');
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
        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700' }}>Create Organization</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={{ padding: 16, marginBottom: 24, borderRadius: 12, borderWidth: 1, borderColor: theme.accent + '40', backgroundColor: theme.accentFaint }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="information-circle-outline" size={18} color={theme.accent} />
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginLeft: 8, flex: 1, lineHeight: 20 }}>
              Creating an organization enables your team to share contacts, collaborate on
              follow-ups, and access a shared CRM. You'll start with a 14-day Enterprise trial.
            </Text>
          </View>
        </View>

        <Input
          label="Organization Name *"
          value={name}
          onChangeText={setName}
          placeholder="Acme Corporation"
          autoFocus
        />
        <Input
          label="Billing Email *"
          value={billingEmail}
          onChangeText={setBillingEmail}
          placeholder="billing@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          label="Create Organization"
          fullWidth
          loading={saving}
          disabled={!name.trim() || !billingEmail.trim()}
          onPress={handleCreate}
          className="mt-4"
        />
        <Button
          label="Cancel"
          variant="ghost"
          fullWidth
          onPress={() => router.back()}
          className="mt-2"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

