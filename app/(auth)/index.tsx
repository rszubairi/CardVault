import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthStore } from '../../src/stores/authStore';
import {
  storeSession,
  fetchGoogleProfile,
  exchangeLinkedInCode,
  fetchLinkedInProfile,
} from '../../src/lib/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_IOS_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS     ?? '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? '';
const GOOGLE_WEB_CLIENT_ID     = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB     ?? '';
const LINKEDIN_CLIENT_ID       = process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID       ?? '';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const getOrCreateUser = useMutation(api.users.getOrCreate);
  const [googleLoading,   setGoogleLoading]   = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  // ─── Google auth ────────────────────────────────────────────────────────────
  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    iosClientId:     GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    webClientId:     GOOGLE_WEB_CLIENT_ID,
    scopes:          ['openid', 'profile', 'email'],
  });

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await promptGoogleAsync();
      if (result.type !== 'success') { setGoogleLoading(false); return; }

      const accessToken = result.authentication?.accessToken ?? '';
      const profile = await fetchGoogleProfile(accessToken);
      if (!profile) throw new Error('Failed to fetch Google profile');

      const userId = await getOrCreateUser({
        name:         profile.name,
        email:        profile.email,
        externalId:   profile.sub,
        authProvider: 'google',
        profilePhoto: profile.picture,
      });

      const user = { _id: userId, name: profile.name, email: profile.email, profilePhoto: profile.picture };
      await storeSession(accessToken, user);
      setToken(accessToken);
      setUser(user as any);
      router.replace('/(app)/(tabs)/');
    } catch (e: any) {
      Alert.alert('Sign In Failed', e.message ?? 'Could not sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── LinkedIn auth ───────────────────────────────────────────────────────────
  const handleLinkedInSignIn = async () => {
    setLinkedinLoading(true);
    try {
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'cardvault' });
      const state = Math.random().toString(36).substring(7);
      const authUrl =
        `https://www.linkedin.com/oauth/v2/authorization` +
        `?response_type=code` +
        `&client_id=${LINKEDIN_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=openid%20profile%20email` +
        `&state=${state}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      if (result.type !== 'success') { setLinkedinLoading(false); return; }

      const url  = new URL(result.url);
      const code = url.searchParams.get('code');
      if (!code) throw new Error('No authorization code returned');

      // LinkedIn client secret must be handled server-side in production.
      // For now we call our Convex action (Module 3b — server-side exchange).
      // Stub: use the code to simulate login for development.
      const mockToken = `li_${code.substring(0, 12)}`;
      const mockProfile = { sub: code, name: 'LinkedIn User', email: 'user@linkedin.com' };

      const userId = await getOrCreateUser({
        name:         mockProfile.name,
        email:        mockProfile.email,
        externalId:   mockProfile.sub,
        authProvider: 'linkedin',
      });

      const user = { _id: userId, name: mockProfile.name, email: mockProfile.email };
      await storeSession(mockToken, user);
      setToken(mockToken);
      setUser(user as any);
      router.replace('/(app)/(tabs)/');
    } catch (e: any) {
      Alert.alert('Sign In Failed', e.message ?? 'Could not sign in with LinkedIn.');
    } finally {
      setLinkedinLoading(false);
    }
  };

  // ─── Dev bypass (remove before production) ───────────────────────────────────
  const handleDevLogin = async () => {
    const mockUser = { _id: 'dev_user_123' as any, name: 'Dev User', email: 'dev@cardvault.app' };
    await storeSession('dev_token_123', mockUser);
    setToken('dev_token_123');
    setUser(mockUser);
    router.replace('/(app)/(tabs)/');
  };

  return (
    <View className="flex-1 bg-surface-900 px-6 justify-between py-16">
      {/* Logo */}
      <View className="items-center mt-10">
        <View className="w-20 h-20 bg-primary-500 rounded-3xl items-center justify-center mb-6">
          <Ionicons name="card" size={40} color="#fff" />
        </View>
        <Text className="text-slate-50 text-4xl font-bold tracking-tight">CardVault</Text>
        <Text className="text-slate-400 text-base text-center mt-3 max-w-xs leading-6">
          Your AI-powered professional networking CRM
        </Text>
      </View>

      {/* Feature list */}
      <View className="gap-y-3">
        {[
          { icon: 'scan-outline',     label: 'Scan cards in seconds with AI OCR' },
          { icon: 'flash-outline',    label: 'Auto-extract name, email, phone, LinkedIn' },
          { icon: 'people-outline',   label: 'Team CRM for conferences and events' },
          { icon: 'sync-outline',     label: 'Real-time sync across all your devices' },
        ].map(({ icon, label }) => (
          <View
            key={label}
            className="flex-row items-center bg-surface-800 rounded-xl px-4 py-3"
          >
            <Ionicons name={icon as any} size={20} color="#6366F1" />
            <Text className="text-slate-300 text-sm ml-3">{label}</Text>
          </View>
        ))}
      </View>

      {/* Auth buttons */}
      <View className="gap-y-3">
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
          className="flex-row items-center justify-center bg-white rounded-2xl py-4 active:opacity-80"
        >
          {googleLoading ? (
            <ActivityIndicator color="#4F46E5" size="small" />
          ) : (
            <>
              <Ionicons name="logo-google" size={22} color="#4285F4" />
              <Text className="text-slate-800 text-base font-semibold ml-3">
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLinkedInSignIn}
          disabled={linkedinLoading}
          className="flex-row items-center justify-center bg-[#0A66C2] rounded-2xl py-4 active:opacity-80"
        >
          {linkedinLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="logo-linkedin" size={22} color="#fff" />
              <Text className="text-white text-base font-semibold ml-3">
                Continue with LinkedIn
              </Text>
            </>
          )}
        </TouchableOpacity>

        {__DEV__ && (
          <TouchableOpacity
            onPress={handleDevLogin}
            className="flex-row items-center justify-center bg-surface-700 rounded-2xl py-3 border border-dashed border-surface-500"
          >
            <Ionicons name="code-slash-outline" size={18} color="#64748B" />
            <Text className="text-slate-500 text-sm font-medium ml-2">Dev Login (skip auth)</Text>
          </TouchableOpacity>
        )}

        <Text className="text-slate-500 text-xs text-center mt-2 leading-5">
          By continuing, you agree to CardVault's{' '}
          <Text className="text-primary-400">Terms of Service</Text>
          {' '}and{' '}
          <Text className="text-primary-400">Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
}
