import React, { useEffect, useRef, useState } from 'react';
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
import { useMutation, useAction, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { extractFromImage } from '../../../src/lib/ocr';
import { OcrResult } from '../../../src/types';
import { pushContactToDevice } from '../../../src/lib/deviceContacts';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import Input from '../../../src/components/ui/Input';
import Button from '../../../src/components/ui/Button';
import Card from '../../../src/components/ui/Card';
import { useAuthStore } from '../../../src/stores/authStore';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import EventPicker from '../../../src/components/EventPicker';
import { CalendarEvent } from '../../../src/lib/calendar';
import { useAppTheme } from '../../../src/theme/useAppTheme';

async function uploadImageToConvex(
  localUri: string,
  getUploadUrl: () => Promise<string>,
): Promise<string | undefined> {
  try {
    const uploadUrl = await getUploadUrl();
    const response  = await fetch(localUri);
    const blob      = await response.blob();
    const upload    = await fetch(uploadUrl, {
      method:  'POST',
      headers: { 'Content-Type': blob.type || 'image/jpeg' },
      body:    blob,
    });
    if (!upload.ok) return undefined;
    const { storageId } = await upload.json();
    return storageId as string;
  } catch {
    return undefined;
  }
}

export default function ScanResultScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  const router = useRouter();
  const theme = useAppTheme();
  const { user } = useAuthStore();
  const { incrementScanCount } = useSubscriptionStore();
  const { syncToPhone } = useSettingsStore();
  const createContact   = useMutation(api.contacts.create);
  const generateUploadUrl = useMutation(api.contacts.generateUploadUrl);

  const reviewOcr     = useAction(api.ocr.reviewExtraction);

  const [scanning, setScanning]           = useState(true);
  const [reviewing, setReviewing]         = useState(false);
  const [saving, setSaving]               = useState(false);
  const [ocr, setOcr]                     = useState<OcrResult | null>(null);
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const storageIdRef = useRef<string | undefined>(undefined);

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

  const duplicate = useQuery(
    api.contacts.findDuplicate,
    user && (fields.email || fields.phone)
      ? { userId: user._id, email: fields.email || undefined, phone: fields.phone || undefined }
      : 'skip',
  );

  useEffect(() => {
    if (!imageUri) return;

    // Reset all state immediately so previous scan's data never bleeds through
    setOcr(null);
    setScanning(true);
    setReviewing(false);
    storageIdRef.current = undefined;
    setFields({
      firstName: '', lastName: '', designation: '', company: '',
      email: '', phone: '', mobile: '', website: '', linkedinUrl: '', address: '',
    });

    // Upload runs in background — doesn't block the form from showing
    uploadImageToConvex(imageUri, generateUploadUrl)
      .then((storageId) => { storageIdRef.current = storageId; })
      .catch(() => { /* will retry at save time */ });

    // OCR extraction then AI review pass
    extractFromImage(imageUri)
      .then(async (result) => {
        setOcr(result);
        const initial = {
          firstName:   result.firstName   ?? '',
          lastName:    result.lastName    ?? '',
          designation: result.designation ?? '',
          company:     result.company     ?? '',
          email:       result.email       ?? '',
          phone:       result.phone       ?? '',
          mobile:      result.mobile      ?? '',
          website:     result.website     ?? '',
          linkedinUrl: result.linkedinUrl ?? '',
          address:     '',
        };
        setFields(initial);
        setScanning(false);
        setEventPickerOpen(true);

        // AI review runs in background after the form is already visible
        setReviewing(true);
        try {
          const corrections = await reviewOcr({
            rawText:     result.rawText,
            firstName:   result.firstName,
            lastName:    result.lastName,
            designation: result.designation,
            company:     result.company,
            email:       result.email,
            phone:       result.phone,
          });
          if (corrections && Object.keys(corrections).length > 0) {
            setFields((prev) => ({
              ...prev,
              ...(corrections.firstName  !== undefined ? { firstName:   corrections.firstName  ?? '' } : {}),
              ...(corrections.lastName   !== undefined ? { lastName:    corrections.lastName   ?? '' } : {}),
              ...(corrections.designation!== undefined ? { designation: corrections.designation ?? '' } : {}),
              ...(corrections.company    !== undefined ? { company:     corrections.company    ?? '' } : {}),
            }));
          }
        } catch {
          // Review failure is non-fatal; user sees original OCR values
        } finally {
          setReviewing(false);
        }
      })
      .catch(() => {
        Alert.alert('OCR Error', 'Could not extract text. Please fill in manually.');
        setScanning(false);
      });
  }, [imageUri, reviewOcr]);

  const handleSave = async () => {
    if (!user || !fields.firstName) {
      Alert.alert('Missing Name', 'Please enter at least a first name.');
      return;
    }

    if (duplicate) {
      const name = [duplicate.firstName, duplicate.lastName].filter(Boolean).join(' ');
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Possible Duplicate',
          `You already have a contact named "${name}" with the same ${fields.email && duplicate.email === fields.email ? 'email' : 'phone number'}.`,
          [
            { text: 'View Existing', style: 'cancel', onPress: () => {
              router.replace({ pathname: '/(app)/contact/[id]', params: { id: duplicate._id } });
              resolve(false);
            }},
            { text: 'Save Anyway', onPress: () => resolve(true) },
          ],
        );
      });
      if (!proceed) return;
    }

    setSaving(true);
    try {
      // If background upload hasn't finished yet, try once more at save time
      if (!storageIdRef.current && imageUri) {
        storageIdRef.current = await uploadImageToConvex(imageUri, generateUploadUrl)
          .catch(() => undefined);
      }

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
        cardImageFront: storageIdRef.current,
        metDate:      selectedEvent ? selectedEvent.startDate.getTime() : undefined,
        metLocation:  selectedEvent?.location,
        tags:         [],
        favorite:     false,
        source:       'scan',
        ocrConfidence:ocr?.confidence,
        isShared:     false,
      });

      incrementScanCount();

      if (syncToPhone) {
        pushContactToDevice({
          _id:         contactId,
          firstName:   fields.firstName,
          lastName:    fields.lastName,
          designation: fields.designation || undefined,
          company:     fields.company     || undefined,
          email:       fields.email       || undefined,
          phone:       fields.phone       || undefined,
          mobile:      fields.mobile      || undefined,
          website:     fields.website     || undefined,
        });
      }

      router.replace({ pathname: '/(app)/contact/[id]', params: { id: contactId } });
    } catch {
      Alert.alert('Save Failed', 'Could not save the contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700', flex: 1 }}>Review Card</Text>
        {ocr && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.success + '30', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
            <Ionicons name="checkmark-circle" size={14} color={theme.success} />
            <Text style={{ color: theme.success, fontSize: 12, marginLeft: 4 }}>{ocr.confidence}% match</Text>
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
            <ActivityIndicator color={theme.accent} size="large" />
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 12 }}>Extracting card information...</Text>
          </Card>
        )}

        {/* AI review in progress */}
        {reviewing && !scanning && (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.accentTint, borderWidth: 1, borderColor: theme.accent + '40', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }}>
            <ActivityIndicator color={theme.accent} size="small" />
            <Text style={{ color: theme.accent, fontSize: 12, marginLeft: 12 }}>AI reviewing extraction for errors...</Text>
          </View>
        )}

        {/* Duplicate warning */}
        {duplicate && !scanning && (
          <TouchableOpacity
            onPress={() => router.replace({ pathname: '/(app)/contact/[id]', params: { id: duplicate._id } })}
            style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.warning + '20', borderWidth: 1, borderColor: theme.warning + '40', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }}
          >
            <Ionicons name="warning-outline" size={18} color={theme.warning} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: theme.warning, fontSize: 12, fontWeight: '600' }}>Possible duplicate</Text>
              <Text style={{ color: theme.warning, opacity: 0.8, fontSize: 12, marginTop: 2 }}>
                {[duplicate.firstName, duplicate.lastName].filter(Boolean).join(' ')} already exists — tap to view
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={theme.warning} />
          </TouchableOpacity>
        )}

        {/* Edit Fields */}
        {!scanning && (
          <>
            <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>
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

            {/* Event badge */}
            <TouchableOpacity
              onPress={() => setEventPickerOpen(true)}
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surfaceAlt, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }}
            >
              <Ionicons name="location-outline" size={18} color={theme.accent} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: theme.textMuted, fontSize: 12 }}>Met at event</Text>
                <Text style={{ color: theme.textPrimary, fontSize: 14, marginTop: 2 }}>
                  {selectedEvent ? selectedEvent.title : 'Tap to select an event'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>

            <Button
              label="Save Contact"
              fullWidth
              loading={saving}
              onPress={handleSave}
              className="mt-2"
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

      <EventPicker
        visible={eventPickerOpen}
        onSelect={setSelectedEvent}
        onDismiss={() => setEventPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

