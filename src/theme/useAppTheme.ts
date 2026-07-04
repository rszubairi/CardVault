import { useSubscriptionStore } from '../stores/subscriptionStore';
import { isEnterprise } from '../config/appVariant';

export type AppTheme = typeof consumerTheme;

const consumerTheme = {
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
} as const;

const enterpriseTheme = {
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
} as const;

export function useAppTheme(): AppTheme {
  const plan = useSubscriptionStore((s) => s.plan);
  const active = isEnterprise && (plan === 'enterprise' || __DEV__);
  return active ? enterpriseTheme : consumerTheme;
}
