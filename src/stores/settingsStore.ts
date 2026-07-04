import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_KEY   = '@cardvault/sync_to_phone';
const SCHEME_KEY = '@cardvault/color_scheme';

export type ColorScheme = 'dark' | 'light' | 'system';

interface SettingsState {
  syncToPhone: boolean;
  colorScheme: ColorScheme;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  setSyncToPhone: (v: boolean) => Promise<void>;
  setColorScheme: (scheme: ColorScheme) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  syncToPhone: false,
  colorScheme: 'system',
  loaded: false,

  loadSettings: async () => {
    try {
      const [sync, scheme] = await Promise.all([
        AsyncStorage.getItem(SYNC_KEY),
        AsyncStorage.getItem(SCHEME_KEY),
      ]);
      set({
        syncToPhone: sync === 'true',
        colorScheme: (scheme as ColorScheme) ?? 'system',
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  setSyncToPhone: async (v) => {
    set({ syncToPhone: v });
    await AsyncStorage.setItem(SYNC_KEY, v ? 'true' : 'false');
  },

  setColorScheme: async (scheme) => {
    set({ colorScheme: scheme });
    await AsyncStorage.setItem(SCHEME_KEY, scheme);
  },
}));
