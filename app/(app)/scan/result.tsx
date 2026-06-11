import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { extractFromImage } from '../../../src/lib/ocr';
import { OcrResult } from '../../../src/types';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import { useAuthStore } from '../../../src/stores/authStore';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';

export default function ScanResultScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { incrementScanCount } = useSubscriptionStore();
  const createContact = useMutation(api.contacts.create);

  const [scanning, setScanning] = useState(true);
  const [saving, setSaving]     = useState(false);
  const [ocr, setOcr]           = useState<OcrResult | null>(null);

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

  useEffect(() => {
    if (!imageUri) return;

    extractFromImage(imageUri)
      .then((result) => {
        setOcr(result);
        setFields({
          firstName:   result.firstName  ?? '',
          lastName:    result.lastName   ?? '',
          designation: result.designation ?? '',
          company:     result.company    ?? '',
          email:       result.email      ?? '',
          phone:       result.phone      ?? '',
          mobile:      result.mobile     ?? '',
          website:     result.website    ?? '',
          linkedinUrl: result.linkedinUrl ?? '',
          address:     '',
        });
      })
      .catch(() => Alert.alert('OCR Error', 'Could not extract text. Please fill in manually.'))
      .finally(() => setScanning(false));
  }, [imageUri]);

  const handleSave = async () => {
    if (!user || !fields.firstName) {
      Alert.alert('Missing Name', 'Please enter at least a first name.');
      return;
    }
    setSaving(true);
    try {
      const contactId = await createContact({
        userId:       user._id,
        firstName:    fields.firstName,
        lastName:     fields.lastName,
        designation:  fields.designation || undefined,
        company:      fields.company     || undefined,
        email:        fields.email       || undefined,
        phone:        fields.phone       || undefined,
        mobile:       fields.mobile      || undefined,
        website:      fields.website     || undefined,
        linkedinUrl:  fields.linkedinUrl || undefined,
        companyDomain:ocr?.companyDomain,
        country:      ocr?.country,
        cardImageFront: imageUri,
        tags:         [],
        favorite:     false,
        source:       'scan',
        ocrConfidence:ocr?.confidence,
        isShared:     false,
      });

      incrementScanCount();

      router.replace({
        pathname: '/(app)/contact/[id]',
        params:   { id: contactId },
      });
    } catch {
      Alert.alert('Save Failed', 'Could not save the contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="text-slate-50 text-lg font-bold flex-1">Review Card</Text>
        {ocr && (
          <View className="flex-row items-center bg-emerald-900/50 px-3 py-1 rounded-full">
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text className="text-emerald-400 text-xs ml-1">{ocr.confidence}% match</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Card Image */}
        {imageUri && (
          <Card className="mb-6 overflow-hidden">
            <Image
              source={{ uri: imageUri }}
              className="w-full h-48"
              resizeMode="cover"
            />
          </Card>
        )}

        {/* OCR Loading */}
        {scanning && (
          <Card className="p-6 items-center mb-6">
            <ActivityIndicator color="#6366F1" size="large" />
            <Text className="text-slate-300 text-sm mt-3">Extracting card information...</Text>
          </Card>
        )}

        {/* Edit Fields */}
        {!scanning && (
          <>
            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-4">
              Contact Details
            </Text>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="First Name *"
                  value={fields.firstName}
                  onChangeText={(t) => setFields((p) => ({ ...p, firstName: t }))}
                  placeholder="John"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Last Name"
                  value={fields.lastName}
                  onChangeText={(t) => setFields((p) => ({ ...p, lastName: t }))}
                  placeholder="Doe"
                />
              </View>
            </View>

            <Input
              label="Job Title"
              value={fields.designation}
              onChangeText={(t) => setFields((p) => ({ ...p, designation: t }))}
              placeholder="CEO, Software Engineer..."
            />
            <Input
              label="Company"
              value={fields.company}
              onChangeText={(t) => setFields((p) => ({ ...p, company: t }))}
              placeholder="Acme Corp"
            />
            <Input
              label="Email"
              value={fields.email}
              onChangeText={(t) => setFields((p) => ({ ...p, email: t }))}
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              label="Phone"
              value={fields.phone}
              onChangeText={(t) => setFields((p) => ({ ...p, phone: t }))}
              placeholder="+60 12 345 6789"
              keyboardType="phone-pad"
            />
            <Input
              label="Website"
              value={fields.website}
              onChangeText={(t) => setFields((p) => ({ ...p, website: t }))}
              placeholder="https://example.com"
              keyboardType="url"
              autoCapitalize="none"
            />
            <Input
              label="LinkedIn URL"
              value={fields.linkedinUrl}
              onChangeText={(t) => setFields((p) => ({ ...p, linkedinUrl: t }))}
              placeholder="https://linkedin.com/in/..."
              autoCapitalize="none"
            />

            <Button
              label="Save Contact"
              fullWidth
              loading={saving}
              onPress={handleSave}
              className="mt-4"
            />
            <Button
              label="Discard"
              variant="ghost"
              fullWidth
              onPress={() => router.replace('/(app)/(tabs)/scan')}
              className="mt-2"
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
