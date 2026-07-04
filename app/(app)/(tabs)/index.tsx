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
import { useAuthStore } from '../../../src/stores/authStore';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { useAppTheme } from '../../../src/theme/useAppTheme';

function ContactInitials({
  name,
  accent,
  size = 40,
  filled = false,
}: {
  name: string;
  accent: string;
  size?: number;
  filled?: boolean;
}) {
  const parts   = name.trim().split(' ');
  const initials = `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  return (
    <View
      style={{
        width:  size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: filled ? accent : accent + '30',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: filled ? '#fff' : accent, fontSize: size * 0.35, fontWeight: 'bold' }}>
        {initials || '?'}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { plan, scanCount, scanLimit, setScanCount } = useSubscriptionStore();
  const theme = useAppTheme();

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

  const firstName   = user?.name?.split(' ')[0] ?? 'there';
  const fullName    = user?.name ?? 'there';
  const hasFollowUps = (stats?.followUpsDue ?? 0) > 0;

  const quickActions = [
    { icon: 'download-outline', label: 'Export', href: '/(app)/export',           color: '#F59E0B', highlighted: false },
    { icon: 'person-add',       label: 'Add',    href: '/(app)/contact/new',      color: theme.accent, highlighted: false },
    { icon: 'search',           label: 'Search', href: '/(app)/(tabs)/contacts', color: '#10B981', highlighted: false },
    { icon: 'scan',             label: 'Scan',   href: '/(app)/(tabs)/scan',     color: theme.accent, highlighted: false },
  ] as const;

  const statCards = [
    { label: 'Follow-ups Due', value: stats?.followUpsDue ?? 0, icon: 'notifications-outline', color: '#EF4444' },
    { label: 'Total',          value: stats?.total        ?? 0, icon: 'people-outline',        color: '#3B82F6' },
    { label: 'This Week',      value: stats?.thisWeek     ?? 0, icon: 'calendar-outline',      color: '#10B981' },
    { label: 'Added Today',    value: stats?.today        ?? 0, icon: 'today-outline',         color: theme.accent },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
      >
        {/* Header */}
        <View className="px-5 pt-6 pb-4 flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View style={{ marginRight: 12 }}>
              <ContactInitials name={fullName} accent={theme.accent} size={44} filled />
              {hasFollowUps && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: '#EF4444',
                    borderWidth: 2,
                    borderColor: theme.bg,
                  }}
                />
              )}
            </View>
            <View>
              <Text style={{ color: theme.textSecondary, fontSize: 14 }}>Good day,</Text>
              <Text style={{ color: theme.textPrimary, fontSize: 22, fontWeight: '700' }}>{firstName}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={{ width: 40, height: 40, backgroundColor: theme.surfaceAlt, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => router.push('/(app)/(tabs)/settings')}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Plan Banner */}
        {plan === 'free' && (
          <TouchableOpacity
            className="mx-5 mb-5 rounded-2xl px-4 py-3 flex-row items-center"
            style={{ backgroundColor: theme.accentTint, borderWidth: 1, borderColor: theme.accent + '30' }}
            onPress={() => router.push('/(app)/upgrade')}
          >
            <Ionicons name="sparkles" size={18} color={theme.accent} />
            <View className="flex-1 ml-3">
              <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600' }}>
                {scanCount} / {scanLimit} free scans used
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 2 }}>
                Upgrade to Pro for unlimited scanning
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Overview — 2x2 grid */}
        <View className="px-5 mb-5">
          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
            Overview
          </Text>
          <View className="flex-row gap-2">
            {statCards.map(({ label, value, icon, color }) => (
              <View
                key={label}
                style={{ flex: 1, minWidth: 0, flexShrink: 1, backgroundColor: theme.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 12, alignItems: 'center' }}
              >
                <Ionicons name={icon as any} size={16} color={color} />
                {stats === undefined ? (
                  <ActivityIndicator color={color} size="small" style={{ marginTop: 4 }} />
                ) : (
                  <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 4 }}>{value}</Text>
                )}
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2, textAlign: 'center' }} numberOfLines={2}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions — single row */}
        <View className="px-5 mb-5">
          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
            Quick Actions
          </Text>
          <View className="flex-row gap-2">
            {quickActions.map(({ icon, label, href, color, highlighted }) => (
              <TouchableOpacity
                key={label}
                style={{
                  flex: 1,
                  minWidth: 0,
                  flexShrink: 1,
                  backgroundColor: highlighted ? theme.accent : theme.surface,
                  borderRadius: 16,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
                onPress={() => router.push(href as any)}
              >
                <View
                  className="w-9 h-9 rounded-xl items-center justify-center mb-1.5"
                  style={{ backgroundColor: highlighted ? 'rgba(255,255,255,0.2)' : color + '22' }}
                >
                  <Ionicons name={icon as any} size={18} color={highlighted ? '#fff' : color} />
                </View>
                <Text
                  style={{
                    color: highlighted ? '#fff' : theme.textSecondary,
                    fontSize: 12,
                    fontWeight: '500',
                    textAlign: 'center',
                  }}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Contacts — vertical list */}
        <View className="px-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              Recent Contacts
            </Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/contacts')}>
              <Text style={{ color: theme.accent }} className="text-sm">See all</Text>
            </TouchableOpacity>
          </View>

          {recentContacts === undefined && (
            <View
              style={{ backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 24, alignItems: 'center' }}
            >
              <ActivityIndicator color={theme.accent} />
            </View>
          )}

          {recentContacts?.length === 0 && (
            <View
              style={{ backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 40, alignItems: 'center' }}
            >
              <Ionicons name="scan-outline" size={40} color={theme.textMuted} />
              <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                No contacts yet.{'\n'}Scan your first business card to get started.
              </Text>
              <TouchableOpacity
                className="mt-4 px-5 py-2.5 rounded-xl"
                style={{ backgroundColor: theme.accent }}
                onPress={() => router.push('/(app)/(tabs)/scan')}
              >
                <Text className="text-white text-sm font-semibold">Scan a Card</Text>
              </TouchableOpacity>
            </View>
          )}

          {recentContacts && recentContacts.length > 0 && (
            <View
              style={{ backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' }}
            >
              {recentContacts.map((contact, index) => {
                const contactName = `${contact.firstName} ${contact.lastName}`.trim();
                const isLast      = index === recentContacts.length - 1;
                return (
                  <TouchableOpacity
                    key={contact._id}
                    onPress={() => router.push({ pathname: '/(app)/contact/[id]', params: { id: contact._id } })}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: theme.border,
                    }}
                  >
                    <ContactInitials name={contactName} accent={theme.accent} filled />
                    <View className="flex-1 ml-3">
                      <Text style={{ color: theme.textPrimary, fontSize: 14, fontWeight: '600' }}>{contactName}</Text>
                      {(contact.designation || contact.company) && (
                        <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                          {[contact.designation, contact.company].filter(Boolean).join(' · ')}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

