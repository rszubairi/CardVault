import React, { useState } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export default function Input({ label, error, leftIcon, className, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-slate-400 text-sm font-medium mb-1.5">{label}</Text>
      )}
      <View
        className={`
          flex-row items-center
          bg-surface-800 rounded-xl px-4 py-3
          border ${focused ? 'border-primary-500' : error ? 'border-red-500' : 'border-surface-700'}
        `}
      >
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className={`flex-1 text-slate-50 text-base ${className ?? ''}`}
          placeholderTextColor="#64748B"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>
      {error && <Text className="text-red-400 text-xs mt-1">{error}</Text>}
    </View>
  );
}
