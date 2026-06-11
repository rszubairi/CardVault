import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
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
  const contact = useQuery(api.contacts.getById, { contactId: id as Id<'contacts'> });
  const notes   = useQuery(api.notes.list, { contactId: id as Id<'contacts'> });
  const logInteraction = useMutation(api.interactions.log);
  const toggleFav      = useMutation(api.contacts.toggleFavorite);

  const [tagsExpanded, setTagsExpanded] = useState(false);

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
    const number = (contact.mobile ?? contact.phone)!.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hi ${contact.firstName},\n\nGreat meeting you! Looking forward to staying connected.\n\nBest,`,
    );
    const url = `https://wa.me/${number}?text=${message}`;
    Linking.openURL(url);
    logInteraction({ contactId: contact._id, userId: contact.userId, type: 'whatsapp_sent' });
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
            <TouchableOpacity onPress={() => router.push(`/(app)/contact/${id}/notes`)}>
              <Ionicons name="add" size={20} color="#6366F1" />
            </TouchableOpacity>
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
    </SafeAreaView>
  );
}
