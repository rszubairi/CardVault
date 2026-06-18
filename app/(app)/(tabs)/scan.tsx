import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { Colors } from '../../../src/constants/theme';

type DetectionState = 'scanning' | 'detected' | 'capturing';

const POLL_INTERVAL_MS = 1500;
const CAPTURE_DELAY_MS = 700;
const MIN_TEXT_LENGTH  = 15;

export default function ScanScreen() {
  const router    = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing]             = useState<CameraType>('back');
  const [flash, setFlash]               = useState(false);
  const [detection, setDetection]       = useState<DetectionState>('scanning');

  // refs so interval callbacks read current values without stale closures
  const detectionRef  = useRef<DetectionState>('scanning');
  const pollingRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const captureTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { hasScansRemaining, showPaywall } = useSubscriptionStore();

  const doCapture = useCallback(async () => {
    if (!cameraRef.current) return;

    if (!hasScansRemaining()) {
      showPaywall();
      router.push('/(app)/upgrade');
      return;
    }

    detectionRef.current = 'capturing';
    setDetection('capturing');
    if (pollingRef.current) clearInterval(pollingRef.current);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64:  false,
        exif:    false,
      });
      if (photo) {
        router.push({ pathname: '/(app)/scan/result', params: { imageUri: photo.uri } });
      }
    } catch {
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      detectionRef.current = 'scanning';
      setDetection('scanning');
    }
  }, [hasScansRemaining, showPaywall, router]);

  const startPolling = useCallback(() => {
    pollingRef.current = setInterval(async () => {
      if (detectionRef.current !== 'scanning') return;
      if (!cameraRef.current) return;

      try {
        const preview = await cameraRef.current.takePictureAsync({
          quality: 0.15,
          base64:  false,
          exif:    false,
        });
        if (!preview) return;

        const result  = await TextRecognition.recognize(preview.uri);
        const hasCard = (result.text ?? '').trim().length >= MIN_TEXT_LENGTH;

        if (hasCard && detectionRef.current === 'scanning') {
          detectionRef.current = 'detected';
          setDetection('detected');
          captureTimer.current = setTimeout(doCapture, CAPTURE_DELAY_MS);
        }
      } catch {
        // silently ignore per-frame errors
      }
    }, POLL_INTERVAL_MS);
  }, [doCapture]);

  // Reset state and restart polling every time this screen comes into focus.
  // Without this, the tab-cached component stays stuck in 'capturing' after a scan.
  useFocusEffect(
    useCallback(() => {
      if (!permission?.granted) return;
      detectionRef.current = 'scanning';
      setDetection('scanning');
      startPolling();
      return () => {
        if (pollingRef.current)   clearInterval(pollingRef.current);
        if (captureTimer.current) clearTimeout(captureTimer.current);
      };
    }, [permission?.granted, startPolling])
  );

  const handleManualCapture = () => {
    if (detectionRef.current === 'capturing') return;
    if (captureTimer.current) clearTimeout(captureTimer.current);
    doCapture();
  };

  // â”€â”€ Permission loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Detection state helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const frameColor =
    detection === 'detected'  ? 'border-emerald-400' :
    detection === 'capturing' ? 'border-primary-500' :
    'border-white/90';

  const statusLabel =
    detection === 'detected'  ? 'Card detected â€” hold steady...' :
    detection === 'capturing' ? 'Capturing...' :
    'Align business card within the frame';

  const statusColor =
    detection === 'detected'  ? 'text-emerald-400' :
    detection === 'capturing' ? 'text-primary-400' :
    'text-white/70';

  // â”€â”€ UI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            {/* Corner brackets â€” colour changes on detection */}
            {[
              `top-0 left-0 border-t-2 border-l-2`,
              `top-0 right-0 border-t-2 border-r-2`,
              `bottom-0 left-0 border-b-2 border-l-2`,
              `bottom-0 right-0 border-b-2 border-r-2`,
            ].map((cls, i) => (
              <View
                key={i}
                className={`absolute w-8 h-8 rounded-sm ${cls} ${frameColor}`}
              />
            ))}

            {/* Detected flash overlay */}
            {detection === 'detected' && (
              <View className="absolute inset-0 bg-emerald-400/10 rounded-lg border border-emerald-400/30" />
            )}
          </View>

          <Text className={`text-sm mt-5 ${statusColor}`}>{statusLabel}</Text>

          {/* Auto-detect badge */}
          <View className="flex-row items-center mt-3 bg-black/50 px-3 py-1.5 rounded-full">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                detection === 'scanning' ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <Text className="text-white/70 text-xs">Auto-detect active</Text>
          </View>
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

            {/* Manual shutter */}
            <TouchableOpacity
              onPress={handleManualCapture}
              disabled={detection === 'capturing'}
              className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
              style={{
                backgroundColor:
                  detection === 'capturing' ? '#6366F1' :
                  detection === 'detected'  ? 'rgba(52,211,153,0.25)' :
                  'rgba(255,255,255,0.15)',
              }}
            >
              {detection === 'capturing' ? (
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

          <Text className="text-white/40 text-xs text-center mt-3">
            Card is detected automatically Â· tap shutter to capture manually
          </Text>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

