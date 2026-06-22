import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthStore } from '../../src/stores/authStore';
import { useSecurityStore } from '../../src/stores/securityStore';
import { generateSalt, hashPIN, deriveKey } from '../../src/lib/encryption';

const PIN_LENGTH = 6;

function PinDots({ pin, length }: { pin: string; length: number }) {
  return (
    <View className="flex-row gap-x-4 my-8">
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          className={`w-4 h-4 rounded-full border-2 ${
            i < pin.length
              ? 'bg-primary-500 border-primary-500'
              : 'bg-transparent border-slate-500'
          }`}
        />
      ))}
    </View>
  );
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

function NumPad({ onPress }: { onPress: (key: string) => void }) {
  return (
    <View className="w-full max-w-xs">
      {[0, 1, 2, 3].map((row) => (
        <View key={row} className="flex-row justify-between mb-4">
          {KEYS.slice(row * 3, row * 3 + 3).map((key, col) => (
            <TouchableOpacity
              key={col}
              onPress={() => key && onPress(key)}
              disabled={!key}
              className={`w-20 h-16 rounded-2xl items-center justify-center ${
                key ? 'bg-surface-800 active:bg-surface-700' : 'opacity-0'
              }`}
            >
              {key === 'del' ? (
                <Ionicons name="backspace-outline" size={24} color="#e2e8f0" />
              ) : (
                <Text className="text-slate-100 text-2xl font-semibold">{key}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

type Step = 'create' | 'confirm';

export default function PinSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { setEncryptionKey, setEncryptionEnabled, setPinConfigured } = useSecurityStore();
  const setupPIN = useMutation(api.users.setupPIN);

  const [step, setStep] = useState<Step>('create');
  const [firstPIN, setFirstPIN] = useState('');
  const [currentPIN, setCurrentPIN] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKey = useCallback(
    (key: string) => {
      if (key === 'del') {
        setCurrentPIN((p) => p.slice(0, -1));
        return;
      }
      if (currentPIN.length >= PIN_LENGTH) return;
      const next = currentPIN + key;
      setCurrentPIN(next);

      if (next.length === PIN_LENGTH) {
        // auto-advance after a brief moment so the last dot fills in visually
        setTimeout(() => handleComplete(next), 150);
      }
    },
    [currentPIN, step, firstPIN],
  );

  const handleComplete = async (pin: string) => {
    if (step === 'create') {
      setFirstPIN(pin);
      setCurrentPIN('');
      setStep('confirm');
      return;
    }

    // confirm step
    if (pin !== firstPIN) {
      Alert.alert('PINs do not match', 'Please try again.');
      setCurrentPIN('');
      setStep('create');
      setFirstPIN('');
      return;
    }

    if (!user?._id) return;
    setLoading(true);
    try {
      const pinSalt        = generateSalt(16);
      const encryptionSalt = generateSalt(32);
      const pinHash        = await hashPIN(pin, pinSalt);
      const key            = await deriveKey(pin, encryptionSalt);

      await setupPIN({
        userId:         user._id as any,
        pinHash,
        pinSalt,
        encryptionSalt,
      });

      setEncryptionKey(key);
      setEncryptionEnabled(true);
      setPinConfigured(true);

      router.replace('/(app)/(tabs)');
    } catch (e) {
      Alert.alert('Error', 'Could not save PIN. Please try again.');
      setLoading(false);
      setCurrentPIN('');
      setStep('create');
      setFirstPIN('');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-surface-900 items-center justify-center">
        <ActivityIndicator size="large" color="#6366F1" />
        <Text className="text-slate-400 mt-4">Securing your data…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-900 items-center px-6">
      <View className="mt-16 items-center mb-4">
        <View className="w-16 h-16 bg-primary-500/20 rounded-2xl items-center justify-center mb-5">
          <Ionicons name="lock-closed" size={32} color="#6366F1" />
        </View>
        <Text className="text-slate-50 text-3xl font-bold text-center">
          {step === 'create' ? 'Create Your PIN' : 'Confirm Your PIN'}
        </Text>
        <Text className="text-slate-400 text-base text-center mt-3 max-w-xs leading-6">
          {step === 'create'
            ? 'Choose a 6-digit PIN to encrypt your contacts. Only you will be able to access them.'
            : 'Enter the same PIN again to confirm.'}
        </Text>
      </View>

      <PinDots pin={currentPIN} length={PIN_LENGTH} />

      <NumPad onPress={handleKey} />

      <TouchableOpacity
        onPress={() => router.replace('/(app)/(tabs)')}
        className="mt-8 py-3 px-6"
      >
        <Text className="text-slate-500 text-sm">Skip — set up later in Settings</Text>
      </TouchableOpacity>
    </View>
  );
}
