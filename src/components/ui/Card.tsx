import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
}

export default function Card({ variant = 'default', className, children, ...props }: CardProps) {
  const variantClass = {
    default:  'bg-surface-800 rounded-2xl',
    elevated: 'bg-surface-800 rounded-2xl shadow-lg shadow-black/30',
    outlined: 'bg-surface-800 rounded-2xl border border-surface-700',
  }[variant];

  return (
    <View className={`${variantClass} ${className ?? ''}`} {...props}>
      {children}
    </View>
  );
}
