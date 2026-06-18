import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SYNC_KEY = '@cardvault/sync_to_phone';

interface SettingsState {
  syncToPhone: boolean;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  setSyncToPhone: (v: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  syncToPhone: false,
  loaded: false,

  loadSettings: async () => {
    try {
      const val = await AsyncStorage.getItem(SYNC_KEY);
      set({ syncToPhone: val === 'true', loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  setSyncToPhone: async (v) => {
    set({ syncToPhone: v });
    await AsyncStorage.setItem(SYNC_KEY, v ? 'true' : 'false');
  },
}));
