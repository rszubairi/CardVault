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

export default function CreateOrgScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();
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
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="text-slate-50 text-lg font-bold">Create Organization</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Card className="p-4 mb-6 border border-primary-700/30 bg-primary-900/20">
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={18} color="#6366F1" />
            <Text className="text-slate-400 text-sm ml-2 flex-1 leading-5">
              Creating an organization enables your team to share contacts, collaborate on
              follow-ups, and access a shared CRM. You'll start with a 14-day Enterprise trial.
            </Text>
          </View>
        </Card>

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

