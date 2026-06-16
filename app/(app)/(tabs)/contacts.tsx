import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuthStore } from '../../../src/stores/authStore';
import { Doc } from '../../../convex/_generated/dataModel';

// ─── Card colour palettes ─────────────────────────────────────────────────────

const PALETTES = [
  { bg: '#1E1B4B', accent: '#818CF8', text: '#C7D2FE' },
  { bg: '#064E3B', accent: '#34D399', text: '#A7F3D0' },
  { bg: '#1E3A5F', accent: '#60A5FA', text: '#BFDBFE' },
  { bg: '#3B0764', accent: '#C084FC', text: '#E9D5FF' },
  { bg: '#1C1917', accent: '#FBBF24', text: '#FDE68A' },
  { bg: '#0F1F3D', accent: '#22D3EE', text: '#A5F3FC' },
  { bg: '#1F2937', accent: '#FB7185', text: '#FECDD3' },
  { bg: '#1A2E05', accent: '#86EFAC', text: '#D9F99D' },
];

function palette(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return PALETTES[Math.abs(h) % PALETTES.length];
}

// ─── Business Card tile ───────────────────────────────────────────────────────

type ConvexContact = Doc<'contacts'>;

function BusinessCard({
  contact,
  onPress,
}: {
  contact: ConvexContact;
  onPress: () => void;
}) {
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  const initials = `${contact.firstName?.[0] ?? ''}${contact.lastName?.[0] ?? ''}`.toUpperCase();
  const seed     = contact.company ?? fullName;
  const pal      = palette(seed);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{ width: '48%', marginBottom: 12 }}
    >
      <View
        style={{
          backgroundColor: pal.bg,
          borderRadius: 16,
          padding: 14,
          minHeight: 148,
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: pal.accent + '33',
        }}
      >
        {/* Top row: company + star */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text
            style={{
              color: pal.accent,
              fontSize: 9,
              fontWeight: '700',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              flex: 1,
              marginRight: 4,
            }}
            numberOfLines={2}
          >
            {contact.company ?? '—'}
          </Text>
          {contact.favorite && (
            <Ionicons name="star" size={12} color="#FBBF24" />
          )}
        </View>

        {/* Accent divider */}
        <View style={{ height: 1, backgroundColor: pal.accent + '44', marginVertical: 8 }} />

        {/* Name */}
        <Text
          style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '700', lineHeight: 18 }}
          numberOfLines={2}
        >
          {fullName}
        </Text>

        {/* Designation */}
        {contact.designation ? (
          <Text
            style={{ color: pal.text, fontSize: 10, marginTop: 3, opacity: 0.85 }}
            numberOfLines={1}
          >
            {contact.designation}
          </Text>
        ) : null}

        {/* Bottom row: source chip + initials circle */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          {contact.email ? (
            <Text style={{ color: pal.accent, fontSize: 9, opacity: 0.7 }} numberOfLines={1}>
              {contact.email.split('@')[1] ?? ''}
            </Text>
          ) : <View />}

          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: pal.accent + '33',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: pal.accent, fontSize: 10, fontWeight: '700' }}>{initials || '?'}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ContactsScreen() {
  const router          = useRouter();
  const { user }        = useAuthStore();
  const [query, setQuery]               = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);

  const contacts = useQuery(
    api.contacts.list,
    user ? { userId: user._id } : 'skip',
  );

  const filtered = useMemo(() => {
    if (!contacts) return [];
    const q = query.toLowerCase();
    return contacts.filter((c) => {
      const matchesQuery =
        !q ||
        c.firstName?.toLowerCase().includes(q) ||
        c.lastName?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q));
      const matchesFav = !filterFavorites || c.favorite;
      return matchesQuery && matchesFav;
    });
  }, [contacts, query, filterFavorites]);

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-5 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-slate-50 text-2xl font-bold">Contacts</Text>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setFilterFavorites(!filterFavorites)}
              className={`w-9 h-9 rounded-full items-center justify-center ${filterFavorites ? 'bg-amber-500' : 'bg-surface-800'}`}
            >
              <Ionicons name="star" size={18} color={filterFavorites ? '#fff' : '#94A3B8'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(app)/contact/new')}
              className="w-9 h-9 bg-primary-500 rounded-full items-center justify-center"
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-surface-800 rounded-xl px-4 py-3">
          <Ionicons name="search" size={18} color="#64748B" />
          <TextInput
            className="flex-1 ml-3 text-slate-100 text-base"
            placeholder="Search name, company, tag..."
            placeholderTextColor="#64748B"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Count */}
      {contacts !== undefined && (
        <View className="px-5 pb-2">
          <Text className="text-slate-500 text-xs">
            {filtered.length} {filtered.length === 1 ? 'contact' : 'contacts'}
          </Text>
        </View>
      )}

      {/* Loading */}
      {contacts === undefined && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#6366F1" size="large" />
        </View>
      )}

      {/* Empty */}
      {contacts !== undefined && filtered.length === 0 && (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="people-outline" size={52} color="#334155" />
          <Text className="text-slate-400 text-base text-center mt-4">
            {contacts.length === 0
              ? 'No contacts yet.\nScan a business card to get started.'
              : 'No contacts match your search.'}
          </Text>
          {contacts.length === 0 && (
            <TouchableOpacity
              className="mt-5 bg-primary-500 px-6 py-3 rounded-xl"
              onPress={() => router.push('/(app)/(tabs)/scan')}
            >
              <Text className="text-white text-sm font-semibold">Scan a Card</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Business card grid */}
      {contacts !== undefined && filtered.length > 0 && (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          renderItem={({ item }) => (
            <BusinessCard
              contact={item}
              onPress={() => router.push({ pathname: '/(app)/contact/[id]', params: { id: item._id } })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
