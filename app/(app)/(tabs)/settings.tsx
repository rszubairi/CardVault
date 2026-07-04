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
import { useLanguageStore } from '../../../src/stores/languageStore';
import { useAppTheme } from '../../../src/theme/useAppTheme';
import { useTranslation } from '../../../src/i18n/useTranslation';
import { LANGUAGES } from '../../../src/i18n/translations';
import { syncAllToDevice, hasBeenSynced } from '../../../src/lib/deviceContacts';
import { generateSalt, hashPIN, deriveKey } from '../../../src/lib/encryption';
import Constants from 'expo-constants';
import { isEnterprise } from '../../../src/config/appVariant';

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
  accent: string;
};

function Row({ icon, label, value, badge, toggle, toggleValue, onToggle, onPress, danger, accent }: SettingRow) {
  const theme = useAppTheme();
  return (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border + '80' }}
      onPress={onPress}
      disabled={toggle || !onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Ionicons name={icon as any} size={20} color={danger ? theme.error : accent} />
      <Text style={{ flex: 1, marginLeft: 16, fontSize: 16, color: danger ? theme.error : theme.textPrimary }}>
        {label}
      </Text>
      {badge && <Badge label={badge} variant="primary" />}
      {value && <Text style={{ color: theme.textMuted, fontSize: 14 }}>{value}</Text>}
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: theme.surfaceAlt, true: accent }}
          thumbColor="#fff"
        />
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      ) : null}
    </TouchableOpacity>
  );
}

const LOCK_TIMEOUT_SECONDS = [0, 30, 60, 300];

// ─── PIN change modal ─────────────────────────────────────────────────────────

const PIN_LEN = 6;
const NUMPAD_KEYS = ['1','2','3','4','5','6','7','8','9','','0','del'];

function PinDots({ pin, accent }: { pin: string; accent: string }) {
  return (
    <View className="flex-row gap-x-3 my-4 justify-center">
      {Array.from({ length: PIN_LEN }).map((_, i) => (
        <View
          key={i}
          className="w-3 h-3 rounded-full border-2"
          style={i < pin.length
            ? { backgroundColor: accent, borderColor: accent }
            : { backgroundColor: 'transparent', borderColor: '#64748B' }
          }
        />
      ))}
    </View>
  );
}

function NumPad({ onPress }: { onPress: (k: string) => void }) {
  const theme = useAppTheme();
  return (
    <View style={{ width: '100%', maxWidth: 280, alignSelf: 'center' }}>
      {[0, 1, 2, 3].map((row) => (
        <View key={row} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          {NUMPAD_KEYS.slice(row * 3, row * 3 + 3).map((key, col) => (
            <TouchableOpacity
              key={col}
              onPress={() => key && onPress(key)}
              disabled={!key}
              style={{ width: 80, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: key ? theme.surfaceAlt : 'transparent' }}
            >
              {key === 'del' ? (
                <Ionicons name="backspace-outline" size={22} color={theme.textPrimary} />
              ) : (
                <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '600' }}>{key}</Text>
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
  const { syncToPhone, setSyncToPhone, colorScheme, setColorScheme } = useSettingsStore();
  const { language, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [languageModalVisible, setLanguageModalVisible] = React.useState(false);
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
        Alert.alert(t.incorrectPin, t.incorrectPinMsg);
        setPinInput('');
        return;
      }
      setPinOldHash(hash);
      setPinInput('');
      setPinModalMode('change-new');
      setPinModalTitle(t.enterNewPin);
      return;
    }

    if (pinModalMode === 'change-new') {
      setPinFirstNew(pin);
      setPinInput('');
      setPinModalMode('change-confirm');
      setPinModalTitle(t.confirmNewPin);
      return;
    }

    if (pinModalMode === 'change-confirm') {
      if (pin !== pinFirstNew) {
        Alert.alert(t.pinsMismatch, t.pinsMismatchMsg);
        setPinInput('');
        setPinModalMode('change-new');
        setPinModalTitle(t.enterNewPin);
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
        Alert.alert(t.pinUpdated, t.pinUpdatedMsg);
      } catch {
        Alert.alert(t.error, t.errorUpdatePin);
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
      setPinModalTitle(t.confirmPin);
      return;
    }

    if (pinModalMode === 'enable-confirm') {
      if (pin !== pinFirstNew) {
        Alert.alert(t.pinsMismatch, t.pinsMismatchMsg);
        setPinInput('');
        setPinModalMode('enable-new');
        setPinModalTitle(t.createPin);
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
        Alert.alert(t.encryptionEnabled, t.encryptionEnabledMsg);
      } catch {
        Alert.alert(t.error, t.errorEnableEncryption);
      } finally {
        setPinLoading(false);
        setPinInput('');
      }
      return;
    }

    if (pinModalMode === 'disable') {
      const hash = await hashPIN(pin, encryptionConfig.pinSalt!);
      if (hash !== encryptionConfig.pinHash) {
        Alert.alert(t.incorrectPin, t.incorrectPinMsg2);
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
        Alert.alert(t.encryptionDisabled, t.encryptionDisabledMsg);
      } catch {
        Alert.alert(t.error, t.errorDisableEncryption);
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
    setPinModalTitle(t.enterCurrentPin);
    setPinModalVisible(true);
  };

  const openEnableEncryption = () => {
    setPinInput('');
    setPinFirstNew('');
    setPinModalMode('enable-new');
    setPinModalTitle(t.createPin);
    setPinModalVisible(true);
  };

  const openDisableEncryption = () => {
    Alert.alert(
      t.disableEncryptionTitle,
      t.disableEncryptionMsg,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.disable,
          style: 'destructive',
          onPress: () => {
            setPinInput('');
            setPinModalMode('disable');
            setPinModalTitle(t.enterPinToConfirm);
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
      Alert.alert(t.saved, t.profileUpdated);
    } catch {
      Alert.alert(t.error, t.errorSaveProfile);
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

  const handleColorScheme = () => {
    const labels: Record<string, string> = { dark: 'Dark', light: 'Light', system: 'System' };
    Alert.alert(
      'Appearance',
      'Choose how CardVault looks',
      [
        { text: `Dark${colorScheme === 'dark' ? ' ✓' : ''}`,   onPress: () => setColorScheme('dark') },
        { text: `Light${colorScheme === 'light' ? ' ✓' : ''}`, onPress: () => setColorScheme('light') },
        { text: `System${colorScheme === 'system' ? ' ✓' : ''}`, onPress: () => setColorScheme('system') },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

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
        Alert.alert(t.notAvailable, t.biometricNotAvailable);
        return;
      }
      const confirmed = await authenticate(`Confirm to enable ${biometricType} lock`);
      if (!confirmed) return;
    }
    setBiometricEnabled(value);
    await saveBiometricPreference(value).catch(() => {});
  };

  const getLockTimeoutLabel = (seconds: number) => {
    if (seconds === 0)   return t.immediately;
    if (seconds === 30)  return t.seconds30;
    if (seconds === 60)  return t.minute1;
    if (seconds === 300) return t.minutes5;
    return t.seconds30;
  };

  const handleLockTimeout = () => {
    const current = getLockTimeoutLabel(lockTimeout);
    Alert.alert(
      t.lockTimeoutTitle,
      `${t.lockTimeoutCurrent}: ${current}\n\n${t.lockTimeoutMsg}`,
      [
        ...LOCK_TIMEOUT_SECONDS.map((seconds) => ({
          text: getLockTimeoutLabel(seconds) + (seconds === lockTimeout ? ` (${t.selected})` : ''),
          onPress: async () => {
            setLockTimeout(seconds);
            await saveLockTimeout(seconds).catch(() => {});
          },
        })),
        { text: t.cancel, style: 'cancel' as const },
      ],
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      t.signOutTitle,
      t.signOutMsg,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.signOut,
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

  const planLabel = plan === 'free' ? t.planFree : plan === 'personal_pro' ? t.planPersonalPro : t.planEnterprise;
  const currentLanguageLabel = LANGUAGES.find((l) => l.code === language)?.nativeLabel ?? 'English';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top']}>
      {/* PIN entry modal */}
      <Modal
        visible={pinModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { if (!pinLoading) setPinModalVisible(false); }}
      >
        <View style={{ flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 48 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
            <TouchableOpacity onPress={() => { if (!pinLoading) setPinModalVisible(false); }}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '600', marginLeft: 16 }}>{pinModalTitle}</Text>
          </View>

          {pinLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={{ color: theme.textSecondary, marginTop: 16 }}>{t.updatingEncryption}</Text>
            </View>
          ) : (
            <>
              <PinDots pin={pinInput} accent={theme.accent} />
              <NumPad onPress={pinKey} />
            </>
          )}
        </View>
      </Modal>

      {/* Language picker modal */}
      <Modal
        visible={languageModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 48 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 32 }}>
            <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '600', marginLeft: 16 }}>{t.selectLanguage}</Text>
          </View>
          <ScrollView>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}
                onPress={async () => {
                  await setLanguage(lang.code);
                  setLanguageModalVisible(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textPrimary, fontSize: 16 }}>{lang.nativeLabel}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{lang.label}</Text>
                </View>
                {language === lang.code && (
                  <Ionicons name="checkmark" size={20} color={theme.accent} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} style={{ backgroundColor: theme.bg }}>
        {/* Profile */}
        <View className="px-5 pt-6 pb-5">
          <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 20 }}>{t.settings}</Text>
          <Card className="p-4 flex-row items-center">
            <View className="w-14 h-14 rounded-full items-center justify-center" style={{ backgroundColor: theme.accent + "30" }}>
              <Text style={{ color: theme.accent, fontSize: 20, fontWeight: "bold" }}>
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </Text>
            </View>
            <View className="flex-1 ml-4">
              <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '600' }}>
                {user?.name ?? 'User'}
              </Text>
              <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 2 }}>{user?.email ?? ''}</Text>
            </View>
            <Badge label={planLabel} variant={plan === 'free' ? 'neutral' : 'primary'} />
          </Card>
        </View>

        {/* Profile Details */}
        <View className="mb-6 px-5">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
            {t.profile}
          </Text>
          <Card variant="outlined" className="p-4 gap-y-4">
            <View>
              <Text className="text-slate-400 text-xs mb-1 ml-1">{t.email}</Text>
              <View className="flex-row items-center bg-surface-700 rounded-xl px-3 py-3">
                <Ionicons name="mail-outline" size={16} color={theme.accent} />
                <Text className="text-slate-400 ml-2 text-sm flex-1">{user?.email}</Text>
              </View>
            </View>

            <View>
              <Text className="text-slate-400 text-xs mb-1 ml-1">{t.phoneNumber}</Text>
              <View className="flex-row items-center bg-surface-700 rounded-xl px-3 py-3">
                <Ionicons name="call-outline" size={16} color={theme.accent} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t.addPhoneNumber}
                  placeholderTextColor="#475569"
                  keyboardType="phone-pad"
                  className="flex-1 ml-2 text-sm"
                  style={{ color: '#e2e8f0' }}
                />
              </View>
            </View>

            <View>
              <Text className="text-slate-400 text-xs mb-1 ml-1">{t.linkedinProfile}</Text>
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

            {convexUser?.corporateEmail && (
              <View>
                <Text className="text-slate-400 text-xs mb-1 ml-1">Corporate Email</Text>
                <View className="flex-row items-center bg-surface-700 rounded-xl px-3 py-3">
                  <Ionicons name="briefcase-outline" size={16} color={theme.accent} />
                  <Text className="text-slate-300 ml-2 text-sm flex-1">{convexUser.corporateEmail}</Text>
                  <View style={{ backgroundColor: theme.accent + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
                    <Text style={{ color: theme.accent, fontSize: 10, fontWeight: '700' }}>ENTERPRISE</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={profileSaving}
              className="rounded-xl py-3 items-center mt-1" style={{ backgroundColor: theme.accent }}
            >
              {profileSaving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text className="text-white text-sm font-semibold">{t.saveProfile}</Text>
              }
            </TouchableOpacity>
          </Card>
        </View>

        {/* Subscription */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
            {t.subscription}
          </Text>
          <Card variant="outlined" className="mx-5">
            <Row
              icon="flash-outline"
              label={t.currentPlan}
              value={planLabel}
              onPress={plan === 'enterprise' ? undefined : () => router.push('/(app)/upgrade')}
              accent={theme.accent}
            />
            {plan === 'free' && (
              <Row
                icon="scan-outline"
                label={t.scansUsed}
                value={`${scanCount} / ${scanLimit}`}
                onPress={() => {}}
                accent={theme.accent}
              />
            )}
            {plan !== 'enterprise' && (
              <Row
                icon="card-outline"
                label={plan === 'personal_pro' ? 'Upgrade to Enterprise' : t.upgradeToPro}
                badge={plan === 'personal_pro' ? 'USD 15/mo' : 'USD 10/yr'}
                onPress={() => router.push('/(app)/upgrade')}
                accent={theme.accent}
              />
            )}
          </Card>
        </View>

        {/* Preferences */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
            {t.preferences}
          </Text>
          <Card variant="outlined" className="mx-5">
            <Row
              icon="moon-outline"
              label="Appearance"
              value={colorScheme === 'dark' ? 'Dark' : colorScheme === 'light' ? 'Light' : 'System'}
              onPress={handleColorScheme}
              accent={theme.accent}
            />
            <Row
              icon="notifications-outline"
              label={t.notifications}
              toggle
              toggleValue={notifications}
              onToggle={setNotifications}
            accent={theme.accent}
              />
            <Row
              icon="people-circle-outline"
              label={t.syncToPhoneContacts}
              toggle
              toggleValue={syncToPhone}
              onToggle={handleSyncToPhoneToggle}
            accent={theme.accent}
              />
            <Row
              icon="language-outline"
              label={t.language}
              value={currentLanguageLabel}
              onPress={() => setLanguageModalVisible(true)}
            accent={theme.accent}
              />
          </Card>
        </View>

        {/* Security */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
            {t.security}
          </Text>
          <Card variant="outlined" className="mx-5">
            <Row
              icon="finger-print-outline"
              label={biometricAvailable ? `${biometricType} Lock` : t.biometricLock}
              toggle
              toggleValue={biometricEnabled}
              onToggle={handleBiometricToggle}
            accent={theme.accent}
              />
            {biometricEnabled && (
              <Row
                icon="timer-outline"
                label={t.lockTimeout}
                value={getLockTimeoutLabel(lockTimeout)}
                onPress={handleLockTimeout}
              accent={theme.accent}
              />
            )}
          </Card>
        </View>

        {/* Data Encryption */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
            {t.dataEncryption}
          </Text>
          <Card variant="outlined" className="mx-5">
            <View className="px-5 py-4 border-b border-surface-700/50 flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.accent} />
              <View className="flex-1 ml-4">
                <Text className="text-slate-200 text-base">{t.contactEncryption}</Text>
                <Text className="text-slate-500 text-xs mt-0.5">
                  {encryptionEnabled ? t.encryptionEnabledDesc : t.encryptionDisabledDesc}
                </Text>
              </View>
              <View className={`px-2 py-0.5 rounded-full ${encryptionEnabled ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                <Text className={`text-xs font-medium ${encryptionEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {encryptionEnabled ? t.on : t.off}
                </Text>
              </View>
            </View>

            {!encryptionEnabled && (
              <Row
                icon="lock-closed-outline"
                label={t.enableEncryption}
                onPress={openEnableEncryption}
              accent={theme.accent}
              />
            )}

            {encryptionEnabled && (
              <>
                <Row
                  icon="key-outline"
                  label={t.changePin}
                  onPress={openChangePIN}
                accent={theme.accent}
              />
                <Row
                  icon="lock-open-outline"
                  label={t.disableEncryption}
                  onPress={openDisableEncryption}
                  danger
                accent={theme.accent}
              />
              </>
            )}
          </Card>
        </View>

        {/* Organization — enterprise build only */}
        {isEnterprise && (
          <View className="mb-6">
            <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
              {t.organization}
            </Text>
            <Card variant="outlined" className="mx-5">
              <Row icon="business-outline" label={t.myOrganization} onPress={() => router.push('/(app)/org/')} accent={theme.accent} />
              <Row icon="people-outline"   label={t.followUps}      onPress={() => router.push('/(app)/follow-ups')} accent={theme.accent} />
            </Card>
          </View>
        )}

        {/* Data */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
            {t.data}
          </Text>
          <Card variant="outlined" className="mx-5">
            <Row icon="download-outline"     label={t.exportContacts} onPress={() => router.push('/(app)/export')} accent={theme.accent}
              />
            <Row icon="cloud-upload-outline" label={t.importContacts} onPress={() => router.push('/(app)/import')} accent={theme.accent}
              />
            <Row icon="sync-outline"         label={t.syncStatus}     value={t.synced} onPress={() => {}} accent={theme.accent}
              />
          </Card>
        </View>

        {/* Super Admin */}
        {isAdmin && (
          <View className="mb-6">
            <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
              {t.superAdmin}
            </Text>
            <Card variant="outlined" className="mx-5">
              <View className="px-5 py-3 border-b border-surface-700/50">
                <View className="flex-row items-center gap-x-2">
                  <View className="w-2 h-2 rounded-full bg-emerald-400" />
                  <Text className="text-emerald-400 text-xs font-medium">{t.adminAccessActive}</Text>
                </View>
                <Text className="text-slate-500 text-xs mt-1">
                  App v{Constants.expoConfig?.version ?? '—'} · {user?.email}
                </Text>
              </View>
              <Row
                icon="rocket-outline"
                label="Release Management"
                onPress={() => router.push('/(app)/admin/releases')}
              accent={theme.accent}
              />
            </Card>
          </View>
        )}

        {/* Account */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
            {t.account}
          </Text>
          <Card variant="outlined" className="mx-5">
            <Row icon="shield-outline"             label={t.privacyPolicy} onPress={() => router.push('/(app)/privacy')} accent={theme.accent}
              />
            <Row icon="information-circle-outline" label={t.about}         value="v1.0.0" onPress={() => {}} accent={theme.accent}
              />
            <Row
              icon="log-out-outline"
              label={t.signOut}
              onPress={handleSignOut}
              danger
            accent={theme.accent}
              />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

