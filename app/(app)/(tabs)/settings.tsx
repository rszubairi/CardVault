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

function SettingsCard({ children, style }: { children: React.ReactNode; style?: any }) {
  const theme = useAppTheme();
  return (
    <View
      style={[
        { backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
        style,
      ]}
    >
      {children}
    </View>
  );
}

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

const DELETION_REASONS = [
  'Not using the app anymore',
  'Privacy concerns',
  'Found a better alternative',
  'Too expensive',
  'Technical issues',
  'Other',
];

// ─── PIN change modal ─────────────────────────────────────────────────────────

const PIN_LEN = 6;
const NUMPAD_KEYS = ['1','2','3','4','5','6','7','8','9','','0','del'];

function PinDots({ pin, accent }: { pin: string; accent: string }) {
  const theme = useAppTheme();
  return (
    <View className="flex-row gap-x-3 my-4 justify-center">
      {Array.from({ length: PIN_LEN }).map((_, i) => (
        <View
          key={i}
          className="w-3 h-3 rounded-full border-2"
          style={i < pin.length
            ? { backgroundColor: accent, borderColor: accent }
            : { backgroundColor: 'transparent', borderColor: theme.border }
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
  const requestAccountDeletion = useMutation(api.users.requestAccountDeletion);
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

  // Delete-account modal state
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [reasonPickerVisible, setReasonPickerVisible] = React.useState(false);
  const [deleteReason, setDeleteReason] = React.useState<string | null>(null);
  const [deleteComment, setDeleteComment] = React.useState('');
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false);

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

  const openDeleteAccount = () => {
    setDeleteReason(null);
    setDeleteComment('');
    setDeleteModalVisible(true);
  };

  const handleConfirmDeleteAccount = () => {
    if (!user?._id || !deleteReason) return;
    Alert.alert(
      'Delete Account?',
      'Your account and data will be scheduled for permanent deletion in 30 days. You can cancel this by simply logging back in before then.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setDeleteSubmitting(true);
            try {
              const { scheduledFor } = await requestAccountDeletion({
                userId: user._id,
                reason: deleteReason,
                comment: deleteComment.trim() || undefined,
              });
              const scheduledDate = new Date(scheduledFor).toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric',
              });
              setDeleteModalVisible(false);
              Alert.alert(
                'Deletion Scheduled',
                `Your account and data will be permanently deleted on ${scheduledDate}. Log back in before then to cancel this request.`,
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      await clearSession();
                      signOut();
                      router.replace('/(auth)/');
                    },
                  },
                ],
              );
            } catch {
              Alert.alert(t.error, 'Could not schedule account deletion. Please try again.');
            } finally {
              setDeleteSubmitting(false);
            }
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

      {/* Delete account modal */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => { if (!deleteSubmitting) setDeleteModalVisible(false); }}
      >
        <View style={{ flex: 1, backgroundColor: theme.bg, paddingHorizontal: 24, paddingTop: 48 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <TouchableOpacity onPress={() => { if (!deleteSubmitting) setDeleteModalVisible(false); }}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
            <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '600', marginLeft: 16 }}>Delete Account</Text>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 24 }}>
              We're sorry to see you go. Once submitted, your account and all data will be scheduled
              for permanent deletion in 30 days. You can cancel this at any time simply by logging back in
              before the scheduled date.
            </Text>

            <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 6, marginLeft: 2 }}>
              Reason for leaving *
            </Text>
            <TouchableOpacity
              onPress={() => setReasonPickerVisible(true)}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                backgroundColor: theme.surfaceAlt, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 20,
              }}
            >
              <Text style={{ color: deleteReason ? theme.textPrimary : theme.textMuted, fontSize: 15 }}>
                {deleteReason ?? 'Select a reason'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={theme.textMuted} />
            </TouchableOpacity>

            <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 6, marginLeft: 2 }}>
              Additional comments (optional)
            </Text>
            <TextInput
              value={deleteComment}
              onChangeText={setDeleteComment}
              placeholder="Tell us more..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: theme.surfaceAlt, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                color: theme.textPrimary, fontSize: 15, minHeight: 96, textAlignVertical: 'top', marginBottom: 28,
              }}
            />

            <TouchableOpacity
              onPress={handleConfirmDeleteAccount}
              disabled={!deleteReason || deleteSubmitting}
              style={{
                borderRadius: 14, paddingVertical: 15, alignItems: 'center',
                backgroundColor: theme.error, opacity: !deleteReason || deleteSubmitting ? 0.5 : 1,
              }}
            >
              {deleteSubmitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Request Account Deletion</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Reason picker sheet */}
        <Modal
          visible={reasonPickerVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setReasonPickerVisible(false)}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
            activeOpacity={1}
            onPress={() => setReasonPickerVisible(false)}
          >
            <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 }}>
                <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '600' }}>Select a reason</Text>
                <TouchableOpacity onPress={() => setReasonPickerVisible(false)}>
                  <Ionicons name="close" size={22} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              {DELETION_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  onPress={() => {
                    setDeleteReason(reason);
                    setReasonPickerVisible(false);
                  }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: theme.border,
                  }}
                >
                  <Text style={{ color: theme.textPrimary, fontSize: 15 }}>{reason}</Text>
                  {deleteReason === reason && <Ionicons name="checkmark" size={20} color={theme.accent} />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} style={{ backgroundColor: theme.bg }}>
        {/* Profile */}
        <View className="px-5 pt-6 pb-5">
          <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 20 }}>{t.settings}</Text>
          <SettingsCard style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
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
          </SettingsCard>
        </View>

        {/* Profile Details */}
        <View className="mb-6 px-5">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
            {t.profile}
          </Text>
          <SettingsCard style={{ padding: 16, gap: 16 }}>
            <View>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, marginLeft: 4 }}>{t.email}</Text>
              <View className="flex-row items-center rounded-xl px-3 py-3" style={{ backgroundColor: theme.surfaceAlt }}>
                <Ionicons name="mail-outline" size={16} color={theme.accent} />
                <Text style={{ color: theme.textSecondary, marginLeft: 8, fontSize: 14, flex: 1 }}>{user?.email}</Text>
              </View>
            </View>

            <View>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, marginLeft: 4 }}>{t.phoneNumber}</Text>
              <View className="flex-row items-center rounded-xl px-3 py-3" style={{ backgroundColor: theme.surfaceAlt }}>
                <Ionicons name="call-outline" size={16} color={theme.accent} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t.addPhoneNumber}
                  placeholderTextColor={theme.textMuted}
                  keyboardType="phone-pad"
                  className="flex-1 ml-2 text-sm"
                  style={{ color: theme.textPrimary }}
                />
              </View>
            </View>

            <View>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, marginLeft: 4 }}>{t.linkedinProfile}</Text>
              <View className="flex-row items-center rounded-xl px-3 py-3" style={{ backgroundColor: theme.surfaceAlt }}>
                <Ionicons name="logo-linkedin" size={16} color="#0A66C2" />
                <Text style={{ color: theme.textMuted, marginLeft: 8, fontSize: 14 }}>linkedin.com/in/</Text>
                <TextInput
                  value={linkedinHandle}
                  onChangeText={setLinkedinHandle}
                  placeholder="yourname"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  className="flex-1 text-sm"
                  style={{ color: theme.textPrimary }}
                />
              </View>
            </View>

            {convexUser?.corporateEmail && (
              <View>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 4, marginLeft: 4 }}>Corporate Email</Text>
                <View className="flex-row items-center rounded-xl px-3 py-3" style={{ backgroundColor: theme.surfaceAlt }}>
                  <Ionicons name="briefcase-outline" size={16} color={theme.accent} />
                  <Text style={{ color: theme.textPrimary, marginLeft: 8, fontSize: 14, flex: 1 }}>{convexUser.corporateEmail}</Text>
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
          </SettingsCard>
        </View>

        {/* Subscription */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
            {t.subscription}
          </Text>
          <SettingsCard style={{ marginHorizontal: 20 }}>
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
          </SettingsCard>
        </View>

        {/* Preferences */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
            {t.preferences}
          </Text>
          <SettingsCard style={{ marginHorizontal: 20 }}>
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
          </SettingsCard>
        </View>

        {/* Security */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
            {t.security}
          </Text>
          <SettingsCard style={{ marginHorizontal: 20 }}>
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
          </SettingsCard>
        </View>

        {/* Data Encryption */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
            {t.dataEncryption}
          </Text>
          <SettingsCard style={{ marginHorizontal: 20 }}>
            <View
              style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border, flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={theme.accent} />
              <View className="flex-1 ml-4">
                <Text style={{ color: theme.textPrimary, fontSize: 16 }}>{t.contactEncryption}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                  {encryptionEnabled ? t.encryptionEnabledDesc : t.encryptionDisabledDesc}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 999,
                  backgroundColor: encryptionEnabled ? theme.success + '20' : theme.surfaceAlt,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '500', color: encryptionEnabled ? theme.success : theme.textMuted }}>
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
          </SettingsCard>
        </View>

        {/* Organization — enterprise build only */}
        {isEnterprise && (
          <View className="mb-6">
            <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
              {t.organization}
            </Text>
            <SettingsCard style={{ marginHorizontal: 20 }}>
              <Row icon="business-outline" label={t.myOrganization} onPress={() => router.push('/(app)/org/')} accent={theme.accent} />
              <Row icon="people-outline"   label={t.followUps}      onPress={() => router.push('/(app)/follow-ups')} accent={theme.accent} />
            </SettingsCard>
          </View>
        )}

        {/* Data */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
            {t.data}
          </Text>
          <SettingsCard style={{ marginHorizontal: 20 }}>
            <Row icon="download-outline"     label={t.exportContacts} onPress={() => router.push('/(app)/export')} accent={theme.accent}
              />
            <Row icon="cloud-upload-outline" label={t.importContacts} onPress={() => router.push('/(app)/import')} accent={theme.accent}
              />
            <Row icon="sync-outline"         label={t.syncStatus}     value={t.synced} onPress={() => {}} accent={theme.accent}
              />
          </SettingsCard>
        </View>

        {/* Super Admin */}
        {isAdmin && (
          <View className="mb-6">
            <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
              {t.superAdmin}
            </Text>
            <SettingsCard style={{ marginHorizontal: 20 }}>
              <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <View className="flex-row items-center gap-x-2">
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.success }} />
                  <Text style={{ color: theme.success, fontSize: 12, fontWeight: '500' }}>{t.adminAccessActive}</Text>
                </View>
                <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>
                  App v{Constants.expoConfig?.version ?? '—'} · {user?.email}
                </Text>
              </View>
              <Row
                icon="rocket-outline"
                label="Release Management"
                onPress={() => router.push('/(app)/admin/releases')}
              accent={theme.accent}
              />
            </SettingsCard>
          </View>
        )}

        {/* Account */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
            {t.account}
          </Text>
          <SettingsCard style={{ marginHorizontal: 20 }}>
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
          </SettingsCard>
        </View>

        {/* Danger Zone */}
        <View className="mb-6">
          <Text style={{ color: theme.textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 20, marginBottom: 8 }}>
            Danger Zone
          </Text>
          <SettingsCard style={{ marginHorizontal: 20 }}>
            <Row
              icon="trash-outline"
              label="Delete Account"
              onPress={openDeleteAccount}
              danger
              accent={theme.accent}
            />
          </SettingsCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

