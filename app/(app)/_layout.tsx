import React, { useEffect, useRef, useState } from 'react';
import {
  Stack,
  Redirect,
} from 'expo-router';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  AppState,
  AppStateStatus,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';
import { useSecurityStore } from '../../src/stores/securityStore';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { syncAllToDevice, hasBeenSynced } from '../../src/lib/deviceContacts';
import { useSettingsStore } from '../../src/stores/settingsStore';
import {
  loadBiometricPreference,
  loadLockTimeout,
  authenticate,
} from '../../src/lib/biometric';
import { hapticSuccess, hapticError } from '../../src/lib/haptics';

// â”€â”€â”€ Lock Screen Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [authenticating, setAuthenticating] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleAuthenticate = async () => {
    if (authenticating) return;
    setAuthenticating(true);
    setFailed(false);
    try {
      const success = await authenticate('Unlock CardVault');
      if (success) {
        hapticSuccess();
        onUnlock();
      } else {
        hapticError();
        setFailed(true);
      }
    } catch {
      hapticError();
      setFailed(true);
    } finally {
      setAuthenticating(false);
    }
  };

  // Auto-prompt on mount
  useEffect(() => {
    handleAuthenticate();
  }, []);

  return (
    <SafeAreaView style={styles.lockSurface}>
      <View style={styles.lockContent}>
        {/* App Icon placeholder */}
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark" size={52} color="#818CF8" />
        </View>

        <Text style={styles.lockTitle}>CardVault</Text>
        <Text style={styles.lockSubtitle}>
          {failed
            ? 'Authentication failed. Try again.'
            : 'Authenticate to continue'}
        </Text>

        <TouchableOpacity
          style={[styles.unlockBtn, authenticating && styles.unlockBtnDisabled]}
          onPress={handleAuthenticate}
          disabled={authenticating}
          activeOpacity={0.8}
        >
          {authenticating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name={Platform.OS === 'ios' ? 'finger-print' : 'finger-print'}
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.unlockBtnText}>Unlock</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lockSurface: {
    flex:            1,
    backgroundColor: '#0F0F23',
  },
  lockContent: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconWrap: {
    width:           100,
    height:          100,
    borderRadius:    28,
    backgroundColor: 'rgba(99,102,241,0.18)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    28,
  },
  lockTitle: {
    fontSize:    28,
    fontWeight:  '700',
    color:       '#F1F5F9',
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize:    15,
    color:       '#64748B',
    textAlign:   'center',
    marginBottom: 44,
    lineHeight:  22,
  },
  unlockBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: '#6366F1',
    borderRadius:    16,
    paddingVertical: 16,
    paddingHorizontal: 44,
    minWidth:        180,
  },
  unlockBtnDisabled: {
    opacity: 0.6,
  },
  unlockBtnText: {
    color:      '#FFFFFF',
    fontSize:   16,
    fontWeight: '600',
  },
});

// â”€â”€â”€ Security Provider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SecurityProvider({ children }: { children: React.ReactNode }) {
  const {
    biometricEnabled,
    isLocked,
    setBiometricEnabled,
    setLockTimeout,
    lock,
    unlock,
    setBackgroundedAt,
  } = useSecurityStore();

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const initialized = useRef(false);

  // Load biometric preferences from SecureStore on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    Promise.all([loadBiometricPreference(), loadLockTimeout()])
      .then(([enabled, timeout]) => {
        setBiometricEnabled(enabled);
        setLockTimeout(timeout);
        if (enabled) lock();
      })
      .catch(() => {});
  }, []);

  // AppState listener â€” background/foreground transitions
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'background' || nextState === 'inactive') {
        // Record when we went to background
        useSecurityStore.getState().setBackgroundedAt(Date.now());
      }

      if ((prev === 'background' || prev === 'inactive') && nextState === 'active') {
        const s = useSecurityStore.getState();
        if (s.biometricEnabled && s.backgroundedAt !== null) {
          const elapsedSeconds = (Date.now() - s.backgroundedAt) / 1000;
          if (elapsedSeconds >= s.lockTimeout) {
            s.lock();
          }
        }
        s.setBackgroundedAt(null);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <>
      {children}
      <Modal
        visible={biometricEnabled && isLocked}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
      >
        <LockScreen onUnlock={unlock} />
      </Modal>
    </>
  );
}

// â”€â”€â”€ App Layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ContactSyncProvider() {
  const { user } = useAuthStore();
  const { syncToPhone, loaded, loadSettings } = useSettingsStore();
  const contacts = useQuery(api.contacts.list, user ? { userId: user._id } : 'skip');

  useEffect(() => { loadSettings(); }, []);

  useEffect(() => {
    if (!loaded || !syncToPhone || !contacts || contacts.length === 0) return;
    hasBeenSynced().then((synced) => {
      if (!synced) syncAllToDevice(contacts as any[]);
    });
  }, [loaded, syncToPhone, contacts?.length]);

  return null;
}

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-900 items-center justify-center">
        <ActivityIndicator color="#6366F1" size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/" />;
  }

  return (
    <SecurityProvider>
      <ContactSyncProvider />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="contact/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="contact/new"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="scan/result"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="event/[id]"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="upgrade"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="org/index"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="org/create"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="org/invite"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="follow-ups"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="export"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen
          name="import"
          options={{ presentation: 'modal' }}
        />
      </Stack>
    </SecurityProvider>
  );
}

