import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Crypto from 'expo-crypto';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthStore } from '../../src/stores/authStore';
import { storeSession, fetchGoogleProfile } from '../../src/lib/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? '';
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '';
const LINKEDIN_CLIENT_ID = process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID ?? '';

/**
 * Android redirect URI for Google's built-in Chrome Custom Tabs support.
 * This format is auto-accepted by Google for Android client IDs - no need to
 * register it in the Google Cloud Console.
 * Format: com.googleusercontent.apps.<ANDROID_CLIENT_ID>:/oauth2redirect/google
 */
function getAndroidRedirectUri(): string {
  const clientId = GOOGLE_ANDROID_CLIENT_ID;
  if (!clientId) return '';
  return `com.googleusercontent.apps.${clientId.replace('.apps.googleusercontent.com', '')}:/oauth2redirect/google`;
}

/**
 * Exchange an authorization code for an access token using the Google token endpoint.
 * On Android we use the Android client ID with client_secret='' (no secret needed for
 * installed/bundled apps). On iOS/web we use the web client ID.
 */
async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  isAndroid: boolean,
): Promise<string | null> {
  try {
    const clientId = isAndroid ? GOOGLE_ANDROID_CLIENT_ID : GOOGLE_WEB_CLIENT_ID;
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: '',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }).toString(),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('Token exchange failed:', res.status, errText);
      return null;
    }
    const data = await res.json();
    return data.access_token ?? null;
  } catch (e) {
    console.error('Token exchange error:', e);
    return null;
  }
}

/**
 * Get or create a user in Convex after successful Google auth,
 * store the session, and navigate to the correct screen.
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

  // Navigate after a brief delay to let the store propagate
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

  const isAndroid = Platform.OS === 'android';

  /**
   * Google Sign-In for Android:
   * Uses the authorization code flow with PKCE via WebBrowser.openAuthSessionAsync.
   * Uses the Android client ID's built-in redirect format that Google auto-accepts:
   *   com.googleusercontent.apps.<CLIENT_ID>:/oauth2redirect/google
   *
   * The Android client ID is used for BOTH the auth request AND the token exchange,
   * with an empty client_secret (standard for installed/bundled app clients).
   */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const codeVerifier = Crypto.randomUUID() + Crypto.randomUUID();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const redirectUri = getAndroidRedirectUri();
      if (!redirectUri || !GOOGLE_ANDROID_CLIENT_ID) {
        throw new Error('Google Android Client ID not configured. Check EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID in your .env file.');
      }

      const authUrl =
        'https://accounts.google.com/o/oauth2/v2/auth' +
        `?client_id=${encodeURIComponent(GOOGLE_ANDROID_CLIENT_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        '&response_type=code' +
        `&scope=${encodeURIComponent('openid profile email')}` +
        `&state=${encodeURIComponent(Crypto.randomUUID())}` +
        `&code_challenge=${encodeURIComponent(codeChallenge)}` +
        '&code_challenge_method=S256';

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== 'success') {
        setGoogleLoading(false);
        return;
      }

      // Parse the authorization code from the redirect URL
      const parsedUrl = result.url ? new URL(result.url) : null;
      const code = parsedUrl?.searchParams.get('code');
      if (!code) {
        console.error('No authorization code in redirect URL');
        setGoogleLoading(false);
        return;
      }

      // Exchange the authorization code for an access token
      const accessToken = await exchangeCodeForToken(code, codeVerifier, redirectUri, true);
      if (!accessToken) {
        Alert.alert('Sign In Failed', 'Could not exchange authorization code for token.');
        setGoogleLoading(false);
        return;
      }

      await finishGoogleSignIn(accessToken, getOrCreateUser, router, setToken, setUser);
    } catch (e: any) {
      Alert.alert('Sign In Failed', e.message ?? 'Could not sign in with Google.');
      setGoogleLoading(false);
    }
  };

  /**
   * Google Sign-In for iOS & Web:
   * Uses implicit token flow (response_type=token) which returns the access token
   * in the URL fragment after redirect.
   */
  const handleGoogleSignInNative = async () => {
    setGoogleLoading(true);
    try {
      const redirectUri = Linking.createURL('auth');
      const clientId = GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID;

      const authUrl =
        'https://accounts.google.com/o/oauth2/v2/auth' +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        '&response_type=token' +
        `&scope=${encodeURIComponent('openid profile email')}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type !== 'success') {
        setGoogleLoading(false);
        return;
      }

      if (!result.url) throw new Error('No redirect URL returned');

      // Parse access token from URL fragment (#access_token=...)
      const fragment = new URL(result.url).hash?.replace('#', '') || '';
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      if (!accessToken) throw new Error('No access token returned');

      await finishGoogleSignIn(accessToken, getOrCreateUser, router, setToken, setUser);
    } catch (e: any) {
      Alert.alert('Sign In Failed', e.message ?? 'Could not sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setLinkedinLoading(true);
    try {
      const redirectUri = Linking.createURL('auth');
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

  const handleGooglePress = isAndroid ? handleGoogleSignIn : handleGoogleSignInNative;

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
          onPress={handleGooglePress}
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

/**
 * Generate a SHA-256 code challenge from a code verifier for PKCE.
 * Uses expo-crypto for cross-platform compatibility.
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
  );
  return base64URLEncode(digest);
}

/**
 * Base64 URL-encode a hex string without using btoa (which isn't available
 * in React Native Hermes engine).
 */
function base64URLEncode(hex: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }

  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;

    result += chars[b1 >> 2];
    result += chars[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < bytes.length ? chars[((b2 & 15) << 2) | (b3 >> 6)] : '';
    result += i + 2 < bytes.length ? chars[b3 & 63] : '';
  }

  return result;
}