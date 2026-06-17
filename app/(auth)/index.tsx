import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthStore } from '../../src/stores/authStore';
import { storeSession, fetchGoogleProfile } from '../../src/lib/auth';

WebBrowser.maybeCompleteAuthSession();

const LINKEDIN_CLIENT_ID = process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID ?? '';

/**
 * Complete sign in after obtaining a Google access token.
 */
async function finishGoogleSignIn(
  accessToken: string,
  getOrCreateUser: ReturnType<typeof useMutation>,
  router: ReturnType<typeof useRouter>,
  setToken: (token: string | null) => void,
  setUser: (user: any) => void,
) {
  const profile = await fetchGoogleProfile(accessToken);
  if (!profile) throw new Error('Failed to fetch Google profile');

  const { userId, isNew } = await getOrCreateUser({
    name: profile.name,
    email: profile.email,
    externalId: profile.sub,
    authProvider: 'google',
    profilePhoto: profile.picture,
  });

  const user = { _id: userId, name: profile.name, email: profile.email, profilePhoto: profile.picture };
  await storeSession(accessToken, user);
  setToken(accessToken);
  setUser(user as any);

  setTimeout(() => {
    router.replace((isNew ? '/profile-setup' : '/(app)/(tabs)') as any);
  }, 100);
}

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const getOrCreateUser = useMutation(api.users.getOrCreate);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      if (Platform.OS !== 'web') {
        try {
          const { GoogleSignin } = require('@react-native-google-signin/google-signin');
          const { getAuth, signInWithCredential, GoogleAuthProvider } = require('@react-native-firebase/auth');

          GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '1055063850419-74q1iic0psd4cgu94gg0fc95tfpc7ngn.apps.googleusercontent.com',
          });

          await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
          const signInResult = await GoogleSignin.signIn();
          const idToken = signInResult.data?.idToken ?? (signInResult as any).idToken;
          if (!idToken) throw new Error('No ID token from Google Sign-In');

          const credential = GoogleAuthProvider.credential(idToken);
          const userCredential = await signInWithCredential(getAuth(), credential);
          const fbUser = userCredential.user;
          const accessToken = await fbUser.getIdToken();

          const profile = {
            sub: fbUser.uid,
            name: fbUser.displayName ?? '',
            email: fbUser.email ?? '',
            picture: fbUser.photoURL ?? '',
          };

          const { userId, isNew } = await getOrCreateUser({
            name: profile.name,
            email: profile.email,
            externalId: profile.sub,
            authProvider: 'google',
            profilePhoto: profile.picture,
          });
          const user = { _id: userId, name: profile.name, email: profile.email, profilePhoto: profile.picture };
          await storeSession(accessToken, user);
          setToken(accessToken);
          setUser(user as any);
          setTimeout(() => {
            router.replace((isNew ? '/profile-setup' : '/(app)/(tabs)') as any);
          }, 100);
          return;
        } catch (nativeErr: any) {
          console.error('[GoogleSignIn] Native auth failed:', nativeErr?.code, nativeErr?.message);
          throw nativeErr;
        }
      }

      console.warn('[GoogleSignIn] Platform.OS is web — using redirect fallback');

      // Web fallback: redirect-based PKCE flow via Convex callback
      const CONVEX_SITE_URL = process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? 'https://blissful-sparrow-472.eu-west-1.convex.site';
      const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '1055063850419-74q1iic0psd4cgu94gg0fc95tfpc7ngn.apps.googleusercontent.com';
      const redirectUri = `${CONVEX_SITE_URL}/auth/google`;
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await sha256Base64URL(codeVerifier);
      const state = generateRandomString(16);

      const authUrl =
        'https://accounts.google.com/o/oauth2/v2/auth' +
        `?client_id=${encodeURIComponent(GOOGLE_WEB_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        '&response_type=code' +
        `&scope=${encodeURIComponent('openid profile email')}` +
        `&state=${encodeURIComponent(state)}` +
        `&code_challenge=${encodeURIComponent(codeChallenge)}` +
        '&code_challenge_method=S256';

      const result = await WebBrowser.openAuthSessionAsync(authUrl, 'cardvault://auth');
      if (result.type !== 'success' || !result.url) { setGoogleLoading(false); return; }

      const queryString = result.url.includes('?') ? result.url.split('?')[1] : '';
      const params = new URLSearchParams(queryString);
      const code = params.get('code');
      if (!code) { setGoogleLoading(false); return; }

      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_WEB_CLIENT_ID,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
        }).toString(),
      });
      if (!tokenRes.ok) throw new Error('Token exchange failed');
      const tokens = await tokenRes.json();
      if (!tokens?.access_token) throw new Error('No access token returned');

      await finishGoogleSignIn(tokens.access_token, getOrCreateUser, router, setToken, setUser);
    } catch (e: any) {
      console.error('[GoogleSignIn] Error:', e?.code, e?.message, e);
      Alert.alert('Sign In Failed', e.message ?? 'Could not sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

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

      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      if (!code) throw new Error('No authorization code returned');

      const mockToken = `li_${code.substring(0, 12)}`;
      const mockProfile = { sub: code, name: 'LinkedIn User', email: 'user@linkedin.com' };

      const { userId, isNew } = await getOrCreateUser({
        name: mockProfile.name,
        email: mockProfile.email,
        externalId: mockProfile.sub,
        authProvider: 'linkedin',
      });

      const user = { _id: userId, name: mockProfile.name, email: mockProfile.email };
      await storeSession(mockToken, user);
      setToken(mockToken);
      setUser(user as any);
      setTimeout(() => {
        router.replace((isNew ? '/profile-setup' : '/(app)/(tabs)') as any);
      }, 100);
    } catch (e: any) {
      Alert.alert('Sign In Failed', e.message ?? 'Could not sign in with LinkedIn.');
    } finally {
      setLinkedinLoading(false);
    }
  };

  const handleDevLogin = async () => {
    try {
      const { userId, isNew } = await getOrCreateUser({
        name: 'Rszubairi (Dev)',
        email: 'r.s.zubairi@gmail.com',
        externalId: 'dev_user_github',
        authProvider: 'google',
      });
      const devUser = { _id: userId, name: 'Rszubairi (Dev)', email: 'r.s.zubairi@gmail.com' };
      await storeSession('dev_token_123', devUser);
      setToken('dev_token_123');
      setUser(devUser as any);
      setTimeout(() => {
        router.replace((isNew ? '/profile-setup' : '/(app)/(tabs)') as any);
      }, 100);
    } catch (e: any) {
      Alert.alert('Dev Login Failed', e.message ?? 'Could not create dev user.');
    }
  };

  return (
    <View className="flex-1 bg-surface-900 px-6 justify-between py-16">
      <View className="items-center mt-10">
        <View className="w-20 h-20 bg-primary-500 rounded-3xl items-center justify-center mb-6">
          <Ionicons name="card" size={40} color="#fff" />
        </View>
        <Text className="text-slate-50 text-4xl font-bold tracking-tight">CardVault</Text>
        <Text className="text-slate-400 text-base text-center mt-3 max-w-xs leading-6">
          Your AI-powered professional networking CRM
        </Text>
      </View>

      <View className="gap-y-3">
        {[
          { icon: 'scan-outline', label: 'Scan cards in seconds with AI OCR' },
          { icon: 'flash-outline', label: 'Auto-extract name, email, phone, LinkedIn' },
          { icon: 'people-outline', label: 'Team CRM for conferences and events' },
          { icon: 'sync-outline', label: 'Real-time sync across all your devices' },
        ].map(({ icon, label }) => (
          <View key={label} className="flex-row items-center bg-surface-800 rounded-xl px-4 py-3">
            <Ionicons name={icon as any} size={20} color="#6366F1" />
            <Text className="text-slate-300 text-sm ml-3">{label}</Text>
          </View>
        ))}
      </View>

      <View className="gap-y-3">
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
          className="flex-row items-center justify-center bg-white rounded-2xl py-4 active:opacity-80"
        >
          {googleLoading ? <ActivityIndicator color="#4F46E5" size="small" /> : (
            <>
              <Ionicons name="logo-google" size={22} color="#4285F4" />
              <Text className="text-slate-800 text-base font-semibold ml-3">Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLinkedInSignIn}
          disabled={linkedinLoading}
          className="flex-row items-center justify-center bg-[#0A66C2] rounded-2xl py-4 active:opacity-80"
        >
          {linkedinLoading ? <ActivityIndicator color="#fff" size="small" /> : (
            <>
              <Ionicons name="logo-linkedin" size={22} color="#fff" />
              <Text className="text-white text-base font-semibold ml-3">Continue with LinkedIn</Text>
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

/* ─── Helper functions ────────────────────────────────────────────────── */

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  const array = new Uint8Array(length);
  try { crypto.getRandomValues(array); } catch {
    for (let i = 0; i < length; i++) array[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < array.length; i++) result += chars[array[i] % chars.length];
  return result;
}

async function sha256Base64URL(input: string): Promise<string> {
  try {
    const Crypto = require('expo-crypto');
    return hexToBase64URL(await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input));
  } catch {
    const encoder = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-256', encoder.encode(input));
    const bytes = new Uint8Array(hash);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

function hexToBase64URL(hex: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < hex.length; i += 2) bytes[i >> 1] = parseInt(hex.substring(i, i + 2), 16);
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i], b2 = i + 1 < bytes.length ? bytes[i + 1] : 0, b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += chars[b1 >> 2] + chars[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '';
    result += i + 2 < bytes.length ? chars[b3 & 63] : '';
  }
  return result;
}