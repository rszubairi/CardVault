import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import Input from '../../../src/components/ui/Input';
import { useAuthStore } from '../../../src/stores/authStore';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { E } from '../../../enterprise/constants/theme';
import { isEnterprise } from '../../../src/config/appVariant';

const ROLE_LABELS: Record<string, string> = {
  owner:     'Owner',
  admin:     'Admin',
  manager:   'Manager',
  member:    'Member',
  read_only: 'Read Only',
};

export default function AcceptInviteScreen() {
  const router  = useRouter();
  const params  = useLocalSearchParams<{ inviteId: string; orgName: string; role: string }>();
  const { user } = useAuthStore();
  const { setPlan } = useSubscriptionStore();

  const acceptInvite  = useMutation(api.organizations.acceptInvite);
  const declineInvite = useMutation(api.organizations.declineInvite);

  const [corporateEmail, setCorporateEmail] = useState('');
  const [inviteCode,     setInviteCode]     = useState('');
  const [loading,        setLoading]        = useState(false);

  const orgName = params.orgName ?? 'the organization';
  const role    = params.role    ?? 'member';

  const handleAccept = async () => {
    if (!user || !inviteCode.trim() || !corporateEmail.trim()) return;
    if (!corporateEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid corporate email address.');
      return;
    }

    setLoading(true);
    try {
      const result = await acceptInvite({
        userId:         user._id as Id<'users'>,
        inviteCode:     inviteCode.trim().toUpperCase(),
        corporateEmail: corporateEmail.trim().toLowerCase(),
      });

      // Update Zustand subscription store so the theme switches immediately
      setPlan('enterprise');

      Alert.alert(
        'Welcome to the Team!',
        `You've joined ${result.orgName} as ${ROLE_LABELS[result.role] ?? result.role}. The enterprise theme has been applied to your account.`,
        [{ text: 'Continue', onPress: () => router.replace('/(app)/(tabs)/') }],
      );
    } catch (err: any) {
      Alert.alert('Could Not Accept Invite', err.message ?? 'Please check your invite code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    if (!user || !params.inviteId) return;
    Alert.alert(
      'Decline Invitation',
      `Are you sure you want to decline the invitation to ${orgName}?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await declineInvite({
                userId:   user._id as Id<'users'>,
                inviteId: params.inviteId as Id<'organizationInvites'>,
              });
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ],
    );
  };

  const accent = isEnterprise ? E.gold : '#6366F1';
  const bg     = isEnterprise ? E.bg   : '#0F172A';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: isEnterprise ? E.border : '#334155' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={isEnterprise ? E.textMuted : '#94A3B8'} />
        </TouchableOpacity>
        <Text style={{ color: isEnterprise ? E.textPrimary : '#F1F5F9', fontSize: 18, fontWeight: '700' }}>
          Accept Invitation
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
        {/* Org card */}
        <View style={{
          backgroundColor: isEnterprise ? E.surface : '#1E293B',
          borderRadius: 20,
          padding: 24,
          marginBottom: 32,
          borderWidth: 1,
          borderColor: accent + '40',
          alignItems: 'center',
        }}>
          <View style={{
            width: 64, height: 64, borderRadius: 18,
            backgroundColor: accent + '20',
            borderWidth: 1.5, borderColor: accent + '50',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Ionicons name="business" size={30} color={accent} />
          </View>
          <Text style={{ color: accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 }}>
            Organization Invitation
          </Text>
          <Text style={{ color: isEnterprise ? E.textPrimary : '#F1F5F9', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 6 }}>
            {orgName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: accent + '18', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
            <Ionicons name="shield-checkmark-outline" size={14} color={accent} />
            <Text style={{ color: accent, fontSize: 13, fontWeight: '600' }}>
              Role: {ROLE_LABELS[role] ?? role}
            </Text>
          </View>
        </View>

        <Text style={{ color: isEnterprise ? E.textSecondary : '#94A3B8', fontSize: 14, lineHeight: 22, marginBottom: 28, textAlign: 'center' }}>
          To verify your identity, enter your corporate email address and the invite code you received.
        </Text>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: isEnterprise ? E.textMuted : '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Corporate Email
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: isEnterprise ? E.surface : '#1E293B',
            borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
            borderWidth: 1, borderColor: isEnterprise ? E.border : '#334155',
          }}>
            <Ionicons name="briefcase-outline" size={18} color={accent} style={{ marginRight: 12 }} />
            <Input
              value={corporateEmail}
              onChangeText={setCorporateEmail}
              placeholder="you@company.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ flex: 1, color: isEnterprise ? E.textPrimary : '#F1F5F9', fontSize: 15, padding: 0, backgroundColor: 'transparent' }}
            />
          </View>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ color: isEnterprise ? E.textMuted : '#64748B', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Invite Code
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: isEnterprise ? E.surface : '#1E293B',
            borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
            borderWidth: 1, borderColor: isEnterprise ? E.border : '#334155',
          }}>
            <Ionicons name="key-outline" size={18} color={accent} style={{ marginRight: 12 }} />
            <Input
              value={inviteCode}
              onChangeText={(t) => setInviteCode(t.toUpperCase())}
              placeholder="XXXXXXXX"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              style={{ flex: 1, color: isEnterprise ? E.textPrimary : '#F1F5F9', fontSize: 18, fontWeight: '700', letterSpacing: 3, padding: 0, backgroundColor: 'transparent' }}
            />
          </View>
          <Text style={{ color: isEnterprise ? E.textMuted : '#475569', fontSize: 12, marginTop: 8 }}>
            8-character code from the invitation email
          </Text>
        </View>

        {/* Accept button */}
        <TouchableOpacity
          onPress={handleAccept}
          disabled={loading || !inviteCode.trim() || !corporateEmail.trim()}
          style={{
            backgroundColor: (!inviteCode.trim() || !corporateEmail.trim()) ? (isEnterprise ? E.surfaceAlt : '#334155') : accent,
            borderRadius: 16,
            paddingVertical: 18,
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          {loading ? (
            <ActivityIndicator color={isEnterprise ? E.bg : '#fff'} />
          ) : (
            <Text style={{ color: isEnterprise ? E.bg : '#fff', fontSize: 16, fontWeight: '700' }}>
              Join Organization
            </Text>
          )}
        </TouchableOpacity>

        {/* Decline */}
        {params.inviteId && (
          <TouchableOpacity onPress={handleDecline} style={{ alignItems: 'center', paddingVertical: 14 }}>
            <Text style={{ color: isEnterprise ? E.textMuted : '#64748B', fontSize: 15 }}>Decline Invitation</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
