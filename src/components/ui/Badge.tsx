import React from 'react';
import { View, Text } from 'react-native';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary-900',    text: 'text-primary-300' },
  success: { bg: 'bg-emerald-900/50', text: 'text-emerald-400' },
  warning: { bg: 'bg-amber-900/50',   text: 'text-amber-400'   },
  error:   { bg: 'bg-red-900/50',     text: 'text-red-400'     },
  neutral: { bg: 'bg-surface-700',    text: 'text-slate-300'   },
};

export default function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const { bg, text } = variants[variant];
  return (
    <View className={`${bg} px-2 py-0.5 rounded-full`}>
      <Text className={`${text} text-xs font-medium`}>{label}</Text>
    </View>
  );
}
