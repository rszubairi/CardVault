import React, { useState, useEffect } from 'react';
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
import { useAction, useQuery } from 'convex/react';
import * as WebBrowser from 'expo-web-browser';
import { api } from '../../convex/_generated/api';
import Card from '../../src/components/ui/Card';
import Button from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
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

type CheckoutStatus = 'idle' | 'creating' | 'checkout' | 'verifying' | 'success';

export default function UpgradeScreen() {
  const router = useRouter();
  const { user }     = useAuthStore();
  const { hidePaywall, scanCount, scanLimit, setPlan } = useSubscriptionStore();
  const createCheckoutSession = useAction(api.subscriptions.createCheckoutSession);

  const [status, setStatus]       = useState<CheckoutStatus>('idle');
  const [activePlan, setActivePlan] = useState<'personal_pro' | 'enterprise' | null>(null);

  const subscription = useQuery(
    api.subscriptions.getByUserId,
    user ? { userId: user._id } : 'skip',
  );

  // Detect successful upgrade after returning from browser
  useEffect(() => {
    if (status === 'verifying' && subscription?.plan !== 'free' && subscription?.status === 'active') {
      setStatus('success');
      setPlan(subscription.plan);
    }
  }, [subscription?.plan, subscription?.status, status, setPlan]);

  const handleUpgrade = async (plan: 'personal_pro' | 'enterprise') => {
    if (!user?.email) {
      Alert.alert('Error', 'User email not found. Please sign in again.');
      return;
    }
    setActivePlan(plan);
    setStatus('creating');

    try {
      const { url } = await createCheckoutSession({ userId: user._id, plan, email: user.email });

      setStatus('checkout');
      await WebBrowser.openAuthSessionAsync(url, 'cardvault://');

      // Browser closed â€” give Stripe webhook time to fire then re-check
      setStatus('verifying');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not start checkout.';
      Alert.alert('Checkout Error', msg);
      setStatus('idle');
      setActivePlan(null);
    }
  };

  if (status === 'success') {
    return (
      <SafeAreaView className="flex-1 bg-surface-900 items-center justify-center px-6">
        <View className="w-20 h-20 bg-emerald-900/40 rounded-full items-center justify-center mb-6">
          <Ionicons name="checkmark-circle" size={44} color="#10B981" />
        </View>
        <Text className="text-slate-50 text-2xl font-bold mb-2">You're all set!</Text>
        <Text className="text-slate-400 text-base text-center mb-8">
          Welcome to CardVault {activePlan === 'personal_pro' ? 'Pro' : 'Enterprise'}.
          Your subscription is now active.
        </Text>
        <Button
          label="Continue"
          fullWidth
          onPress={() => { hidePaywall(); router.replace('/(app)/(tabs)'); }}
        />
      </SafeAreaView>
    );
  }

  const isLoading = status === 'creating' || status === 'checkout' || status === 'verifying';

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
        <TouchableOpacity
          onPress={() => { hidePaywall(); router.back(); }}
          className="mr-3"
          disabled={isLoading}
        >
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

        {/* Verifying state */}
        {status === 'verifying' && (
          <Card className="p-6 items-center mb-6">
            <ActivityIndicator color="#6366F1" size="large" />
            <Text className="text-slate-300 text-sm mt-3">Verifying your subscriptionâ€¦</Text>
            <Text className="text-slate-500 text-xs mt-1">This may take a moment.</Text>
          </Card>
        )}

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
            label={
              status === 'creating' && activePlan === 'personal_pro'
                ? 'Creating checkoutâ€¦'
                : status === 'checkout' && activePlan === 'personal_pro'
                ? 'Complete payment in browser'
                : 'Upgrade to Pro â€” $10/year'
            }
            fullWidth
            loading={isLoading && activePlan === 'personal_pro'}
            disabled={isLoading}
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
            label={
              status === 'creating' && activePlan === 'enterprise'
                ? 'Creating checkoutâ€¦'
                : 'Start Enterprise Trial'
            }
            variant="secondary"
            fullWidth
            loading={isLoading && activePlan === 'enterprise'}
            disabled={isLoading}
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

