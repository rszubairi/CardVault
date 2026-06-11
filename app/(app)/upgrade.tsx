import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';

const PRO_FEATURES = [
  'Unlimited business card scans',
  'AI meeting summaries',
  'AI follow-up reminders',
  'AI message generation',
  'Company enrichment',
  'Export contacts (CSV, Excel, PDF)',
  'Import contacts',
  'Unlimited events',
  'Multi-device synchronization',
  'Offline access',
];

const ENTERPRISE_FEATURES = [
  'Everything in Personal Pro',
  'Shared company CRM',
  'Team collaboration',
  'Organization analytics',
  'Admin console',
  'Role-based permissions',
  'Shared contact database',
  'Team interaction timeline',
  'Corporate invoice billing',
  'Priority support',
];

export default function UpgradeScreen() {
  const router = useRouter();
  const { hidePaywall, scanCount, scanLimit } = useSubscriptionStore();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (plan: 'personal_pro' | 'enterprise') => {
    setLoading(true);
    try {
      // Stripe Checkout integration — handled in Module 10
      Alert.alert(
        'Coming Soon',
        `${plan === 'personal_pro' ? 'Personal Pro (USD 10/year)' : 'Enterprise (USD 15/user/month)'} checkout will be available soon.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
        <TouchableOpacity onPress={() => { hidePaywall(); router.back(); }} className="mr-3">
          <Ionicons name="close" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="text-slate-50 text-lg font-bold">Upgrade CardVault</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Limit Notice */}
        <Card className="p-4 mb-6 border border-amber-700/50 bg-amber-900/20">
          <View className="flex-row items-center mb-2">
            <Ionicons name="warning-outline" size={18} color="#FBBF24" />
            <Text className="text-amber-400 text-sm font-semibold ml-2">
              Free Limit Reached
            </Text>
          </View>
          <Text className="text-slate-400 text-sm leading-5">
            You've used {scanCount} of {scanLimit} free scans. Upgrade to continue scanning
            and unlock all AI features.
          </Text>
        </Card>

        {/* Personal Pro */}
        <Card variant="elevated" className="p-5 mb-4 border border-primary-700/50">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-slate-50 text-xl font-bold">Personal Pro</Text>
            <View className="bg-primary-500 px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-semibold">Popular</Text>
            </View>
          </View>
          <Text className="text-slate-400 text-sm mb-4">For individual professionals</Text>

          <View className="flex-row items-baseline mb-5">
            <Text className="text-slate-50 text-4xl font-bold">$10</Text>
            <Text className="text-slate-400 text-sm ml-2">/ year</Text>
          </View>

          {PRO_FEATURES.map((f) => (
            <View key={f} className="flex-row items-center mb-2.5">
              <Ionicons name="checkmark-circle" size={18} color="#6366F1" />
              <Text className="text-slate-300 text-sm ml-3">{f}</Text>
            </View>
          ))}

          <Button
            label="Upgrade to Pro"
            fullWidth
            loading={loading}
            onPress={() => handleUpgrade('personal_pro')}
            className="mt-5"
          />
        </Card>

        {/* Enterprise */}
        <Card variant="outlined" className="p-5 mb-4">
          <Text className="text-slate-50 text-xl font-bold mb-1">Enterprise</Text>
          <Text className="text-slate-400 text-sm mb-4">For teams and organizations</Text>

          <View className="flex-row items-baseline mb-5">
            <Text className="text-slate-50 text-4xl font-bold">$15</Text>
            <Text className="text-slate-400 text-sm ml-2">/ user / month</Text>
          </View>

          {ENTERPRISE_FEATURES.map((f) => (
            <View key={f} className="flex-row items-center mb-2.5">
              <Ionicons name="checkmark-circle" size={18} color="#F59E0B" />
              <Text className="text-slate-300 text-sm ml-3">{f}</Text>
            </View>
          ))}

          <Button
            label="Contact Sales"
            variant="secondary"
            fullWidth
            onPress={() => handleUpgrade('enterprise')}
            className="mt-5"
          />
        </Card>

        <Text className="text-slate-500 text-xs text-center mt-2">
          Payments secured by Stripe. Cancel anytime.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
