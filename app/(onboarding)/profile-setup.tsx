import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthStore } from '../../src/stores/authStore';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const updateProfile = useMutation(api.users.updateProfile);

  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      await updateProfile({
        userId: user._id as any,
        phone: phone.trim() || undefined,
        linkedinUrl: linkedin.trim() || undefined,
      });
      router.replace('/(app)/(tabs)');
    } catch {
      router.replace('/(app)/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface-900"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 py-16 justify-between">
          {/* Header */}
          <View className="items-center mt-10 mb-10">
            <View className="w-16 h-16 bg-primary-500 rounded-2xl items-center justify-center mb-5">
              <Ionicons name="person-circle-outline" size={36} color="#fff" />
            </View>
            <Text className="text-slate-50 text-3xl font-bold">Welcome to CardVault</Text>
            <Text className="text-slate-400 text-base text-center mt-3 max-w-xs leading-6">
              Let's set up your profile so others can connect with you.
            </Text>
          </View>

          {/* Fields */}
          <View className="gap-y-4 flex-1">
            <View>
              <Text className="text-slate-400 text-sm mb-2 ml-1">Email</Text>
              <View className="flex-row items-center bg-surface-800 rounded-xl px-4 py-3 border border-surface-700">
                <Ionicons name="mail-outline" size={18} color="#6366F1" />
                <TextInput
                  value={email}
                  editable={false}
                  className="flex-1 text-slate-300 ml-3 text-base"
                  style={{ color: '#94a3b8' }}
                />
              </View>
            </View>

            <View>
              <Text className="text-slate-400 text-sm mb-2 ml-1">Phone Number</Text>
              <View className="flex-row items-center bg-surface-800 rounded-xl px-4 py-3 border border-surface-700">
                <Ionicons name="call-outline" size={18} color="#6366F1" />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+1 555 000 0000"
                  placeholderTextColor="#475569"
                  keyboardType="phone-pad"
                  className="flex-1 text-slate-200 ml-3 text-base"
                  style={{ color: '#e2e8f0' }}
                />
              </View>
            </View>

            <View>
              <Text className="text-slate-400 text-sm mb-2 ml-1">LinkedIn Profile URL</Text>
              <View className="flex-row items-center bg-surface-800 rounded-xl px-4 py-3 border border-surface-700">
                <Ionicons name="logo-linkedin" size={18} color="#0A66C2" />
                <TextInput
                  value={linkedin}
                  onChangeText={setLinkedin}
                  placeholder="https://linkedin.com/in/yourname"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  keyboardType="url"
                  className="flex-1 text-slate-200 ml-3 text-base"
                  style={{ color: '#e2e8f0' }}
                />
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="gap-y-3 mt-10">
            <TouchableOpacity
              onPress={handleContinue}
              disabled={loading}
              className="bg-primary-500 rounded-2xl py-4 items-center justify-center"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-semibold">Continue to Dashboard</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.replace('/(app)/(tabs)')}
              className="py-3 items-center"
            >
              <Text className="text-slate-500 text-sm">Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

