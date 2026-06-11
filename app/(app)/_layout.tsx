import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { View, ActivityIndicator } from 'react-native';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-900 items-center justify-center">
        <ActivityIndicator color="#6366F1" size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="contact/[id]"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="scan/result"
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="event/[id]"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="upgrade"
        options={{ presentation: 'modal' }}
      />
    </Stack>
  );
}
