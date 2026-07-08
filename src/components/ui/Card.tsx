import React from 'react';
import { View, ViewProps } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
}

export default function Card({ variant = 'default', className, style, children, ...props }: CardProps) {
  const theme = useAppTheme();

  const themedStyle = {
    backgroundColor: theme.surface,
    borderRadius:    16,
    ...(variant === 'outlined' && { borderWidth: 1, borderColor: theme.border }),
    ...(variant === 'elevated' && {
      shadowColor:   '#000',
      shadowOpacity: theme.isDark ? 0.3 : 0.08,
      shadowRadius:  12,
      shadowOffset:  { width: 0, height: 4 },
      elevation:     4,
    }),
  };

  return (
    <View className={className} style={[themedStyle, style]} {...props}>
      {children}
    </View>
  );
}
