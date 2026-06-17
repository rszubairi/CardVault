import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import { useAuthStore } from '../../../src/stores/authStore';

export default function NewContactScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const createContact = useMutation(api.contacts.create);
  const [saving, setSaving] = useState(false);

  const [fields, setFields] = useState({
    firstName:   '',
    lastName:    '',
    designation: '',
    company:     '',
    email:       '',
    phone:       '',
    mobile:      '',
    website:     '',
    linkedinUrl: '',
    address:     '',
  });

  const handleSave = async () => {
    if (!user || !fields.firstName) {
      Alert.alert('Missing Name', 'Please enter at least a first name.');
      return;
    }
    setSaving(true);
    try {
      const contactId = await createContact({
        userId:      user._id,
        firstName:   fields.firstName,
        lastName:    fields.lastName,
        designation: fields.designation || undefined,
        company:     fields.company     || undefined,
        email:       fields.email       || undefined,
        phone:       fields.phone       || undefined,
        mobile:      fields.mobile      || undefined,
        website:     fields.website     || undefined,
        linkedinUrl: fields.linkedinUrl || undefined,
        address:     fields.address     || undefined,
        tags:        [],
        favorite:    false,
        source:      'manual',
        isShared:    false,
      });
      router.replace({
        pathname: '/(app)/contact/[id]',
        params:   { id: contactId },
      });
    } catch {
      Alert.alert('Error', 'Could not save contact.');
    } finally {
      setSaving(false);
    }
  };

  const f = (key: keyof typeof fields) => ({
    value:        fields[key],
    onChangeText: (t: string) => setFields((p) => ({ ...p, [key]: t })),
  });

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="close" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="text-slate-50 text-lg font-bold flex-1">Add Contact</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="flex-row gap-3">
          <View className="flex-1"><Input label="First Name *" placeholder="John" {...f('firstName')} /></View>
          <View className="flex-1"><Input label="Last Name" placeholder="Doe" {...f('lastName')} /></View>
        </View>
        <Input label="Job Title"   placeholder="CEO, Engineer..." {...f('designation')} />
        <Input label="Company"     placeholder="Acme Corp"       {...f('company')} />
        <Input label="Email"       placeholder="john@example.com" keyboardType="email-address" autoCapitalize="none" {...f('email')} />
        <Input label="Phone"       placeholder="+60 12 345 6789"  keyboardType="phone-pad"    {...f('phone')} />
        <Input label="Website"     placeholder="https://example.com" keyboardType="url" autoCapitalize="none" {...f('website')} />
        <Input label="LinkedIn"    placeholder="linkedin.com/in/..."  autoCapitalize="none" {...f('linkedinUrl')} />
        <Input label="Address"     placeholder="123 Main St, City"    multiline numberOfLines={2} {...f('address')} />

        <Button label="Save Contact" fullWidth loading={saving} onPress={handleSave} className="mt-4" />
        <Button label="Cancel" variant="ghost" fullWidth onPress={() => router.back()} className="mt-2" />
      </ScrollView>
    </SafeAreaView>
  );
}

