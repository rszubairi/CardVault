import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/theme';
import { isEnterprise } from '../../../src/config/appVariant';
import { E } from '../../../enterprise/constants/theme';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { useAppTheme } from '../../../src/theme/useAppTheme';

export default function TabLayout() {
  const plan = useSubscriptionStore((s) => s.plan);
  const theme = useAppTheme();
  // DEV ONLY: force enterprise theme for visual testing — revert before shipping
  const useEnterpriseTheme = isEnterprise && (plan === 'enterprise' || __DEV__);
  const isLightConsumer = !useEnterpriseTheme && !theme.isDark;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: useEnterpriseTheme ? E.surface : isLightConsumer ? theme.accent : Colors.surface[800],
          borderTopColor:  useEnterpriseTheme ? E.border  : isLightConsumer ? theme.accent : Colors.surface[700],
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor:   useEnterpriseTheme ? E.gold      : isLightConsumer ? '#FFFFFF' : Colors.primary[500],
        tabBarInactiveTintColor: useEnterpriseTheme ? E.textMuted : isLightConsumer ? '#FFFFFFB3' : Colors.slate[500],
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'scan' : 'scan-outline'}
              size={28}
              color={focused ? (useEnterpriseTheme ? E.gold : isLightConsumer ? '#FFFFFF' : Colors.primary[500]) : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="team"
        options={
          isEnterprise
            ? {
                title: 'Team',
                tabBarIcon: ({ color, size }) => (
                  <Ionicons name="people-circle-outline" size={size} color={color} />
                ),
              }
            : { href: null } // hidden in consumer build
        }
      />
    </Tabs>
  );
}

