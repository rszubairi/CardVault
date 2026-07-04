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
import { useAppTheme } from '../../src/theme/useAppTheme';

export default function FollowUpsScreen() {
  const router   = useRouter();
  const { user } = useAuthStore();
  const theme    = useAppTheme();

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
          <View style={{ width: 44, height: 44, backgroundColor: theme.accentFaint, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '700' }}>{initials}</Text>
          </View>
          <View className="flex-1">
            <TouchableOpacity onPress={() => router.push({ pathname: '/(app)/contact/[id]', params: { id: contact._id } })}>
              <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600' }}>{fullName}</Text>
            </TouchableOpacity>
            {contact.company && (
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{contact.company}</Text>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, color: theme.textPrimary, fontSize: 18, fontWeight: '700' }}>Follow-ups</Text>
        {followUps && (
          <View style={{ backgroundColor: theme.surfaceAlt, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
            <Text style={{ color: theme.textMuted, fontSize: 12 }}>{followUps.length} total</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {followUps === undefined && (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 40 }} />
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
              Overdue · {overdue.length}
            </Text>
            {overdue.map((f) => (
              <FollowUpCard key={f._id} contact={f} />
            ))}
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <Text className={`text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3 ${overdue.length ? 'mt-4' : ''}`}>
              Upcoming · {upcoming.length}
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

