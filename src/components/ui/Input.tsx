import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export default function Input({ label, error, leftIcon, className, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const theme = useAppTheme();

  return (
    <View className="mb-4">
      {label && (
        <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '500', marginBottom: 6 }}>{label}</Text>
      )}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.surfaceAlt,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderWidth: 1,
          borderColor: focused ? theme.accent : error ? theme.error : theme.border,
        }}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className={`flex-1 text-base ${className ?? ''}`}
          style={{ color: theme.textPrimary }}
          placeholderTextColor={theme.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
      {error && <Text style={{ color: theme.error, fontSize: 12, marginTop: 4 }}>{error}</Text>}
    </View>
  );
}
