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

const TAGS_PRESET = [
  'Investor', 'Healthcare', 'VC', 'AI', 'Government',
  'Potential Client', 'Partner', 'Media', 'Startup', 'Enterprise',
];

function InfoRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-row items-start py-3 border-b border-surface-700/50"
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons name={icon as any} size={18} color="#6366F1" className="mt-0.5 mr-4" />
      <View className="flex-1">
        <Text className="text-slate-500 text-xs mb-0.5">{label}</Text>
        <Text className="text-slate-200 text-sm">{value}</Text>
      </View>
      {onPress && <Ionicons name="open-outline" size={14} color="#475569" />}
    </TouchableOpacity>
  );
}

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
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
      <SafeAreaView className="flex-1 bg-surface-900 items-center justify-center">
        <Ionicons name="person-circle-outline" size={52} color="#334155" />
        <Text className="text-slate-400 text-base mt-3">Contact not found</Text>
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
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-3 border-b border-surface-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="flex-1 text-slate-50 text-lg font-bold" numberOfLines={1}>
          {fullName}
        </Text>
        <TouchableOpacity
          onPress={() => toggleFav({ contactId: contact._id })}
          className="mr-3"
        >
          <Ionicons
            name={contact.favorite ? 'star' : 'star-outline'}
            size={22}
            color={contact.favorite ? '#FBBF24' : '#64748B'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/(app)/contact/${id}/edit`)}>
          <Ionicons name="pencil-outline" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Avatar + Name */}
        <View className="items-center pt-8 pb-6 px-5">
          <View className="w-20 h-20 bg-primary-800 rounded-full items-center justify-center mb-4">
            <Text className="text-primary-200 text-3xl font-bold">{initials || '?'}</Text>
          </View>
          <Text className="text-slate-50 text-2xl font-bold">{fullName}</Text>
          {contact.designation && (
            <Text className="text-slate-400 text-base mt-1">{contact.designation}</Text>
          )}
          {contact.company && (
            <Text className="text-primary-400 text-sm mt-0.5">{contact.company}</Text>
          )}
          {contact.country && (
            <Text className="text-slate-500 text-xs mt-1">{contact.country}</Text>
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
          {contact.email    && <InfoRow icon="mail-outline"     label="Email"   value={contact.email}    onPress={openEmail} />}
          {contact.phone    && <InfoRow icon="call-outline"     label="Phone"   value={contact.phone}    onPress={openPhone} />}
          {contact.mobile   && <InfoRow icon="phone-portrait-outline" label="Mobile" value={contact.mobile} onPress={openPhone} />}
          {contact.website  && <InfoRow icon="globe-outline"    label="Website" value={contact.website}  onPress={() => Linking.openURL(contact.website!)} />}
          {contact.address  && <InfoRow icon="location-outline" label="Address" value={contact.address} />}
          {contact.linkedinUrl && <InfoRow icon="logo-linkedin" label="LinkedIn" value="View Profile" onPress={openLinkedIn} />}
        </Card>

        {/* Tags */}
        <Card className="mx-5 mb-4 p-4">
          <Text className="text-slate-400 text-xs uppercase tracking-widest mb-3">Tags</Text>
          <View className="flex-row flex-wrap gap-2">
            {contact.tags?.map((tag) => (
              <Badge key={tag} label={tag} variant="primary" />
            ))}
            {contact.tags?.length === 0 && (
              <Text className="text-slate-500 text-sm">No tags yet</Text>
            )}
          </View>
        </Card>

        {/* Notes */}
        <Card className="mx-5 mb-4 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-slate-400 text-xs uppercase tracking-widest">Notes</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity onPress={() => router.push(`/(app)/contact/${id}/timeline`)}>
                <Ionicons name="time-outline" size={20} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/(app)/contact/${id}/notes`)}>
                <Ionicons name="add" size={20} color="#6366F1" />
              </TouchableOpacity>
            </View>
          </View>
          {notes && notes.length > 0 ? (
            notes.slice(0, 2).map((note) => (
              <View key={note._id} className="mb-3 pb-3 border-b border-surface-700 last:border-0">
                <Text className="text-slate-300 text-sm leading-5">{note.content}</Text>
                <Text className="text-slate-500 text-xs mt-1">
                  {new Date(note.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-slate-500 text-sm">No notes yet</Text>
          )}
        </Card>

        {/* Follow-up */}
        <Card className="mx-5 mb-4 p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-slate-400 text-xs uppercase tracking-widest">Follow-up</Text>
            <TouchableOpacity onPress={() => setFollowUpModal(true)}>
              <Ionicons name="calendar-outline" size={20} color="#6366F1" />
            </TouchableOpacity>
          </View>
          {contact.followUpDate ? (
            <View className="flex-row items-center mt-2">
              <Ionicons
                name={contact.followUpDate <= Date.now() ? 'warning-outline' : 'time-outline'}
                size={15}
                color={contact.followUpDate <= Date.now() ? '#EF4444' : '#6366F1'}
              />
              <Text className={`ml-2 text-sm ${contact.followUpDate <= Date.now() ? 'text-red-400' : 'text-slate-200'}`}>
                {new Date(contact.followUpDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setFollowUpModal(true)} className="mt-2">
              <Text className="text-slate-500 text-sm">Tap to set a follow-up date</Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Org sharing */}
        {myOrg && (
          <Card className="mx-5 mb-4 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-slate-400 text-xs uppercase tracking-widest">Team Sharing</Text>
              <TouchableOpacity
                onPress={() => {
                  if (contact.isShared) {
                    unshareFromOrg({ contactId: contact._id });
                  } else {
                    shareWithOrg({ contactId: contact._id, organizationId: myOrg._id });
                  }
                }}
              >
                <View className={`px-3 py-1 rounded-full ${contact.isShared ? 'bg-primary-500' : 'bg-surface-700'}`}>
                  <Text className={`text-xs font-medium ${contact.isShared ? 'text-white' : 'text-slate-400'}`}>
                    {contact.isShared ? 'Shared' : 'Private'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <Text className="text-slate-500 text-xs mt-1.5">
              {contact.isShared
                ? `Visible to all members of ${myOrg.name}`
                : `Only visible to you. Tap to share with ${myOrg.name}.`}
            </Text>
          </Card>
        )}

        {/* Relationship score */}
        {contact.relationshipScore !== undefined && contact.relationshipScore > 0 && (
          <View className="mx-5 flex-row items-center mb-4 gap-3">
            <View className="flex-1 bg-surface-800 rounded-xl px-4 py-2.5 flex-row items-center">
              <Ionicons name="heart-outline" size={14} color="#6366F1" />
              <Text className="text-slate-400 text-xs ml-1.5 flex-1">Relationship score</Text>
              <Text className="text-primary-400 text-sm font-semibold">{contact.relationshipScore}</Text>
            </View>
            <TouchableOpacity
              onPress={() => recalcScore({ contactId: contact._id })}
              className="bg-surface-700 rounded-xl px-3 py-2.5"
            >
              <Ionicons name="refresh-outline" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}

        {/* OCR Confidence */}
        {contact.ocrConfidence !== undefined && (
          <View className="mx-5 flex-row items-center mb-4">
            <Ionicons name="analytics-outline" size={14} color="#475569" />
            <Text className="text-slate-500 text-xs ml-1.5">
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
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-surface-800 rounded-t-3xl p-5 pb-10">
            <View className="flex-row items-center mb-5">
              <Text className="text-slate-50 text-lg font-bold flex-1">Set Follow-up Date</Text>
              <TouchableOpacity onPress={() => setFollowUpModal(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
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
                className="bg-surface-700 rounded-xl px-5 py-3.5 mb-3"
              >
                <Text className="text-slate-200 text-sm font-medium">{label}</Text>
              </TouchableOpacity>
            ))}

            {/* Custom date input */}
            <TextInput
              className="bg-surface-700 rounded-xl px-5 py-3.5 text-slate-100 text-sm mb-3"
              placeholder="YYYY-MM-DD (custom date)"
              placeholderTextColor="#64748B"
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
