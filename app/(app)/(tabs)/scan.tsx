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
import { useConvex } from 'convex/react';
import { useSubscriptionStore } from '../../../src/stores/subscriptionStore';
import { useSettingsStore } from '../../../src/stores/settingsStore';
import { useScanQueueStore } from '../../../src/stores/scanQueueStore';
import { useAuthStore } from '../../../src/stores/authStore';
import { processExpressScan } from '../../../src/lib/expressScan';
import { Colors } from '../../../src/constants/theme';
import { useAppTheme } from '../../../src/theme/useAppTheme';
import ExpressQueueSheet from '../../../src/components/ExpressQueueSheet';

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
  const { expressMode, setExpressMode, syncToPhone } = useSettingsStore();
  const { addItem } = useScanQueueStore();
  const { user } = useAuthStore();
  const convex = useConvex();
  const theme = useAppTheme();
  const [queueSheetOpen, setQueueSheetOpen] = useState(false);
  const queueItems = useScanQueueStore((s) => s.items);
  const pendingCount = queueItems.filter((i) => i.status !== 'saved').length;

  const doCapture = useCallback(async () => {
    if (!cameraRef.current) return;

    if (!hasScansRemaining()) {
      showPaywall();
      router.push('/(app)/upgrade');
      return;
    }

    detectionRef.current = 'capturing';
    setDetection('capturing');
    if (!expressMode && pollingRef.current) clearInterval(pollingRef.current);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64:  false,
        exif:    false,
      });
      if (!photo) return;

      if (expressMode && user) {
        const id = addItem(photo.uri);
        processExpressScan({ id, imageUri: photo.uri, userId: user._id, convex, syncToPhone });
        // Resume scanning immediately so the next card can be captured while this one processes
        detectionRef.current = 'scanning';
        setDetection('scanning');
      } else {
        router.push({ pathname: '/(app)/scan/result', params: { imageUri: photo.uri } });
      }
    } catch {
      Alert.alert('Error', 'Failed to capture image. Please try again.');
      detectionRef.current = 'scanning';
      setDetection('scanning');
    }
  }, [hasScansRemaining, showPaywall, router, expressMode, user, convex, syncToPhone, addItem]);

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
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Ionicons name="camera-outline" size={64} color="#475569" />
        <Text className="text-slate-50 text-xl font-bold mt-6 text-center">
          Camera Permission Required
        </Text>
        <Text className="text-slate-400 text-base text-center mt-2 leading-6">
          CardVault needs camera access to scan business cards.
        </Text>
        <TouchableOpacity
          className="mt-8 px-8 py-4 rounded-2xl"
          style={{ backgroundColor: theme.accent }}
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
    detection === 'capturing' ? 'border-white/90' :
    'border-white/90';

  const frameAccentColor =
    detection === 'capturing' ? theme.accent : undefined;

  const statusLabel =
    detection === 'detected'  ? 'Card detected - hold steady...' :
    detection === 'capturing' ? 'Capturing...' :
    'Align business card within the frame';

  const statusColor =
    detection === 'detected'  ? 'text-emerald-400' :
    detection === 'capturing' ? undefined :
    'text-white/70';

  const statusAccentColor =
    detection === 'capturing' ? theme.accent : undefined;

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
            <TouchableOpacity
              onPress={() => setExpressMode(!expressMode)}
              className="flex-row items-center h-10 px-3 rounded-full"
              style={{ backgroundColor: expressMode ? theme.accent : 'rgba(0,0,0,0.5)' }}
            >
              <Ionicons name="flash" size={16} color={expressMode ? '#fff' : 'rgba(255,255,255,0.7)'} />
              <Text style={{ color: expressMode ? '#fff' : 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
                Express
              </Text>
            </TouchableOpacity>
            <Text className="text-white text-base font-semibold">Scan Card</Text>
            <View className="flex-row items-center gap-2">
              {expressMode && queueItems.length > 0 && (
                <TouchableOpacity
                  onPress={() => setQueueSheetOpen(true)}
                  className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
                >
                  <Ionicons name="layers-outline" size={18} color="#fff" />
                  {pendingCount > 0 && (
                    <View style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: theme.error, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{pendingCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className="w-10 h-10 bg-black/50 rounded-full items-center justify-center"
                onPress={() => setFlash(!flash)}
              >
                <Ionicons name={flash ? 'flash' : 'flash-off'} size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          {expressMode && (
            <Text className="text-white/60 text-xs text-center mt-2">
              Express Mode on — keep scanning, cards save in the background
            </Text>
          )}
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

          <Text className={`text-sm mt-5 ${statusColor ?? ''}`} style={statusAccentColor ? { color: statusAccentColor } : undefined}>{statusLabel}</Text>

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

        {/* Express Mode: latest queue item toast */}
        {expressMode && queueItems.length > 0 && (
          <View className="px-5 mb-3">
            <TouchableOpacity
              onPress={() => setQueueSheetOpen(true)}
              className="flex-row items-center bg-black/60 rounded-xl px-4 py-2.5"
            >
              {queueItems[0].status === 'processing' ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons
                  name={
                    queueItems[0].status === 'saved'    ? 'checkmark-circle' :
                    queueItems[0].status === 'duplicate' ? 'copy-outline' :
                    'warning-outline'
                  }
                  size={16}
                  color={
                    queueItems[0].status === 'saved'    ? '#34D399' :
                    queueItems[0].status === 'duplicate' ? '#FBBF24' :
                    '#F87171'
                  }
                />
              )}
              <Text className="text-white text-xs ml-2 flex-1" numberOfLines={1}>
                {queueItems[0].status === 'processing'
                  ? 'Processing card...'
                  : queueItems[0].contactName ?? queueItems[0].message ?? 'Card processed'}
              </Text>
              {queueItems.length > 1 && (
                <Text className="text-white/50 text-xs ml-2">+{queueItems.length - 1} more</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

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
                  detection === 'capturing' ? theme.accent :
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
            Card is detected automatically · tap shutter to capture manually
          </Text>
        </SafeAreaView>
      </CameraView>

      <ExpressQueueSheet visible={queueSheetOpen} onClose={() => setQueueSheetOpen(false)} />
    </View>
  );
}

