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
import Button from '../../src/components/ui/Button';
import { useAuthStore } from '../../src/stores/authStore';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { useAppTheme } from '../../src/theme/useAppTheme';

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
  const { user } = useAuthStore();
  const { hidePaywall, scanCount, scanLimit, plan, setPlan } = useSubscriptionStore();
  const createCheckoutSession = useAction(api.subscriptions.createCheckoutSession);
  const theme = useAppTheme();

  const [status, setStatus]       = useState<CheckoutStatus>('idle');
  const [activePlan, setActivePlan] = useState<'personal_pro' | 'enterprise' | null>(null);

  const subscription = useQuery(
    api.subscriptions.getByUserId,
    user ? { userId: user._id } : 'skip',
  );

  useEffect(() => {
    if (status === 'verifying' && subscription?.plan !== 'free' && subscription?.status === 'active') {
      setStatus('success');
      setPlan(subscription.plan);
    }
  }, [subscription?.plan, subscription?.status, status, setPlan]);

  const handleUpgrade = async (targetPlan: 'personal_pro' | 'enterprise') => {
    if (!user?.email) {
      Alert.alert('Error', 'User email not found. Please sign in again.');
      return;
    }
    setActivePlan(targetPlan);
    setStatus('creating');

    try {
      const { url } = await createCheckoutSession({ userId: user._id, plan: targetPlan, email: user.email });
      setStatus('checkout');
      await WebBrowser.openAuthSessionAsync(url, 'cardvault://');
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
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.success + '30', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Ionicons name="checkmark-circle" size={44} color={theme.success} />
        </View>
        <Text style={{ color: theme.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 8 }}>You're all set!</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 32 }}>
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
  const showPro        = plan === 'free';
  const showEnterprise = plan === 'free' || plan === 'personal_pro';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity
          onPress={() => { hidePaywall(); router.back(); }}
          style={{ marginRight: 12 }}
          disabled={isLoading}
        >
          <Ionicons name="close" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
        <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700' }}>
          {plan === 'personal_pro' ? 'Upgrade to Enterprise' : 'Upgrade CardVault'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Scan limit notice — free users only */}
        {plan === 'free' && (
          <View style={{ padding: 16, marginBottom: 24, borderRadius: 12, borderWidth: 1, borderColor: theme.warning + '50', backgroundColor: theme.warning + '20' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="warning-outline" size={18} color={theme.warning} />
              <Text style={{ color: theme.warning, fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
                {scanCount >= scanLimit ? 'Free Limit Reached' : 'Free Plan'}
              </Text>
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 14, lineHeight: 20 }}>
              {scanCount >= scanLimit
                ? `You've used all ${scanLimit} of your free scans. Upgrade to continue scanning and unlock all AI features.`
                : `You've used ${scanCount} of ${scanLimit} free scans. Upgrade anytime to unlock unlimited scanning and all AI features.`}
            </Text>
          </View>
        )}

        {/* Already on Pro banner */}
        {plan === 'personal_pro' && (
          <View style={{ padding: 16, marginBottom: 24, borderRadius: 12, borderWidth: 1, borderColor: theme.accent + '50', backgroundColor: theme.accentTint }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
              <Text style={{ color: theme.accent, fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
                You're on Personal Pro
              </Text>
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 4, lineHeight: 20 }}>
              Upgrade to Enterprise to unlock team collaboration and shared CRM features.
            </Text>
          </View>
        )}

        {/* Verifying */}
        {status === 'verifying' && (
          <View style={{ padding: 24, alignItems: 'center', marginBottom: 24, backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
            <ActivityIndicator color={theme.accent} size="large" />
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginTop: 12 }}>Verifying your subscription...</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>This may take a moment.</Text>
          </View>
        )}

        {/* Personal Pro card */}
        {showPro && (
          <View style={{ padding: 20, marginBottom: 16, backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.accent + '50' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '700' }}>Personal Pro</Text>
              <View style={{ backgroundColor: theme.accent, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Popular</Text>
              </View>
            </View>
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 16 }}>For individual professionals</Text>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 36, fontWeight: '700' }}>$10</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 14, marginLeft: 8 }}>/ year</Text>
            </View>

            {PRO_FEATURES.map((f) => (
              <View key={f} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="checkmark-circle" size={18} color={theme.accent} />
                <Text style={{ color: theme.textSecondary, fontSize: 14, marginLeft: 12 }}>{f}</Text>
              </View>
            ))}

            <Button
              label={
                status === 'creating' && activePlan === 'personal_pro'
                  ? 'Creating checkout...'
                  : status === 'checkout' && activePlan === 'personal_pro'
                  ? 'Complete payment in browser'
                  : 'Upgrade to Pro — $10/year'
              }
              fullWidth
              loading={isLoading && activePlan === 'personal_pro'}
              disabled={isLoading}
              onPress={() => handleUpgrade('personal_pro')}
              style={{ marginTop: 20 }}
            />
          </View>
        )}

        {/* Enterprise card */}
        {showEnterprise && (
          <View style={{ padding: 20, marginBottom: 16, backgroundColor: theme.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 4 }}>Enterprise</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 14, marginBottom: 16 }}>For teams and organizations</Text>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 }}>
              <Text style={{ color: theme.textPrimary, fontSize: 36, fontWeight: '700' }}>$15</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 14, marginLeft: 8 }}>/ user / month</Text>
            </View>

            {ENTERPRISE_FEATURES.map((f) => (
              <View key={f} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="checkmark-circle" size={18} color={theme.warning} />
                <Text style={{ color: theme.textSecondary, fontSize: 14, marginLeft: 12 }}>{f}</Text>
              </View>
            ))}

            <Button
              label={
                status === 'creating' && activePlan === 'enterprise'
                  ? 'Creating checkout...'
                  : 'Start Enterprise Trial'
              }
              variant="secondary"
              fullWidth
              loading={isLoading && activePlan === 'enterprise'}
              disabled={isLoading}
              onPress={() => handleUpgrade('enterprise')}
              style={{ marginTop: 20 }}
            />
          </View>
        )}

        <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
          Payments secured by Stripe. Cancel anytime.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
