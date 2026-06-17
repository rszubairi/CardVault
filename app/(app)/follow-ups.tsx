import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { format } from 'date-fns';
import Card from '../../src/components/ui/Card';
import Badge from '../../src/components/ui/Badge';
import { useAuthStore } from '../../src/stores/authStore';
import { hapticSuccess } from '../../src/lib/haptics';

export default function FollowUpsScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();

  const followUps = useQuery(
    api.contacts.getFollowUps,
    user ? { userId: user._id } : 'skip',
  );
  const markDone   = useMutation(api.contacts.markFollowUpDone);
  const clearDate  = useMutation(api.contacts.setFollowUpDate);

  const overdue  = followUps?.filter((f) => f.isOverdue)  ?? [];
  const upcoming = followUps?.filter((f) => !f.isOverdue) ?? [];

  const handleMarkDone = (contactId: Id<'contacts'>, name: string) => {
    if (!user) return;
    Alert.alert(`Follow-up with ${name}`, 'Mark this follow-up as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Done',
        onPress: () => { hapticSuccess(); markDone({ contactId, userId: user._id }); },
      },
    ]);
  };

  const handleClear = (contactId: Id<'contacts'>) =>
    clearDate({ contactId, followUpDate: undefined });

  function FollowUpCard({
    contact,
  }: {
    contact: NonNullable<typeof followUps>[number];
  }) {
    const fullName = `${contact.firstName} ${contact.lastName}`.trim();
    const initials = `${contact.firstName[0] ?? ''}${contact.lastName[0] ?? ''}`.toUpperCase();

    return (
      <Card className="p-4 mb-3">
        <View className="flex-row items-center">
          <View className="w-11 h-11 bg-primary-800 rounded-full items-center justify-center mr-3">
            <Text className="text-primary-200 text-sm font-bold">{initials}</Text>
          </View>
          <View className="flex-1">
            <TouchableOpacity onPress={() => router.push({ pathname: '/(app)/contact/[id]', params: { id: contact._id } })}>
              <Text className="text-slate-200 text-sm font-semibold">{fullName}</Text>
            </TouchableOpacity>
            {contact.company && (
              <Text className="text-slate-500 text-xs mt-0.5">{contact.company}</Text>
            )}
          </View>
          <View className="items-end gap-1">
            {contact.isOverdue ? (
              <Badge label="Overdue" variant="error" />
            ) : contact.daysUntil === 0 ? (
              <Badge label="Today" variant="warning" />
            ) : (
              <Badge label={`${contact.daysUntil}d`} variant="neutral" />
            )}
          </View>
        </View>

        <View className="flex-row items-center mt-3 pt-3 border-t border-surface-700">
          <Ionicons name="calendar-outline" size={14} color="#475569" />
          <Text className="text-slate-500 text-xs ml-1.5 flex-1">
            {contact.followUpDate
              ? format(new Date(contact.followUpDate), 'EEE, MMM d, yyyy')
              : ''}
          </Text>
          <TouchableOpacity
            onPress={() => handleMarkDone(contact._id as Id<'contacts'>, fullName)}
            className="bg-emerald-900/40 border border-emerald-700/50 rounded-lg px-3 py-1.5 mr-2"
          >
            <Text className="text-emerald-400 text-xs font-medium">Mark Done</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleClear(contact._id as Id<'contacts'>)}
            className="bg-surface-700 rounded-lg px-3 py-1.5"
          >
            <Text className="text-slate-400 text-xs">Clear</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="flex-1 text-slate-50 text-lg font-bold">Follow-ups</Text>
        {followUps && (
          <View className="bg-surface-700 px-3 py-1 rounded-full">
            <Text className="text-slate-400 text-xs">{followUps.length} total</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {followUps === undefined && (
          <ActivityIndicator color="#6366F1" style={{ marginTop: 40 }} />
        )}

        {followUps?.length === 0 && (
          <View className="items-center py-16">
            <Ionicons name="checkmark-circle-outline" size={52} color="#334155" />
            <Text className="text-slate-400 text-base mt-4">No follow-ups scheduled</Text>
            <Text className="text-slate-500 text-sm mt-1 text-center">
              Open a contact and set a follow-up date to see reminders here.
            </Text>
          </View>
        )}

        {overdue.length > 0 && (
          <>
            <Text className="text-red-400 text-xs font-semibold uppercase tracking-widest mb-3">
              Overdue Â· {overdue.length}
            </Text>
            {overdue.map((f) => (
              <FollowUpCard key={f._id} contact={f} />
            ))}
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <Text className={`text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3 ${overdue.length ? 'mt-4' : ''}`}>
              Upcoming Â· {upcoming.length}
            </Text>
            {upcoming.map((f) => (
              <FollowUpCard key={f._id} contact={f} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

