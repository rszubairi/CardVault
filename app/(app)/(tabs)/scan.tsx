import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { Colors } from '../../../src/constants/theme';

export default function ScanScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const { hasScansRemaining, showPaywall } = useSubscriptionStore();

  const handleCapture = async () => {
    if (!hasScansRemaining()) {
      showPaywall();
      router.push('/(app)/upgrade');
      return;
    }

    if (!cameraRef.current || capturing) return;
    setCapturing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        exif: false,
      });

      if (photo) {
        router.push({
          pathname: '/(app)/scan/result',
          params: { imageUri: photo.uri },
        });
      }
    } catch {
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-surface-900 items-center justify-center">
        <ActivityIndicator color={Colors.primary[500]} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-surface-900 items-center justify-center px-8">
        <Ionicons name="camera-outline" size={64} color="#475569" />
        <Text className="text-slate-50 text-xl font-bold mt-6 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-slate-400 text-base text-center mt-2 leading-6">
          CardVault needs camera access to scan business cards.
        </Text>
        <TouchableOpacity
          className="mt-8 bg-primary-500 px-8 py-4 rounded-2xl"
          onPress={requestPermission}
        >
          <Text className="text-white text-base font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
        flash={flash ? 'on' : 'off'}
      >
        {/* Top Controls */}
        <SafeAreaView edges={['top']} className="px-5 pt-2">
          <View className="flex-row items-center justify-between">
            <View className="w-10 h-10 bg-black/50 rounded-full items-center justify-center">
              <Text className="text-white text-xs font-bold">CV</Text>
            </View>
            <Text className="text-white text-base font-semibold">Scan Card</Text>
            <TouchableOpacity
              className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
              onPress={() => setFlash(!flash)}
            >
              <Ionicons name={flash ? 'flash' : 'flash-off'} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Viewfinder */}
        <View className="flex-1 items-center justify-center">
          <View className="w-80 h-52 relative">
            {/* Corner brackets */}
            {[
              'top-0 left-0 border-t-2 border-l-2',
              'top-0 right-0 border-t-2 border-r-2',
              'bottom-0 left-0 border-b-2 border-l-2',
              'bottom-0 right-0 border-b-2 border-r-2',
            ].map((cls, i) => (
              <View key={i} className={`absolute w-8 h-8 border-white/90 rounded-sm ${cls}`} />
            ))}
          </View>
          <Text className="text-white/70 text-sm mt-5">
            Align business card within the frame
          </Text>
        </View>

        {/* Bottom Controls */}
        <SafeAreaView edges={['bottom']} className="pb-6">
          <View className="flex-row items-center justify-around px-10">
            <TouchableOpacity
              className="w-14 h-14 bg-black/50 rounded-full items-center justify-center"
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>

            {/* Shutter */}
            <TouchableOpacity
              onPress={handleCapture}
              disabled={capturing}
              className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
              style={{ backgroundColor: capturing ? '#6366F1' : 'rgba(255,255,255,0.15)' }}
            >
              {capturing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View className="w-14 h-14 bg-white rounded-full" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="w-14 h-14 bg-black/50 rounded-full items-center justify-center"
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}
