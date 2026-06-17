import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useAuthStore } from '../../../src/stores/authStore';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { useSecurityStore } from '../../../src/stores/securityStore';
import { storeSession } from '../../../src/lib/auth';
import {
  isBiometricAvailable,
  authenticate,
  saveBiometricPreference,
  saveLockTimeout,
  getBiometricType,
  type BiometricType,
} from '../../../src/lib/biometric';
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

const LOCK_TIMEOUT_OPTIONS = [
  { label: 'Immediately', seconds: 0 },
  { label: '30 seconds',  seconds: 30 },
  { label: '1 minute',    seconds: 60 },
  { label: '5 minutes',   seconds: 300 },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, token, signOut, setUser } = useAuthStore();
  const { plan, scanCount, scanLimit } = useSubscriptionStore();
  const { biometricEnabled, setBiometricEnabled, lockTimeout, setLockTimeout } = useSecurityStore();
  const updateProfile = useMutation(api.users.updateProfile);
  const [darkMode, setDarkMode] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);
  const [biometricType, setBiometricType] = React.useState<BiometricType>('Biometric' as BiometricType);
  const [biometricAvailable, setBiometricAvailable] = React.useState(false);

  const [phone, setPhone] = React.useState(user?.phone ?? '');
  const [linkedinUrl, setLinkedinUrl] = React.useState(user?.linkedinUrl ?? '');
  const [profileSaving, setProfileSaving] = React.useState(false);

  const handleSaveProfile = async () => {
    if (!user?._id) return;
    setProfileSaving(true);
    try {
      await updateProfile({
        userId: user._id,
        phone: phone.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
      });
      const updated = { ...user, phone: phone.trim() || undefined, linkedinUrl: linkedinUrl.trim() || undefined };
      setUser(updated as any);
      await storeSession(token ?? '', updated);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  React.useEffect(() => {
    isBiometricAvailable().then((available) => {
      setBiometricAvailable(available);
      if (available) getBiometricType().then(setBiometricType).catch(() => {});
    }).catch(() => {});
  }, []);

  const handleBiometricToggle = async (value: boolean) => {
    if (value) {
      const available = await isBiometricAvailable();
      if (!available) {
        Alert.alert(
          'Not Available',
          'Your device does not have biometric authentication enrolled. Set it up in device Settings first.',
        );
        return;
      }
      const confirmed = await authenticate(`Confirm to enable ${biometricType} lock`);
      if (!confirmed) return;
    }
    setBiometricEnabled(value);
    await saveBiometricPreference(value).catch(() => {});
  };

  const handleLockTimeout = () => {
    const current = LOCK_TIMEOUT_OPTIONS.find((o) => o.seconds === lockTimeout)?.label ?? '30 seconds';
    Alert.alert(
      'Lock Timeout',
      `Current: ${current}\n\nLock the app after being in background for:`,
      [
        ...LOCK_TIMEOUT_OPTIONS.map(({ label, seconds }) => ({
          text: label + (seconds === lockTimeout ? ' âœ“' : ''),
          onPress: async () => {
            setLockTimeout(seconds);
            await saveLockTimeout(seconds).catch(() => {});
          },
        })),
        { text: 'Cancel', style: 'cancel' as const },
      ],
    );
  };

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

        {/* Profile Details */}
        <View className="mb-6 px-5">
          <Text className="text-slate-500 text-xs uppercase tracking-widest mb-3">
            Profile
          </Text>
          <Card variant="outlined" className="p-4 gap-y-4">
            <View>
              <Text className="text-slate-400 text-xs mb-1 ml-1">Email</Text>
              <View className="flex-row items-center bg-surface-700 rounded-xl px-3 py-3">
                <Ionicons name="mail-outline" size={16} color="#6366F1" />
                <Text className="text-slate-400 ml-2 text-sm flex-1">{user?.email}</Text>
              </View>
            </View>

            <View>
              <Text className="text-slate-400 text-xs mb-1 ml-1">Phone Number</Text>
              <View className="flex-row items-center bg-surface-700 rounded-xl px-3 py-3">
                <Ionicons name="call-outline" size={16} color="#6366F1" />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Add phone number"
                  placeholderTextColor="#475569"
                  keyboardType="phone-pad"
                  className="flex-1 ml-2 text-sm"
                  style={{ color: '#e2e8f0' }}
                />
              </View>
            </View>

            <View>
              <Text className="text-slate-400 text-xs mb-1 ml-1">LinkedIn Profile</Text>
              <View className="flex-row items-center bg-surface-700 rounded-xl px-3 py-3">
                <Ionicons name="logo-linkedin" size={16} color="#0A66C2" />
                <TextInput
                  value={linkedinUrl}
                  onChangeText={setLinkedinUrl}
                  placeholder="https://linkedin.com/in/yourname"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  keyboardType="url"
                  className="flex-1 ml-2 text-sm"
                  style={{ color: '#e2e8f0' }}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={profileSaving}
              className="bg-primary-500 rounded-xl py-3 items-center mt-1"
            >
              {profileSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text className="text-white text-sm font-semibold">Save Profile</Text>
              }
            </TouchableOpacity>
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

        {/* Security */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs uppercase tracking-widest px-5 mb-2">
            Security
          </Text>
          <Card variant="outlined" className="mx-5">
            <Row
              icon="finger-print-outline"
              label={biometricAvailable ? `${biometricType} Lock` : 'Biometric Lock'}
              toggle
              toggleValue={biometricEnabled}
              onToggle={handleBiometricToggle}
            />
            {biometricEnabled && (
              <Row
                icon="timer-outline"
                label="Lock Timeout"
                value={LOCK_TIMEOUT_OPTIONS.find((o) => o.seconds === lockTimeout)?.label ?? '30 seconds'}
                onPress={handleLockTimeout}
              />
            )}
          </Card>
        </View>

        {/* Organization */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs uppercase tracking-widest px-5 mb-2">
            Organization
          </Text>
          <Card variant="outlined" className="mx-5">
            <Row icon="business-outline"  label="My Organization" onPress={() => router.push('/(app)/org/')} />
            <Row icon="people-outline"    label="Follow-ups"      onPress={() => router.push('/(app)/follow-ups')} />
          </Card>
        </View>

        {/* Data */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs uppercase tracking-widest px-5 mb-2">
            Data
          </Text>
          <Card variant="outlined" className="mx-5">
            <Row icon="download-outline"     label="Export Contacts" onPress={() => router.push('/(app)/export')} />
            <Row icon="cloud-upload-outline" label="Import Contacts" onPress={() => router.push('/(app)/import')} />
            <Row icon="sync-outline"         label="Sync Status"     value="Synced" onPress={() => {}} />
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

