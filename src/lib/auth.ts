import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY   = 'cardvault_token';
const USER_KEY    = 'cardvault_user';

// ─── Secure storage helpers ───────────────────────────────────────────────────
// expo-secure-store has no web implementation; fall back to localStorage on web.

const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
    await SecureStore.deleteItemAsync(key);
  },
};

export async function storeSession(token: string, user: object) {
  await storage.setItem(TOKEN_KEY, token);
  await storage.setItem(USER_KEY, JSON.stringify(user));
}

export async function loadSession(): Promise<{ token: string; user: any } | null> {
  const [token, userStr] = await Promise.all([
    storage.getItem(TOKEN_KEY),
    storage.getItem(USER_KEY),
  ]);
  if (!token || !userStr) return null;
  try {
    return { token, user: JSON.parse(userStr) };
  } catch {
    return null;
  }
}

export async function clearSession() {
  await Promise.all([
    storage.deleteItem(TOKEN_KEY),
    storage.deleteItem(USER_KEY),
  ]);
}

// ─── Google OAuth token exchange ──────────────────────────────────────────────

export async function exchangeGoogleCode(
  code: string,
  codeVerifier: string,
  redirectUri: string,
  clientId: string,
): Promise<{ access_token: string; id_token: string } | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:    clientId,
        redirect_uri: redirectUri,
        grant_type:   'authorization_code',
        ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
      }).toString(),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchGoogleProfile(
  accessToken: string,
): Promise<{ sub: string; name: string; email: string; picture: string } | null> {
  try {
    const res = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── LinkedIn OAuth token exchange ───────────────────────────────────────────

export async function exchangeLinkedInCode(
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string,
): Promise<{ access_token: string } | null> {
  try {
    const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     clientId,
        client_secret: clientSecret,
      }).toString(),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchLinkedInProfile(
  accessToken: string,
): Promise<{ sub: string; name: string; email: string; picture?: string } | null> {
  try {
    const res = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
