import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../src/stores/authStore';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { clearSession } from '../../../src/lib/auth';
import Card from '../../../src/components/ui/Card';
import Badge from '../../../src/components/ui/Badge';

type SettingRow = {
  icon: string;
  label: string;
  value?: string;
  badge?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
};

function Row({ icon, label, value, badge, toggle, toggleValue, onToggle, onPress, danger }: SettingRow) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-5 py-4 border-b border-surface-700/50"
      onPress={onPress}
      disabled={toggle}
    >
      <Ionicons name={icon as any} size={20} color={danger ? '#EF4444' : '#6366F1'} />
      <Text className={`flex-1 ml-4 text-base ${danger ? 'text-red-400' : 'text-slate-200'}`}>
        {label}
      </Text>
      {badge && <Badge label={badge} variant="primary" />}
      {value && <Text className="text-slate-500 text-sm">{value}</Text>}
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: '#334155', true: '#6366F1' }}
          thumbColor="#fff"
        />
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#475569" />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const { plan, scanCount, scanLimit } = useSubscriptionStore();
  const [darkMode, setDarkMode] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await clearSession();
            signOut();
            router.replace('/(auth)/');
          },
        },
      ],
    );
  };

  const planLabel = plan === 'free' ? 'Free' : plan === 'personal_pro' ? 'Personal Pro' : 'Enterprise';

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile */}
        <View className="px-5 pt-6 pb-5">
          <Text className="text-slate-50 text-2xl font-bold mb-5">Settings</Text>
          <Card className="p-4 flex-row items-center">
            <View className="w-14 h-14 bg-primary-800 rounded-full items-center justify-center">
              <Text className="text-primary-300 text-xl font-bold">
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </Text>
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-slate-50 text-base font-semibold">
                {user?.name ?? 'User'}
              </Text>
              <Text className="text-slate-400 text-sm mt-0.5">{user?.email ?? ''}</Text>
            </View>
            <Badge label={planLabel} variant={plan === 'free' ? 'neutral' : 'primary'} />
          </Card>
        </View>

        {/* Subscription */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs uppercase tracking-widest px-5 mb-2">
            Subscription
          </Text>
          <Card variant="outlined" className="mx-5">
            <Row
              icon="flash-outline"
              label="Current Plan"
              value={planLabel}
              onPress={() => router.push('/(app)/upgrade')}
            />
            {plan === 'free' && (
              <Row
                icon="scan-outline"
                label="Scans Used"
                value={`${scanCount} / ${scanLimit}`}
                onPress={() => {}}
              />
            )}
            <Row
              icon="card-outline"
              label="Upgrade to Pro"
              badge="USD 10/yr"
              onPress={() => router.push('/(app)/upgrade')}
            />
          </Card>
        </View>

        {/* Preferences */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs uppercase tracking-widest px-5 mb-2">
            Preferences
          </Text>
          <Card variant="outlined" className="mx-5">
            <Row
              icon="moon-outline"
              label="Dark Mode"
              toggle
              toggleValue={darkMode}
              onToggle={setDarkMode}
            />
            <Row
              icon="notifications-outline"
              label="Notifications"
              toggle
              toggleValue={notifications}
              onToggle={setNotifications}
            />
            <Row icon="language-outline"  label="Language"  value="English" onPress={() => {}} />
            <Row icon="color-palette-outline" label="Theme" value="Indigo" onPress={() => {}} />
          </Card>
        </View>

        {/* Data */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs uppercase tracking-widest px-5 mb-2">
            Data
          </Text>
          <Card variant="outlined" className="mx-5">
            <Row icon="download-outline"  label="Export Contacts" onPress={() => {}} />
            <Row icon="cloud-upload-outline" label="Import Contacts" onPress={() => {}} />
            <Row icon="sync-outline"      label="Sync Status"    value="Synced" onPress={() => {}} />
          </Card>
        </View>

        {/* Account */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs uppercase tracking-widest px-5 mb-2">
            Account
          </Text>
          <Card variant="outlined" className="mx-5">
            <Row icon="shield-outline"    label="Privacy" onPress={() => {}} />
            <Row icon="information-circle-outline" label="About" value="v1.0.0" onPress={() => {}} />
            <Row
              icon="log-out-outline"
              label="Sign Out"
              onPress={handleSignOut}
              danger
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
