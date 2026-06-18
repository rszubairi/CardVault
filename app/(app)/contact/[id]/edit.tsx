import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import Input from '../../../../src/components/ui/Input';
import Button from '../../../../src/components/ui/Button';
import { pushContactToDevice } from '../../../../src/lib/deviceContacts';

export default function EditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const contact = useQuery(api.contacts.getById, { contactId: id as Id<'contacts'> });
  const updateContact = useMutation(api.contacts.update);
  const removeContact = useMutation(api.contacts.remove);

  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Initialise once contact loads; keep local state for edits
  const [fields, setFields] = useState<{
    firstName:   string;
    lastName:    string;
    designation: string;
    company:     string;
    email:       string;
    phone:       string;
    mobile:      string;
    website:     string;
    linkedinUrl: string;
    address:     string;
  } | null>(null);

  // Populate fields the first time contact data arrives
  if (contact && !fields) {
    setFields({
      firstName:   contact.firstName   ?? '',
      lastName:    contact.lastName    ?? '',
      designation: contact.designation ?? '',
      company:     contact.company     ?? '',
      email:       contact.email       ?? '',
      phone:       contact.phone       ?? '',
      mobile:      contact.mobile      ?? '',
      website:     contact.website     ?? '',
      linkedinUrl: contact.linkedinUrl ?? '',
      address:     contact.address     ?? '',
    });
  }

  const handleSave = async () => {
    if (!fields?.firstName.trim()) {
      Alert.alert('Missing Name', 'Please enter at least a first name.');
      return;
    }
    setSaving(true);
    try {
      await updateContact({
        contactId:   id as Id<'contacts'>,
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
      });

      // Silently keep device contact in sync (no-op if not previously pushed)
      pushContactToDevice({
        _id:         id,
        firstName:   fields.firstName,
        lastName:    fields.lastName,
        designation: fields.designation || undefined,
        company:     fields.company     || undefined,
        email:       fields.email       || undefined,
        phone:       fields.phone       || undefined,
        mobile:      fields.mobile      || undefined,
        website:     fields.website     || undefined,
        address:     fields.address     || undefined,
      });

      router.back();
    } catch {
      Alert.alert('Error', 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact?.firstName} ${contact?.lastName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await removeContact({ contactId: id as Id<'contacts'> });
              router.replace('/(app)/(tabs)/contacts');
            } catch {
              Alert.alert('Error', 'Could not delete contact.');
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (!contact || !fields) {
    return (
      <SafeAreaView className="flex-1 bg-surface-900 items-center justify-center">
        <Text className="text-slate-400">Loading...</Text>
      </SafeAreaView>
    );
  }

  const f = (key: keyof typeof fields) => ({
    value:        fields[key],
    onChangeText: (t: string) => setFields((p) => p ? { ...p, [key]: t } : p),
  });

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="close" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="text-slate-50 text-lg font-bold flex-1">Edit Contact</Text>
        <TouchableOpacity onPress={handleDelete} disabled={deleting}>
          <Ionicons name="trash-outline" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="flex-row gap-3">
          <View className="flex-1"><Input label="First Name *" placeholder="John" {...f('firstName')} /></View>
          <View className="flex-1"><Input label="Last Name"    placeholder="Doe"  {...f('lastName')} /></View>
        </View>
        <Input label="Job Title"  placeholder="CEO, Engineer..."    {...f('designation')} />
        <Input label="Company"    placeholder="Acme Corp"           {...f('company')} />
        <Input label="Email"      placeholder="john@example.com"    keyboardType="email-address" autoCapitalize="none" {...f('email')} />
        <Input label="Phone"      placeholder="+60 12 345 6789"     keyboardType="phone-pad"     {...f('phone')} />
        <Input label="Mobile"     placeholder="+60 12 345 6789"     keyboardType="phone-pad"     {...f('mobile')} />
        <Input label="Website"    placeholder="https://example.com" keyboardType="url" autoCapitalize="none" {...f('website')} />
        <Input label="LinkedIn"   placeholder="linkedin.com/in/..."  autoCapitalize="none" {...f('linkedinUrl')} />
        <Input label="Address"    placeholder="123 Main St, City"   multiline numberOfLines={2} {...f('address')} />

        <Button label="Save Changes" fullWidth loading={saving} onPress={handleSave} className="mt-4" />
        <Button label="Cancel" variant="ghost" fullWidth onPress={() => router.back()} className="mt-2" />

        <View className="mt-6 border-t border-surface-800 pt-6">
          <Button
            label={deleting ? 'Deleting...' : 'Delete Contact'}
            variant="danger"
            fullWidth
            onPress={handleDelete}
            disabled={deleting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
