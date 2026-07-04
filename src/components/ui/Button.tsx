import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
  StyleSheet,
} from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  variant?: Variant;
  size?: Size;
  label: string;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeStyles: Record<Size, { paddingHorizontal: number; paddingVertical: number; borderRadius: number; fontSize: number }> = {
  sm: { paddingHorizontal: 12, paddingVertical: 8,  borderRadius: 8,  fontSize: 14 },
  md: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, fontSize: 16 },
  lg: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, fontSize: 18 },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  label,
  loading = false,
  icon,
  fullWidth = false,
  disabled,
  className,
  style,
  ...props
}: ButtonProps) {
  const theme = useAppTheme();
  const s = sizeStyles[size];

  const containerStyle = (() => {
    switch (variant) {
      case 'primary':  return { backgroundColor: theme.accent };
      case 'secondary': return { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border };
      case 'ghost':    return { backgroundColor: 'transparent' };
      case 'danger':   return { backgroundColor: theme.error };
    }
  })();

  const textColor = (() => {
    switch (variant) {
      case 'primary': return theme.isDark ? '#fff' : '#fff';
      case 'secondary': return theme.textPrimary;
      case 'ghost':   return theme.accent;
      case 'danger':  return '#fff';
    }
  })();

  const spinnerColor = (variant === 'primary' || variant === 'danger') ? '#fff' : theme.accent;

  return (
    <TouchableOpacity
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: s.paddingHorizontal,
          paddingVertical: s.paddingVertical,
          borderRadius: s.borderRadius,
        },
        containerStyle,
        fullWidth && { width: '100%' },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" style={{ marginRight: 8 }} />
      ) : icon ? (
        <View style={{ marginRight: 8 }}>{icon}</View>
      ) : null}
      <Text style={{ color: textColor, fontSize: s.fontSize, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}
