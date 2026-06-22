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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from 'convex/react';
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
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { syncAllToDevice, hasBeenSynced } from '../../../src/lib/deviceContacts';
import { generateSalt, hashPIN, deriveKey } from '../../../src/lib/encryption';
import Constants from 'expo-constants';

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

// ─── PIN change modal ─────────────────────────────────────────────────────────

const PIN_LEN = 6;
const NUMPAD_KEYS = ['1','2','3','4','5','6','7','8','9','','0','del'];

function PinDots({ pin }: { pin: string }) {
  return (
    <View className="flex-row gap-x-3 my-4 justify-center">
      {Array.from({ length: PIN_LEN }).map((_, i) => (
        <View
          key={i}
          className={`w-3 h-3 rounded-full border-2 ${
            i < pin.length ? 'bg-primary-500 border-primary-500' : 'bg-transparent border-slate-500'
          }`}
        />
      ))}
    </View>
  );
}

function NumPad({ onPress }: { onPress: (k: string) => void }) {
  return (
    <View className="w-full max-w-xs self-center">
      {[0, 1, 2, 3].map((row) => (
        <View key={row} className="flex-row justify-between mb-3">
          {NUMPAD_KEYS.slice(row * 3, row * 3 + 3).map((key, col) => (
            <TouchableOpacity
              key={col}
              onPress={() => key && onPress(key)}
              disabled={!key}
              className={`w-20 h-14 rounded-2xl items-center justify-center ${
                key ? 'bg-surface-700' : 'opacity-0'
              }`}
            >
              {key === 'del' ? (
                <Ionicons name="backspace-outline" size={22} color="#e2e8f0" />
              ) : (
                <Text className="text-slate-100 text-xl font-semibold">{key}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const { user, token, signOut, setUser } = useAuthStore();
  const { plan, scanCount, scanLimit } = useSubscriptionStore();
  const {
    biometricEnabled, setBiometricEnabled, lockTimeout, setLockTimeout,
    encryptionEnabled, pinConfigured, setEncryptionKey, setEncryptionEnabled, setPinConfigured,
  } = useSecurityStore();
  const { syncToPhone, setSyncToPhone } = useSettingsStore();
  const allContacts = useQuery(api.contacts.list, user?._id ? { userId: user._id } : 'skip');
  const updateProfile = useMutation(api.users.updateProfile);
  const setupPINMutation = useMutation(api.users.setupPIN);
  const changePINMutation = useMutation(api.users.changePIN);
  const disableEncryptionMutation = useMutation(api.users.disableEncryption);
  const clearEncryptedPayloadsMutation = useMutation(api.contacts.clearEncryptedPayloads);
  const encryptionConfig = useQuery(
    api.users.getEncryptionConfig,
    user?._id ? { userId: user._id as any } : 'skip',
  );
  const isAdmin = useQuery(
    api.releases.checkIsAdmin,
    user?._id ? { userId: user._id as any } : 'skip',
  );
  const convexUser = useQuery(api.users.getById, user?._id ? { userId: user._id as any } : 'skip');
  const [darkMode, setDarkMode] = React.useState(true);
  const [notifications, setNotifications] = React.useState(true);
  const [biometricType, setBiometricType] = React.useState<BiometricType>('Biometric' as BiometricType);
  const [biometricAvailable, setBiometricAvailable] = React.useState(false);

  const [phone, setPhone] = React.useState('');
  const [linkedinHandle, setLinkedinHandle] = React.useState('');

  // PIN modal state
  type PinModalMode = 'change-old' | 'change-new' | 'change-confirm' | 'enable-new' | 'enable-confirm' | 'disable';
  const [pinModalVisible, setPinModalVisible] = React.useState(false);
  const [pinModalMode, setPinModalMode] = React.useState<PinModalMode>('change-old');
  const [pinModalTitle, setPinModalTitle] = React.useState('');
  const [pinInput, setPinInput] = React.useState('');
  const [pinOldHash, setPinOldHash] = React.useState('');
  const [pinFirstNew, setPinFirstNew] = React.useState('');
  const [pinLoading, setPinLoading] = React.useState(false);

  // Sync encryptionEnabled from server config on load
  React.useEffect(() => {
    if (encryptionConfig) {
      setEncryptionEnabled(encryptionConfig.encryptionEnabled);
      setPinConfigured(!!encryptionConfig.pinHash);
    }
  }, [encryptionConfig]);

  const pinKey = (key: string) => {
    if (key === 'del') { setPinInput((p) => p.slice(0, -1)); return; }
    if (pinInput.length >= PIN_LEN) return;
    const next = pinInput + key;
    setPinInput(next);
    if (next.length === PIN_LEN) setTimeout(() => handlePinComplete(next), 150);
  };

  const handlePinComplete = async (pin: string) => {
    if (!user?._id || !encryptionConfig) return;

    if (pinModalMode === 'change-old') {
      const hash = await hashPIN(pin, encryptionConfig.pinSalt!);
      if (hash !== encryptionConfig.pinHash) {
        Alert.alert('Incorrect PIN', 'The current PIN you entered is wrong.');
        setPinInput('');
        return;
      }
      setPinOldHash(hash);
      setPinInput('');
      setPinModalMode('change-new');
      setPinModalTitle('Enter New PIN');
      return;
    }

    if (pinModalMode === 'change-new') {
      setPinFirstNew(pin);
      setPinInput('');
      setPinModalMode('change-confirm');
      setPinModalTitle('Confirm New PIN');
      return;
    }

    if (pinModalMode === 'change-confirm') {
      if (pin !== pinFirstNew) {
        Alert.alert('PINs do not match', 'Please try again.');
        setPinInput('');
        setPinModalMode('change-new');
        setPinModalTitle('Enter New PIN');
        return;
      }
      setPinLoading(true);
      try {
        const newPinSalt        = generateSalt(16);
        const newEncryptionSalt = generateSalt(32);
        const newPinHash        = await hashPIN(pin, newPinSalt);
        const newKey            = await deriveKey(pin, newEncryptionSalt);
        await changePINMutation({
          userId:            user._id as any,
          oldPinHash:        pinOldHash,
          newPinHash,
          newPinSalt,
          newEncryptionSalt,
        });
        setEncryptionKey(newKey);
        setPinModalVisible(false);
        Alert.alert('PIN Updated', 'Your PIN has been changed. Your contacts will re-encrypt on next save.');
      } catch {
        Alert.alert('Error', 'Could not update PIN. Please try again.');
      } finally {
        setPinLoading(false);
        setPinInput('');
      }
      return;
    }

    if (pinModalMode === 'enable-new') {
      setPinFirstNew(pin);
      setPinInput('');
      setPinModalMode('enable-confirm');
      setPinModalTitle('Confirm PIN');
      return;
    }

    if (pinModalMode === 'enable-confirm') {
      if (pin !== pinFirstNew) {
        Alert.alert('PINs do not match', 'Please try again.');
        setPinInput('');
        setPinModalMode('enable-new');
        setPinModalTitle('Create PIN');
        return;
      }
      setPinLoading(true);
      try {
        const pinSalt        = generateSalt(16);
        const encryptionSalt = generateSalt(32);
        const newPinHash     = await hashPIN(pin, pinSalt);
        const key            = await deriveKey(pin, encryptionSalt);
        await setupPINMutation({
          userId: user._id as any,
          pinHash: newPinHash,
          pinSalt,
          encryptionSalt,
        });
        setEncryptionKey(key);
        setEncryptionEnabled(true);
        setPinConfigured(true);
        setPinModalVisible(false);
        Alert.alert('Encryption Enabled', 'Your contacts will now be encrypted with your PIN.');
      } catch {
        Alert.alert('Error', 'Could not enable encryption. Please try again.');
      } finally {
        setPinLoading(false);
        setPinInput('');
      }
      return;
    }

    if (pinModalMode === 'disable') {
      const hash = await hashPIN(pin, encryptionConfig.pinSalt!);
      if (hash !== encryptionConfig.pinHash) {
        Alert.alert('Incorrect PIN', 'The PIN you entered is wrong.');
        setPinInput('');
        return;
      }
      setPinLoading(true);
      try {
        await disableEncryptionMutation({ userId: user._id as any, pinHash: hash });
        await clearEncryptedPayloadsMutation({ userId: user._id as any });
        setEncryptionKey(null);
        setEncryptionEnabled(false);
        setPinConfigured(false);
        setPinModalVisible(false);
        Alert.alert('Encryption Disabled', 'Contact data is no longer encrypted.');
      } catch {
        Alert.alert('Error', 'Could not disable encryption. Please try again.');
      } finally {
        setPinLoading(false);
        setPinInput('');
      }
      return;
    }
  };

  const openChangePIN = () => {
    setPinInput('');
    setPinOldHash('');
    setPinFirstNew('');
    setPinModalMode('change-old');
    setPinModalTitle('Enter Current PIN');
    setPinModalVisible(true);
  };

  const openEnableEncryption = () => {
    setPinInput('');
    setPinFirstNew('');
    setPinModalMode('enable-new');
    setPinModalTitle('Create PIN');
    setPinModalVisible(true);
  };

  const openDisableEncryption = () => {
    Alert.alert(
      'Disable Encryption',
      'This will remove encryption from all your contacts. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: () => {
            setPinInput('');
            setPinModalMode('disable');
            setPinModalTitle('Enter PIN to Confirm');
            setPinModalVisible(true);
          },
        },
      ],
    );
  };

  // Populate fields once Convex data loads
  React.useEffect(() => {
    if (convexUser) {
      setPhone(convexUser.phone ?? '');
      const url = convexUser.linkedinUrl ?? '';
      const prefix = 'https://www.linkedin.com/in/';
      setLinkedinHandle(url.startsWith(prefix) ? url.slice(prefix.length) : url);
    }
  }, [convexUser]);
  const [profileSaving, setProfileSaving] = React.useState(false);

  const handleSaveProfile = async () => {
    if (!user?._id) return;
    setProfileSaving(true);
    try {
      const fullLinkedinUrl = linkedinHandle.trim()
        ? `https://www.linkedin.com/in/${linkedinHandle.trim()}`
        : undefined;
      await updateProfile({
        userId: user._id,
        phone: phone.trim() || undefined,
        linkedinUrl: fullLinkedinUrl,
      });
      const updated = { ...user, phone: phone.trim() || undefined, linkedinUrl: fullLinkedinUrl };
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

  const handleSyncToPhoneToggle = async (value: boolean) => {
    await setSyncToPhone(value);
    if (value && allContacts && allContacts.length > 0) {
      // If turned on and full sync hasn't run yet, kick it off now
      const synced = await hasBeenSynced();
      if (!synced) syncAllToDevice(allContacts as any[]);
    }
  };

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
      {/* PIN entry modal */}
      <Modal
        visible={pinModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { if (!pinLoading) setPinModalVisible(false); }}
      >
        <View className="flex-1 bg-surface-900 px-6 pt-12">
          <View className="flex-row items-center mb-8">
            <TouchableOpacity onPress={() => { if (!pinLoading) setPinModalVisible(false); }}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
            <Text className="text-slate-50 text-xl font-semibold ml-4">{pinModalTitle}</Text>
          </View>

          {pinLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#6366F1" />
              <Text className="text-slate-400 mt-4">Updating encryption…</Text>
            </View>
          ) : (
            <>
              <PinDots pin={pinInput} />
              <NumPad onPress={pinKey} />
            </>
          )}
        </View>
      </Modal>

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
                <Text className="text-slate-500 ml-2 text-sm">linkedin.com/in/</Text>
                <TextInput
                  value={linkedinHandle}
                  onChangeText={setLinkedinHandle}
                  placeholder="yourname"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  className="flex-1 text-sm"
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
            <Row
              icon="people-circle-outline"
              label="Sync to Phone Contacts"
              toggle
              toggleValue={syncToPhone}
              onToggle={handleSyncToPhoneToggle}
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

        {/* Data Encryption */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs uppercase tracking-widest px-5 mb-2">
            Data Encryption
          </Text>
          <Card variant="outlined" className="mx-5">
            <View className="px-5 py-4 border-b border-surface-700/50 flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={20} color="#6366F1" />
              <View className="flex-1 ml-4">
                <Text className="text-slate-200 text-base">Contact Encryption</Text>
                <Text className="text-slate-500 text-xs mt-0.5">
                  {encryptionEnabled
                    ? 'Enabled — sensitive fields are encrypted with your PIN'
                    : 'Disabled — contacts stored in plain text'}
                </Text>
              </View>
              <View className={`px-2 py-0.5 rounded-full ${encryptionEnabled ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                <Text className={`text-xs font-medium ${encryptionEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {encryptionEnabled ? 'ON' : 'OFF'}
                </Text>
              </View>
            </View>

            {!encryptionEnabled && (
              <Row
                icon="lock-closed-outline"
                label="Enable Encryption"
                onPress={openEnableEncryption}
              />
            )}

            {encryptionEnabled && (
              <>
                <Row
                  icon="key-outline"
                  label="Change PIN"
                  onPress={openChangePIN}
                />
                <Row
                  icon="lock-open-outline"
                  label="Disable Encryption"
                  onPress={openDisableEncryption}
                  danger
                />
              </>
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

        {/* Super Admin */}
        {isAdmin && (
          <View className="mb-6">
            <Text className="text-slate-500 text-xs uppercase tracking-widest px-5 mb-2">
              Super Admin
            </Text>
            <Card variant="outlined" className="mx-5">
              <View className="px-5 py-3 border-b border-surface-700/50">
                <View className="flex-row items-center gap-x-2">
                  <View className="w-2 h-2 rounded-full bg-emerald-400" />
                  <Text className="text-emerald-400 text-xs font-medium">Admin Access Active</Text>
                </View>
                <Text className="text-slate-500 text-xs mt-1">
                  App v{Constants.expoConfig?.version ?? '—'} · {user?.email}
                </Text>
              </View>
              <Row
                icon="rocket-outline"
                label="Release Management"
                onPress={() => router.push('/(app)/admin/releases')}
              />
            </Card>
          </View>
        )}

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

