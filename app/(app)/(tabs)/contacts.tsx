import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuthStore } from '../../../src/stores/authStore';
import { Doc } from '../../../convex/_generated/dataModel';
import { useAppTheme } from '../../../src/theme/useAppTheme';

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTES = [
  { bg: '#1E1B4B', accent: '#818CF8', text: '#C7D2FE', stripe: '#312E81' },
  { bg: '#064E3B', accent: '#34D399', text: '#A7F3D0', stripe: '#065F46' },
  { bg: '#1E3A5F', accent: '#60A5FA', text: '#BFDBFE', stripe: '#1D4ED8' },
  { bg: '#3B0764', accent: '#C084FC', text: '#E9D5FF', stripe: '#6D28D9' },
  { bg: '#1C1917', accent: '#FBBF24', text: '#FDE68A', stripe: '#92400E' },
  { bg: '#0F1F3D', accent: '#22D3EE', text: '#A5F3FC', stripe: '#0E7490' },
  { bg: '#1F2937', accent: '#FB7185', text: '#FECDD3', stripe: '#9F1239' },
  { bg: '#1A2E05', accent: '#86EFAC', text: '#D9F99D', stripe: '#166534' },
];

function palette(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  return PALETTES[Math.abs(h) % PALETTES.length];
}

// ─── Dimensions ───────────────────────────────────────────────────────────────

const SCREEN_W   = Dimensions.get('window').width;
const H_PAD      = 20;
const CARD_W     = SCREEN_W - H_PAD * 2;
const CARD_H     = 160;
const PEEK_H     = 60; // how much of the next card is visible beneath

type ConvexContact = Doc<'contacts'>;

// ─── Full-width stacked business card ────────────────────────────────────────

function BusinessCard({
  contact,
  index,
  total,
  onPress,
}: {
  contact: ConvexContact;
  index: number;
  total: number;
  onPress: () => void;
}) {
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();
  const initials = `${contact.firstName?.[0] ?? ''}${contact.lastName?.[0] ?? ''}`.toUpperCase();
  const seed     = contact.company ?? fullName;
  const pal      = palette(seed);
  const isLast   = index === total - 1;

  return (
    <View
      style={{
        // Higher index = higher zIndex → each card slides OVER the one above it
        zIndex:     index + 1,
        elevation:  index + 1,
        marginBottom: isLast ? 24 : -(CARD_H - PEEK_H),
        paddingHorizontal: H_PAD,
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={{
          width:         CARD_W,
          height:        CARD_H,
          borderRadius:  20,
          backgroundColor: pal.bg,
          overflow:      'hidden',
          shadowColor:   '#000',
          shadowOffset:  { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius:  14,
        }}
      >
        {/* Decorative stripe */}
        <View
          style={{
            position:        'absolute',
            top:             0,
            left:            0,
            right:           0,
            height:          4,
            backgroundColor: pal.accent,
            opacity:         0.9,
          }}
        />

        {/* Diagonal decoration */}
        <View
          style={{
            position:        'absolute',
            top:             -60,
            right:           -40,
            width:           160,
            height:          160,
            borderRadius:    80,
            backgroundColor: pal.stripe,
            opacity:         0.25,
          }}
        />

        {/* Content */}
        <View style={{ flex: 1, padding: 18, justifyContent: 'space-between' }}>
          {/* Top row: company prominent */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text
                style={{
                  color:       pal.accent,
                  fontSize:    11,
                  fontWeight:  '700',
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                }}
                numberOfLines={1}
              >
                {contact.company ?? '—'}
              </Text>
            </View>
            {contact.favorite && (
              <Ionicons name="star" size={14} color="#FBBF24" />
            )}
          </View>

          {/* Name + designation — the hero content */}
          <View>
            <Text
              style={{ color: '#F8FAFC', fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}
              numberOfLines={1}
            >
              {fullName}
            </Text>
            {contact.designation ? (
              <Text
                style={{ color: pal.text, fontSize: 12, marginTop: 3, opacity: 0.85, fontWeight: '500' }}
                numberOfLines={1}
              >
                {contact.designation}
              </Text>
            ) : null}
          </View>

          {/* Bottom row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {contact.email && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="mail-outline" size={11} color={pal.accent} style={{ opacity: 0.7 }} />
                  <Text style={{ color: pal.text, fontSize: 10, opacity: 0.65 }} numberOfLines={1}>
                    {contact.email.split('@')[1] ?? contact.email}
                  </Text>
                </View>
              )}
              {(contact.phone || contact.mobile) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="call-outline" size={11} color={pal.accent} style={{ opacity: 0.7 }} />
                  <Text style={{ color: pal.text, fontSize: 10, opacity: 0.65 }}>
                    {(contact.phone ?? contact.mobile ?? '').slice(-4).padStart(4, '·')}
                  </Text>
                </View>
              )}
            </View>

            {/* Initials chip */}
            <View
              style={{
                width:           34,
                height:          34,
                borderRadius:    17,
                backgroundColor: pal.accent + '30',
                borderWidth:     1.5,
                borderColor:     pal.accent + '60',
                alignItems:      'center',
                justifyContent:  'center',
              }}
            >
              <Text style={{ color: pal.accent, fontSize: 11, fontWeight: '800' }}>
                {initials || '?'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ContactsScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const theme    = useAppTheme();
  const [query,           setQuery]           = useState('');
  const [filterFavorites, setFilterFavorites] = useState(false);

  const contacts = useQuery(api.contacts.list, user ? { userId: user._id } : 'skip');

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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-5 pb-4">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: '700' }}>Contacts</Text>
            {contacts !== undefined && (
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                {filtered.length} {filtered.length === 1 ? 'card' : 'cards'}
              </Text>
            )}
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setFilterFavorites(!filterFavorites)}
              style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: filterFavorites ? '#F59E0B' : theme.surfaceAlt }}
            >
              <Ionicons name="star" size={18} color={filterFavorites ? '#fff' : '#94A3B8'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(app)/contact/new')}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.accent }}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
          <Ionicons name="search" size={18} color={theme.textMuted} />
          <TextInput
            style={{ flex: 1, marginLeft: 12, color: theme.textPrimary, fontSize: 16 }}
            placeholder="Search name, company, tag..."
            placeholderTextColor={theme.textMuted}
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

      {/* Loading */}
      {contacts === undefined && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      )}

      {/* Empty */}
      {contacts !== undefined && filtered.length === 0 && (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="albums-outline" size={52} color="#334155" />
          <Text className="text-slate-400 text-base text-center mt-4">
            {contacts.length === 0
              ? 'No cards yet.\nScan a business card to get started.'
              : 'No cards match your search.'}
          </Text>
          {contacts.length === 0 && (
            <TouchableOpacity
              className="mt-5 px-6 py-3 rounded-xl"
              style={{ backgroundColor: theme.accent }}
              onPress={() => router.push('/(app)/(tabs)/scan')}
            >
              <Text className="text-white text-sm font-semibold">Scan a Card</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Stacked card list */}
      {contacts !== undefined && filtered.length > 0 && (
        <ScrollView
          contentContainerStyle={{
            paddingTop: 8,
            // Total height: last card full height + (n-1) * PEEK_H
            paddingBottom: 0,
          }}
          showsVerticalScrollIndicator={false}
        >
          {filtered.map((contact, index) => (
            <BusinessCard
              key={contact._id}
              contact={contact}
              index={index}
              total={filtered.length}
              onPress={() =>
                router.push({ pathname: '/(app)/contact/[id]', params: { id: contact._id } })
              }
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
