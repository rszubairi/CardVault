import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/theme';
import { isEnterprise } from '../../../src/config/appVariant';
import { E } from '../../../enterprise/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isEnterprise ? E.surface    : Colors.surface[800],
          borderTopColor:  isEnterprise ? E.border     : Colors.surface[700],
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor:   isEnterprise ? E.gold              : Colors.primary[500],
        tabBarInactiveTintColor: isEnterprise ? E.textMuted         : Colors.slate[500],
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
              color={focused ? Colors.primary[500] : color}
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

