import translations from './translations';
import { useLanguageStore } from '../stores/languageStore';

export function useTranslation() {
  const language = useLanguageStore((s) => s.language);
  const t = translations[language] ?? translations.en;
  return { t, language };
}
