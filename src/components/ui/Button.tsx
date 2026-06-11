import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
} from 'react-native';

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

const variantClasses: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary-500 active:bg-primary-600',
    text:      'text-white font-semibold',
  },
  secondary: {
    container: 'bg-surface-800 border border-surface-600 active:bg-surface-700',
    text:      'text-slate-100 font-semibold',
  },
  ghost: {
    container: 'active:bg-surface-800',
    text:      'text-primary-400 font-semibold',
  },
  danger: {
    container: 'bg-red-500 active:bg-red-600',
    text:      'text-white font-semibold',
  },
};

const sizeClasses: Record<Size, { container: string; text: string }> = {
  sm: { container: 'px-3 py-2 rounded-lg',   text: 'text-sm'   },
  md: { container: 'px-5 py-3 rounded-xl',   text: 'text-base' },
  lg: { container: 'px-6 py-4 rounded-2xl',  text: 'text-lg'   },
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
  ...props
}: ButtonProps) {
  const v = variantClasses[variant];
  const s = sizeClasses[size];

  return (
    <TouchableOpacity
      className={`
        flex-row items-center justify-center
        ${v.container} ${s.container}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50' : ''}
        ${className ?? ''}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#fff' : '#6366F1'}
          size="small"
          className="mr-2"
        />
      ) : icon ? (
        <View className="mr-2">{icon}</View>
      ) : null}
      <Text className={`${v.text} ${s.text}`}>{label}</Text>
    </TouchableOpacity>
  );
}
