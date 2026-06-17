import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Card from '../../../src/components/ui/Card';
import { useAuthStore } from '../../../src/stores/authStore';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';

const QUICK_ACTIONS = [
  { icon: 'scan',       label: 'Scan Card',    href: '/(app)/(tabs)scan',     color: '#6366F1' },
  { icon: 'search',     label: 'Search',        href: '/(app)/(tabs)contacts', color: '#10B981' },
  { icon: 'calendar',   label: 'Events',        href: '/(app)/events',          color: '#F59E0B' },
  { icon: 'person-add', label: 'Add Contact',   href: '/(app)/contact/new',     color: '#3B82F6' },
] as const;

function ContactInitials({ name }: { name: string }) {
  const parts   = name.trim().split(' ');
  const initials = `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  return (
    <View className="w-10 h-10 bg-primary-800 rounded-full items-center justify-center">
      <Text className="text-primary-200 text-sm font-bold">{initials || '?'}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { plan, scanCount, scanLimit, setScanCount } = useSubscriptionStore();

  const stats        = useQuery(api.contacts.getStats, user ? { userId: user._id } : 'skip');
  const recentContacts = useQuery(
    api.contacts.list,
    user ? { userId: user._id, limit: 5 } : 'skip',
  );
  const subscription = useQuery(
    api.subscriptions.getByUserId,
    user ? { userId: user._id } : 'skip',
  );

  // Keep Zustand scan count in sync with Convex subscription record
  React.useEffect(() => {
    if (subscription?.scanCount !== undefined) {
      setScanCount(subscription.scanCount);
    }
  }, [subscription?.scanCount, setScanCount]);

  const [refreshKey, setRefreshKey] = React.useState(0);
  const refreshing = false;
  const onRefresh  = () => setRefreshKey((k) => k + 1);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const statCards = [
    { label: 'Added Today',    value: stats?.today        ?? 0, icon: 'today-outline',        color: '#6366F1' },
    { label: 'This Week',      value: stats?.thisWeek     ?? 0, icon: 'calendar-outline',     color: '#10B981' },
    { label: 'Total',          value: stats?.total        ?? 0, icon: 'people-outline',       color: '#3B82F6' },
    { label: 'Follow-ups Due', value: stats?.followUpsDue ?? 0, icon: 'notifications-outline', color: '#EF4444' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {/* Header */}
        <View className="px-5 pt-6 pb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-slate-400 text-sm">Good day,</Text>
            <Text className="text-slate-50 text-2xl font-bold">{firstName}</Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 bg-surface-800 rounded-full items-center justify-center"
            onPress={() => router.push('/(app)/(tabs)settings')}
          >
            <Ionicons name="person-outline" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Plan Banner */}
        {plan === 'free' && (
          <TouchableOpacity
            className="mx-5 mb-5 bg-primary-900/60 border border-primary-700 rounded-2xl px-4 py-3 flex-row items-center"
            onPress={() => router.push('/(app)/upgrade')}
          >
            <Ionicons name="flash" size={18} color="#FBBF24" />
            <View className="flex-1 ml-3">
              <Text className="text-slate-200 text-sm font-semibold">
                {scanCount} / {scanLimit} free scans used
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Upgrade to Pro for unlimited scanning â†’
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Stats Grid */}
        <View className="px-5 mb-6">
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Overview
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {statCards.map(({ label, value, icon, color }) => (
              <Card key={label} className="flex-1 min-w-[44%] p-4">
                <Ionicons name={icon as any} size={22} color={color} />
                {stats === undefined ? (
                  <ActivityIndicator color={color} size="small" style={{ marginTop: 8 }} />
                ) : (
                  <Text className="text-slate-50 text-2xl font-bold mt-2">{value}</Text>
                )}
                <Text className="text-slate-400 text-xs mt-0.5">{label}</Text>
              </Card>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-5 mb-6">
          <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3">
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {QUICK_ACTIONS.map(({ icon, label, href, color }) => (
              <TouchableOpacity
                key={label}
                className="flex-1 min-w-[44%] bg-surface-800 rounded-2xl p-4 items-center"
                onPress={() => router.push(href as any)}
              >
                <View
                  className="w-12 h-12 rounded-2xl items-center justify-center mb-2"
                  style={{ backgroundColor: color + '22' }}
                >
                  <Ionicons name={icon as any} size={24} color={color} />
                </View>
                <Text className="text-slate-300 text-sm font-medium text-center">{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Contacts */}
        <View className="px-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-widest">
              Recent Contacts
            </Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)contacts')}>
              <Text className="text-primary-400 text-sm">See all</Text>
            </TouchableOpacity>
          </View>

          {recentContacts === undefined && (
            <Card className="p-6 items-center">
              <ActivityIndicator color="#6366F1" />
            </Card>
          )}

          {recentContacts?.length === 0 && (
            <Card className="p-10 items-center">
              <Ionicons name="scan-outline" size={40} color="#475569" />
              <Text className="text-slate-400 text-sm mt-3 text-center">
                No contacts yet.{'\n'}Scan your first business card to get started.
              </Text>
              <TouchableOpacity
                className="mt-4 bg-primary-500 px-5 py-2.5 rounded-xl"
                onPress={() => router.push('/(app)/(tabs)scan')}
              >
                <Text className="text-white text-sm font-semibold">Scan a Card</Text>
              </TouchableOpacity>
            </Card>
          )}

          {recentContacts && recentContacts.length > 0 && (
            <Card className="overflow-hidden">
              {recentContacts.map((contact, index) => {
                const fullName = `${contact.firstName} ${contact.lastName}`.trim();
                const isLast   = index === recentContacts.length - 1;
                return (
                  <TouchableOpacity
                    key={contact._id}
                    onPress={() => router.push({ pathname: '/(app)/contact/[id]', params: { id: contact._id } })}
                    className={`flex-row items-center px-4 py-3 ${isLast ? '' : 'border-b border-surface-700'}`}
                  >
                    <ContactInitials name={fullName} />
                    <View className="flex-1 ml-3">
                      <Text className="text-slate-200 text-sm font-medium">{fullName}</Text>
                      {(contact.designation || contact.company) && (
                        <Text className="text-slate-500 text-xs mt-0.5" numberOfLines={1}>
                          {[contact.designation, contact.company].filter(Boolean).join(' Â· ')}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#334155" />
                  </TouchableOpacity>
                );
              })}
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

