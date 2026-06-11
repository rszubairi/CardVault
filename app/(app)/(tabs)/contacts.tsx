import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useContactStore } from '../../../src/stores/contactStore';
import { Contact } from '../../../src/types';
import Badge from '../../../src/components/ui/Badge';

function ContactRow({ contact, onPress }: { contact: Contact; onPress: () => void }) {
  const initials = `${contact.firstName?.[0] ?? ''}${contact.lastName?.[0] ?? ''}`.toUpperCase();
  return (
    <TouchableOpacity
      className="flex-row items-center px-5 py-4 border-b border-surface-800"
      onPress={onPress}
    >
      <View className="w-12 h-12 bg-primary-900 rounded-full items-center justify-center mr-4">
        <Text className="text-primary-300 text-base font-bold">{initials || '?'}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-slate-100 text-base font-semibold">
          {contact.firstName} {contact.lastName}
        </Text>
        {contact.designation || contact.company ? (
          <Text className="text-slate-400 text-sm mt-0.5" numberOfLines={1}>
            {[contact.designation, contact.company].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        {contact.tags?.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mt-1.5">
            {contact.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} label={tag} variant="neutral" />
            ))}
          </View>
        )}
      </View>
      {contact.favorite && (
        <Ionicons name="star" size={16} color="#FBBF24" className="ml-2" />
      )}
      <Ionicons name="chevron-forward" size={16} color="#475569" />
    </TouchableOpacity>
  );
}

export default function ContactsScreen() {
  const router = useRouter();
  const { contacts, searchQuery, setSearchQuery } = useContactStore();
  const [filterFavorites, setFilterFavorites] = useState(false);

  const filtered = contacts.filter((c) => {
    const q = searchQuery.toLowerCase();
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
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Count */}
      <View className="px-5 py-2">
        <Text className="text-slate-500 text-xs">
          {filtered.length} {filtered.length === 1 ? 'contact' : 'contacts'}
        </Text>
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons name="people-outline" size={52} color="#334155" />
          <Text className="text-slate-400 text-base text-center mt-4">
            {contacts.length === 0
              ? 'No contacts yet.\nScan a business card to get started.'
              : 'No contacts match your search.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ContactRow
              contact={item}
              onPress={() => router.push(`/(app)/contact/${item._id}`)}
            />
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}
