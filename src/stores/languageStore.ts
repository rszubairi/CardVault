import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language } from '../i18n/translations';

const LANGUAGE_KEY = '@cardvault/language';

interface LanguageState {
  language: Language;
  loaded: boolean;
  loadLanguage: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  loaded: false,

  loadLanguage: async () => {
    try {
      const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
      set({ language: (stored as Language) ?? 'en', loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  setLanguage: async (lang) => {
    set({ language: lang });
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  },
}));
