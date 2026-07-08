import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export default function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const theme = useAppTheme();
  const colors: Record<BadgeVariant, string> = {
    primary: theme.accent,
    success: theme.success,
    warning: theme.warning,
    error:   theme.error,
    neutral: theme.textMuted,
  };
  const color = colors[variant];

  return (
    <View style={{ backgroundColor: variant === 'neutral' ? theme.surfaceAlt : color + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
      <Text style={{ color, fontSize: 12, fontWeight: '500' }}>{label}</Text>
    </View>
  );
}
