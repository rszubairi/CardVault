import '../global.css';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConvexProvider, ConvexReactClient, useMutation } from 'convex/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { loadSession, clearSession } from '../src/lib/auth';
import { useAuthStore } from '../src/stores/authStore';
import { api } from '../convex/_generated/api';
import AnimatedSplashScreen from '../src/components/AnimatedSplashScreen';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

if (Platform.OS !== 'web') {
  Promise.all([
    import('@react-native-firebase/crashlytics').then(m => m.default().setCrashlyticsCollectionEnabled(!__DEV__)),
    import('@react-native-firebase/analytics').then(m => m.default().setAnalyticsCollectionEnabled(!__DEV__)),
  ]);
}

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL ?? '');
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60, retry: 2 },
  },
});

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { setUser, setToken, setLoading, user } = useAuthStore();
  const updatePushToken = useMutation(api.users.updatePushToken);
  const router = useRouter();
  const navigated = useRef(false);
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Hide the native splash screen immediately on mount
  // so our animated version takes over
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    Promise.all([
      loadSession(),
      Platform.OS === 'web'
        ? Promise.resolve(localStorage.getItem('hasSeenOnboarding'))
        : SecureStore.getItemAsync('hasSeenOnboarding'),
    ])
      .then(([session, seen]) => {
        if (seen !== '1' && !navigated.current) {
          navigated.current = true;
          router.replace('/(onboarding)/');
        }

        if (session) {
          const storedUserId = session.user?._id ?? '';
          const isValidConvexId = storedUserId.startsWith('users:') || storedUserId.startsWith('u');
          if (!isValidConvexId) {
            clearSession().then(() => setLoading(false));
          } else {
            setToken(session.token);
            setUser(session.user);
          }
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false))
      .finally(() => setIsBootstrapped(true));
  }, []);

  // Register for push notifications once the user is known
  useEffect(() => {
    if (!user) return;

    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await updatePushToken({ userId: user._id, pushToken: token });
    })().catch(() => { });
  }, [user?._id]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  return (
    <>
      {children}
      {showSplash && (
        <AnimatedSplashScreen
          isReady={isBootstrapped}
          onAnimationComplete={handleSplashComplete}
        />
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexProvider client={convex}>
        <QueryClientProvider client={queryClient}>
          <AuthBootstrap>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(app)" />
              <Stack.Screen name="+not-found" />
            </Stack>
          </AuthBootstrap>
        </QueryClientProvider>
      </ConvexProvider>
    </GestureHandlerRootView>
  );
}

