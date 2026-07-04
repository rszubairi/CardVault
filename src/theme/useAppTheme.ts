import { useColorScheme } from 'react-native';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { useSettingsStore } from '../stores/settingsStore';
import { isEnterprise } from '../config/appVariant';

export type AppTheme = typeof consumerDarkTheme;

// ── Consumer Dark ─────────────────────────────────────────────────────────────
const consumerDarkTheme = {
  accent:        '#6366F1',
  accentDim:     '#4F46E5',
  accentFaint:   '#6366F114',
  accentTint:    '#3730A314',
  bg:            '#0F172A',
  surface:       '#1E293B',
  surfaceAlt:    '#334155',
  border:        '#334155',
  borderSub:     '#1E293B',
  textPrimary:   '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted:     '#64748B',
  success:       '#10B981',
  warning:       '#F59E0B',
  error:         '#EF4444',
  isDark:        true,
} as const;

// ── Consumer Light ────────────────────────────────────────────────────────────
const consumerLightTheme = {
  accent:        '#6366F1',
  accentDim:     '#4F46E5',
  accentFaint:   '#6366F10F',
  accentTint:    '#EEF2FF',
  bg:            '#F8FAFC',
  surface:       '#FFFFFF',
  surfaceAlt:    '#F1F5F9',
  border:        '#E2E8F0',
  borderSub:     '#F1F5F9',
  textPrimary:   '#0F172A',
  textSecondary: '#475569',
  textMuted:     '#94A3B8',
  success:       '#059669',
  warning:       '#D97706',
  error:         '#DC2626',
  isDark:        false,
} as const;

// ── Enterprise Dark ───────────────────────────────────────────────────────────
const enterpriseDarkTheme = {
  accent:        '#D4AF37',
  accentDim:     '#B8960C',
  accentFaint:   '#D4AF1420',
  accentTint:    '#D4AF3714',
  bg:            '#0A0905',
  surface:       '#141209',
  surfaceAlt:    '#1E1B0E',
  border:        '#2A2410',
  borderSub:     '#1E1B0E',
  textPrimary:   '#F5EDD0',
  textSecondary: '#A89860',
  textMuted:     '#6B5D30',
  success:       '#22C55E',
  warning:       '#F59E0B',
  error:         '#EF4444',
  isDark:        true,
} as const;

// ── Enterprise Light ──────────────────────────────────────────────────────────
const enterpriseLightTheme = {
  accent:        '#9A7A0A',
  accentDim:     '#7A6008',
  accentFaint:   '#D4AF370F',
  accentTint:    '#FEF9E7',
  bg:            '#FFFDF5',
  surface:       '#FFFFFF',
  surfaceAlt:    '#FEF9E7',
  border:        '#E8D990',
  borderSub:     '#FEF9E7',
  textPrimary:   '#1A1200',
  textSecondary: '#5C4A00',
  textMuted:     '#9B8040',
  success:       '#059669',
  warning:       '#D97706',
  error:         '#DC2626',
  isDark:        false,
} as const;

export function useAppTheme(): AppTheme {
  const plan        = useSubscriptionStore((s) => s.plan);
  const colorScheme = useSettingsStore((s) => s.colorScheme);
  const systemScheme = useColorScheme();

  const enterprise = isEnterprise && (plan === 'enterprise' || __DEV__);

  const isDark =
    colorScheme === 'dark' ? true :
    colorScheme === 'light' ? false :
    systemScheme !== 'light';

  if (enterprise) return isDark ? enterpriseDarkTheme : enterpriseLightTheme;
  return isDark ? consumerDarkTheme : consumerLightTheme;
}
