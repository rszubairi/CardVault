import React from 'react';
import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import Button from '../src/components/ui/Button';

export default function NotFoundScreen() {
  return (
    <View className="flex-1 bg-surface-900 items-center justify-center px-6">
      <Text className="text-slate-50 text-2xl font-bold mb-2">Screen not found</Text>
      <Text className="text-slate-400 text-base text-center mb-8">
        The page you are looking for does not exist.
      </Text>
      <Link href="/(app)/(tabs)" asChild>
        <Button label="Go to Dashboard" />
      </Link>
    </View>
  );
}

