import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import Card from '../../../src/components/ui/Card';
import Badge from '../../../src/components/ui/Badge';
import Button from '../../../src/components/ui/Button';
import WhatsAppModal from '../../../src/components/WhatsAppModal';
import { useAuthStore } from '../../../src/stores/authStore';
import { useAppTheme } from '../../../src/theme/useAppTheme';
import type { AppTheme } from '../../../src/theme/useAppTheme';

const TAGS_PRESET = [
  'Investor', 'Healthcare', 'VC', 'AI', 'Government',
  'Potential Client', 'Partner', 'Media', 'Startup', 'Enterprise',
];

function InfoRow({
  icon,
  label,
  value,
  onPress,
  theme,
}: {
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
  theme: AppTheme;
}) {
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons name={icon as any} size={18} color={theme.accent} style={{ marginTop: 2, marginRight: 16 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 2 }}>{label}</Text>
        <Text style={{ color: theme.textPrimary, fontSize: 14 }}>{value}</Text>
      </View>
      {onPress && <Ionicons name="open-outline" size={14} color={theme.textMuted} />}
    </TouchableOpacity>
  );
}

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const theme = useAppTheme();
  const contact    = useQuery(api.contacts.getById, { contactId: id as Id<'contacts'> });
  const notes      = useQuery(api.notes.list, { contactId: id as Id<'contacts'> });
  const cardImageUrl = useQuery(
    api.contacts.getStorageUrl,
    contact?.cardImageFront ? { storageId: contact.cardImageFront } : 'skip',
  );
  const logInteraction = useMutation(api.interactions.log);
  const toggleFav      = useMutation(api.contacts.toggleFavorite);

  const setFollowUpDate       = useMutation(api.contacts.setFollowUpDate);
  const shareWithOrg          = useMutation(api.contacts.shareWithOrg);
  const unshareFromOrg        = useMutation(api.contacts.unshareFromOrg);
  const recalcScore           = useMutation(api.contacts.recalculateRelationshipScore);
  const myOrg = useQuery(api.organizations.getMyOrg, contact ? { userId: contact.userId } : 'skip');

  const [tagsExpanded,    setTagsExpanded]   = useState(false);
  const [whatsappOpen,    setWhatsappOpen]   = useState(false);
  const [followUpModal,   setFollowUpModal]  = useState(false);
  const [followUpText,    setFollowUpText]   = useState('');
  const { user } = useAuthStore();

  if (!contact) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="person-circle-outline" size={52} color={theme.textMuted} />
        <Text style={{ color: theme.textSecondary, fontSize: 16, marginTop: 12 }}>Contact not found</Text>
      </SafeAreaView>
    );
  }

  const initials = `${contact.firstName?.[0] ?? ''}${contact.lastName?.[0] ?? ''}`.toUpperCase();
  const fullName  = `${contact.firstName} ${contact.lastName}`.trim();

  const openWhatsApp = () => {
    if (!contact.phone && !contact.mobile) return;
    setWhatsappOpen(true);
  };

  const openLinkedIn = () => {
    if (contact.linkedinUrl) {
      Linking.openURL(contact.linkedinUrl);
    } else {
      const query = encodeURIComponent(`${fullName} ${contact.company ?? ''}`);
      Linking.openURL(`https://www.linkedin.com/search/results/people/?keywords=${query}`);
    }
    logInteraction({ contactId: contact._id, userId: contact.userId, type: 'linkedin_opened' });
  };

  const openEmail = () => {
    if (contact.email) Linking.openURL(`mailto:${contact.email}`);
  };

  const openPhone = () => {
    if (contact.phone) Linking.openURL(`tel:${contact.phone}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, color: theme.textPrimary, fontSize: 18, fontWeight: '700' }} numberOfLines={1}>
          {fullName}
        </Text>
        <TouchableOpacity
          onPress={() => toggleFav({ contactId: contact._id })}
          style={{ marginRight: 12 }}
        >
          <Ionicons
            name={contact.favorite ? 'star' : 'star-outline'}
            size={22}
            color={contact.favorite ? '#FBBF24' : theme.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/(app)/contact/${id}/edit`)}>
          <Ionicons name="pencil-outline" size={22} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Avatar + Name */}
        <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.accent + '30', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Text style={{ color: theme.accent, fontSize: 30, fontWeight: '700' }}>{initials || '?'}</Text>
          </View>
          <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: '700' }}>{fullName}</Text>
          {contact.designation && (
            <Text style={{ color: theme.textSecondary, fontSize: 16, marginTop: 4 }}>{contact.designation}</Text>
          )}
          {contact.company && (
            <Text style={{ color: theme.accent, fontSize: 14, marginTop: 2 }}>{contact.company}</Text>
          )}
          {contact.country && (
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>{contact.country}</Text>
          )}
        </View>

        {/* Action Buttons */}
        <View className="flex-row px-5 gap-3 mb-6">
          {(contact.phone || contact.mobile) && (
            <TouchableOpacity
              onPress={openWhatsApp}
              className="flex-1 bg-[#25D366]/20 rounded-2xl py-3 items-center"
            >
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              <Text className="text-[#25D366] text-xs mt-1 font-medium">WhatsApp</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={openLinkedIn}
            className="flex-1 bg-[#0A66C2]/20 rounded-2xl py-3 items-center"
          >
            <Ionicons name="logo-linkedin" size={22} color="#0A66C2" />
            <Text className="text-[#0A66C2] text-xs mt-1 font-medium">LinkedIn</Text>
          </TouchableOpacity>
          {contact.email && (
            <TouchableOpacity
              onPress={openEmail}
              className="flex-1 bg-primary-900/50 rounded-2xl py-3 items-center"
            >
              <Ionicons name="mail-outline" size={22} color="#6366F1" />
              <Text className="text-primary-400 text-xs mt-1 font-medium">Email</Text>
            </TouchableOpacity>
          )}
          {contact.phone && (
            <TouchableOpacity
              onPress={openPhone}
              className="flex-1 bg-emerald-900/30 rounded-2xl py-3 items-center"
            >
              <Ionicons name="call-outline" size={22} color="#10B981" />
              <Text className="text-emerald-400 text-xs mt-1 font-medium">Call</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Business Card Image */}
        {cardImageUrl && (
          <Card className="mx-5 mb-4 overflow-hidden">
            <Image
              source={{ uri: cardImageUrl }}
              style={{ width: '100%', height: 180 }}
              resizeMode="cover"
            />
          </Card>
        )}

        {/* Contact Info */}
        <Card className="mx-5 mb-4 px-5">
          {contact.email    && <InfoRow theme={theme} icon="mail-outline"     label="Email"   value={contact.email}    onPress={openEmail} />}
          {contact.phone    && <InfoRow theme={theme} icon="call-outline"     label="Phone"   value={contact.phone}    onPress={openPhone} />}
          {contact.mobile   && <InfoRow theme={theme} icon="phone-portrait-outline" label="Mobile" value={contact.mobile} onPress={openPhone} />}
          {contact.website  && <InfoRow theme={theme} icon="globe-outline"    label="Website" value={contact.website}  onPress={() => Linking.openURL(contact.website!)} />}
          {contact.address  && <InfoRow theme={theme} icon="location-outline" label="Address" value={contact.address} />}
          {contact.linkedinUrl && <InfoRow theme={theme} icon="logo-linkedin" label="LinkedIn" value="View Profile" onPress={openLinkedIn} />}
        </Card>

        {/* Tags */}
        <Card className="mx-5 mb-4 p-4">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Tags</Text>
          <View className="flex-row flex-wrap gap-2">
            {contact.tags?.map((tag) => (
              <Badge key={tag} label={tag} variant="primary" />
            ))}
            {contact.tags?.length === 0 && (
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>No tags yet</Text>
            )}
          </View>
        </Card>

        {/* Notes */}
        <Card className="mx-5 mb-4 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>Notes</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => router.push(`/(app)/contact/${id}/timeline`)}>
                <Ionicons name="time-outline" size={20} color={theme.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/(app)/contact/${id}/notes`)}>
                <Ionicons name="add" size={20} color={theme.accent} />
              </TouchableOpacity>
            </View>
          </View>
          {notes && notes.length > 0 ? (
            notes.slice(0, 2).map((note, index) => (
              <View
                key={note._id}
                style={{ marginBottom: 12, paddingBottom: 12, borderBottomWidth: index === notes.slice(0, 2).length - 1 ? 0 : 1, borderBottomColor: theme.border }}
              >
                <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20 }}>{note.content}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                  {new Date(note.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ color: theme.textMuted, fontSize: 14 }}>No notes yet</Text>
          )}
        </Card>

        {/* Follow-up */}
        <Card className="mx-5 mb-4 p-4">
          <View className="flex-row items-center justify-between">
            <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>Follow-up</Text>
            <TouchableOpacity onPress={() => setFollowUpModal(true)}>
              <Ionicons name="calendar-outline" size={20} color={theme.accent} />
            </TouchableOpacity>
          </View>
          {contact.followUpDate ? (
            <View className="flex-row items-center mt-2">
              <Ionicons
                name={contact.followUpDate <= Date.now() ? 'warning-outline' : 'time-outline'}
                size={15}
                color={contact.followUpDate <= Date.now() ? theme.error : theme.accent}
              />
              <Text style={{ marginLeft: 8, fontSize: 14, color: contact.followUpDate <= Date.now() ? theme.error : theme.textPrimary }}>
                {new Date(contact.followUpDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setFollowUpModal(true)} className="mt-2">
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>Tap to set a follow-up date</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Org sharing */}
        {myOrg && (
          <Card className="mx-5 mb-4 p-4">
            <View className="flex-row items-center justify-between">
              <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>Team Sharing</Text>
              <TouchableOpacity
                onPress={() => {
                  if (contact.isShared) {
                    unshareFromOrg({ contactId: contact._id });
                  } else {
                    shareWithOrg({ contactId: contact._id, organizationId: myOrg._id });
                  }
                }}
              >
                <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: contact.isShared ? theme.accent : theme.surfaceAlt }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: contact.isShared ? '#fff' : theme.textMuted }}>
                    {contact.isShared ? 'Shared' : 'Private'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 6 }}>
              {contact.isShared
                ? `Visible to all members of ${myOrg.name}`
                : `Only visible to you. Tap to share with ${myOrg.name}.`}
            </Text>
          </Card>
        )}

        {/* Relationship score */}
        {contact.relationshipScore !== undefined && contact.relationshipScore > 0 && (
          <View className="mx-5 flex-row items-center mb-4 gap-3">
            <View style={{ flex: 1, backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="heart-outline" size={14} color={theme.accent} />
              <Text style={{ color: theme.textMuted, fontSize: 12, marginLeft: 6, flex: 1 }}>Relationship score</Text>
              <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '600' }}>{contact.relationshipScore}</Text>
            </View>
            <TouchableOpacity
              onPress={() => recalcScore({ contactId: contact._id })}
              style={{ backgroundColor: theme.surfaceAlt, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}
            >
              <Ionicons name="refresh-outline" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        )}

        {/* OCR Confidence */}
        {contact.ocrConfidence !== undefined && (
          <View className="mx-5 flex-row items-center mb-4">
            <Ionicons name="analytics-outline" size={14} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, fontSize: 12, marginLeft: 6 }}>
              OCR confidence: {contact.ocrConfidence}%
            </Text>
          </View>
        )}
      </ScrollView>

      {(contact.phone || contact.mobile) && (
        <WhatsAppModal
          visible={whatsappOpen}
          contact={contact as any}
          senderName={user?.name ?? 'Me'}
          onClose={() => setWhatsappOpen(false)}
          onSent={() => logInteraction({ contactId: contact._id, userId: contact.userId, type: 'whatsapp_sent' })}
        />
      )}

      {/* Follow-up date picker modal */}
      <Modal visible={followUpModal} transparent animationType="slide" onRequestClose={() => setFollowUpModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 }}>
            <View className="flex-row items-center mb-5">
              <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700', flex: 1 }}>Set Follow-up Date</Text>
              <TouchableOpacity onPress={() => setFollowUpModal(false)}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Quick presets */}
            {[
              { label: 'Tomorrow',   days: 1  },
              { label: 'This week',  days: 3  },
              { label: 'Next week',  days: 7  },
              { label: 'Next month', days: 30 },
            ].map(({ label, days }) => (
              <TouchableOpacity
                key={label}
                onPress={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + days);
                  d.setHours(9, 0, 0, 0);
                  setFollowUpDate({ contactId: contact._id, followUpDate: d.getTime() });
                  setFollowUpModal(false);
                }}
                style={{ backgroundColor: theme.surfaceAlt, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14, marginBottom: 12 }}
              >
                <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '500' }}>{label}</Text>
              </TouchableOpacity>
            ))}

            {/* Custom date input */}
            <TextInput
              style={{ backgroundColor: theme.surfaceAlt, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 14, color: theme.textPrimary, fontSize: 14, marginBottom: 12 }}
              placeholder="YYYY-MM-DD (custom date)"
              placeholderTextColor={theme.textMuted}
              value={followUpText}
              onChangeText={setFollowUpText}
              keyboardType="numbers-and-punctuation"
            />
            <Button
              label="Set Custom Date"
              variant="secondary"
              fullWidth
              disabled={!followUpText.trim()}
              onPress={() => {
                const d = new Date(followUpText);
                if (isNaN(d.getTime())) {
                  Alert.alert('Invalid Date', 'Please enter a valid date in YYYY-MM-DD format.');
                  return;
                }
                setFollowUpDate({ contactId: contact._id, followUpDate: d.getTime() });
                setFollowUpText('');
                setFollowUpModal(false);
              }}
            />
            {contact.followUpDate && (
              <Button
                label="Clear Follow-up"
                variant="ghost"
                fullWidth
                className="mt-2"
                onPress={() => {
                  setFollowUpDate({ contactId: contact._id, followUpDate: undefined });
                  setFollowUpModal(false);
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
