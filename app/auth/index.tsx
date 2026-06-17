import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthStore } from '../../src/stores/authStore';
import { storeSession, fetchGoogleProfile } from '../../src/lib/auth';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '';

/**
 * This screen is reached when the Google OAuth redirect opens the app
 * via the cardvault://auth deep link directly (fallback path).
 * 
 * The primary flow (WebBrowser.openAuthSessionAsync) handles the callback
 * inline in the login screen. This screen is only hit when the intent
 * filter intercepts the redirect (which can happen on some Android versions).
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const getOrCreateUser = useMutation(api.users.getOrCreate);
  const { setUser, setToken } = useAuthStore();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    async function handleRedirect() {
      try {
        // Get the URL that triggered this route
        const url = await Linking.getInitialURL();
        if (!url) {
          router.replace('/(auth)/' as any);
          return;
        }

        const parsed = new URL(url);
        const code = parsed.searchParams.get('code');
        const error = parsed.searchParams.get('error');

        if (error) {
          console.error('Google OAuth error:', error);
          router.replace('/(auth)/' as any);
          return;
        }

        if (!code) {
          router.replace('/(auth)/' as any);
          return;
        }

        // Exchange the authorization code for tokens using the Web Client ID
        const redirectUri = Linking.createURL('auth');
        const res = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: GOOGLE_WEB_CLIENT_ID,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
          }).toString(),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.error('Token exchange failed:', res.status, errText);
          router.replace('/(auth)/' as any);
          return;
        }

        const tokens = await res.json();
        const accessToken = tokens.access_token;
        if (!accessToken) {
          console.error('No access token in response');
          router.replace('/(auth)/' as any);
          return;
        }

        // Fetch the Google profile
        const profile = await fetchGoogleProfile(accessToken);
        if (!profile) {
          console.error('Failed to fetch Google profile');
          router.replace('/(auth)/' as any);
          return;
        }

        // Create or get the user in Convex
        const { userId, isNew } = await getOrCreateUser({
          name: profile.name,
          email: profile.email,
          externalId: profile.sub,
          authProvider: 'google',
          profilePhoto: profile.picture,
        });

        const user = {
          _id: userId,
          name: profile.name,
          email: profile.email,
          profilePhoto: profile.picture,
        };

        await storeSession(accessToken, user);
        setToken(accessToken);
        setUser(user as any);

        // Navigate to the appropriate screen
        setTimeout(() => {
          router.replace((isNew ? '/profile-setup' : '/(app)/(tabs)') as any);
        }, 100);
      } catch (e) {
        console.error('Auth callback error:', e);
        router.replace('/(auth)/' as any);
      }
    }

    handleRedirect();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
      <ActivityIndicator color="#6366F1" size="large" />
      <Text style={{ color: '#94a3b8', marginTop: 16, fontSize: 14 }}>
        Completing sign in...
      </Text>
    </View>
  );
}
