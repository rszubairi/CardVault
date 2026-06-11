import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/authStore';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID_IOS = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? '';
const GOOGLE_CLIENT_ID_ANDROID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? '';
const GOOGLE_CLIENT_ID_WEB = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '';

const LINKEDIN_CLIENT_ID = process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID ?? '';

const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com');

export default function LoginScreen() {
  const router = useRouter();
  const { setLoading } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'cardvault' });

  const [googleRequest, googleResponse, promptGoogleAsync] =
    AuthSession.useAuthRequest(
      {
        clientId: GOOGLE_CLIENT_ID_IOS,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
      },
      discovery ?? undefined,
    );

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await promptGoogleAsync();
      if (result?.type === 'success') {
        // Token exchange handled in Module 3 via Convex Auth
        router.replace('/(app)/(tabs)/');
      }
    } catch (e) {
      Alert.alert('Sign In Failed', 'Could not sign in with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setLinkedinLoading(true);
    try {
      const linkedinRedirect = AuthSession.makeRedirectUri({ scheme: 'cardvault' });
      const authUrl =
        `https://www.linkedin.com/oauth/v2/authorization` +
        `?response_type=code` +
        `&client_id=${LINKEDIN_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(linkedinRedirect)}` +
        `&scope=openid%20profile%20email` +
        `&state=cardvault_linkedin`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, linkedinRedirect);
      if (result.type === 'success') {
        // Token exchange handled in Module 3 via Convex Auth
        router.replace('/(app)/(tabs)/');
      }
    } catch (e) {
      Alert.alert('Sign In Failed', 'Could not sign in with LinkedIn. Please try again.');
    } finally {
      setLinkedinLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-surface-900 px-6 justify-between py-16">
      {/* Header */}
      <View className="items-center mt-10">
        <View className="w-20 h-20 bg-primary-500 rounded-3xl items-center justify-center mb-6">
          <Ionicons name="card" size={40} color="#fff" />
        </View>
        <Text className="text-slate-50 text-4xl font-bold tracking-tight">CardVault</Text>
        <Text className="text-slate-400 text-base text-center mt-3 max-w-xs leading-6">
          Your AI-powered professional networking CRM
        </Text>
      </View>

      {/* Feature Pills */}
      <View className="items-center gap-y-3">
        {[
          { icon: 'scan-outline',       label: 'Scan cards in seconds' },
          { icon: 'flash-outline',       label: 'AI-powered OCR extraction' },
          { icon: 'people-outline',      label: 'Team networking CRM' },
          { icon: 'sync-outline',        label: 'Real-time sync across devices' },
        ].map(({ icon, label }) => (
          <View
            key={label}
            className="flex-row items-center bg-surface-800 rounded-xl px-4 py-3 w-full"
          >
            <Ionicons name={icon as any} size={20} color="#6366F1" />
            <Text className="text-slate-300 text-sm ml-3">{label}</Text>
          </View>
        ))}
      </View>

      {/* Auth Buttons */}
      <View className="gap-y-3">
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={googleLoading || !googleRequest}
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
