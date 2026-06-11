import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../../src/components/ui/Card';
import { useAuthStore } from '../../../src/stores/authStore';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';

const QUICK_ACTIONS = [
  { icon: 'scan',           label: 'Scan Card',       href: '/(app)/(tabs)/scan',  color: '#6366F1' },
  { icon: 'search',         label: 'Search',           href: '/(app)/(tabs)/contacts', color: '#10B981' },
  { icon: 'calendar',       label: 'Events',           href: '/(app)/events',       color: '#F59E0B' },
  { icon: 'person-add',     label: 'Add Contact',      href: '/(app)/contact/new',  color: '#3B82F6' },
] as const;

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { plan, scanCount, scanLimit } = useSubscriptionStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const firstName = user?.name?.split(' ')[0] ?? 'there';

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
            <Text className="text-slate-50 text-2xl font-bold">{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            className="w-10 h-10 bg-surface-800 rounded-full items-center justify-center"
            onPress={() => router.push('/(app)/(tabs)/settings')}
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
                Upgrade to Pro for unlimited scanning →
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
            {[
              { label: 'Added Today',    value: '0', icon: 'today-outline',       color: '#6366F1' },
              { label: 'This Week',      value: '0', icon: 'calendar-outline',    color: '#10B981' },
              { label: 'Events',         value: '0', icon: 'location-outline',    color: '#F59E0B' },
              { label: 'Follow-ups Due', value: '0', icon: 'notifications-outline', color: '#EF4444' },
            ].map(({ label, value, icon, color }) => (
              <Card key={label} className="flex-1 min-w-[44%] p-4">
                <Ionicons name={icon as any} size={22} color={color} />
                <Text className="text-slate-50 text-2xl font-bold mt-2">{value}</Text>
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
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/contacts')}>
              <Text className="text-primary-400 text-sm">See all</Text>
            </TouchableOpacity>
          </View>
          <Card className="p-10 items-center">
            <Ionicons name="scan-outline" size={40} color="#475569" />
            <Text className="text-slate-400 text-sm mt-3 text-center">
              No contacts yet.{'\n'}Scan your first business card to get started.
            </Text>
            <TouchableOpacity
              className="mt-4 bg-primary-500 px-5 py-2.5 rounded-xl"
              onPress={() => router.push('/(app)/(tabs)/scan')}
            >
              <Text className="text-white text-sm font-semibold">Scan a Card</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
