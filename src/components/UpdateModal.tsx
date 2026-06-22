import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Doc } from '../../convex/_generated/dataModel';

type Release = Doc<'appReleases'>;

interface UpdateModalProps {
  release: Release;
  onSkip: () => void;        // minor only: dismiss for this session
  onSkipVersion: () => void; // minor only: never show this version again
}

export default function UpdateModal({ release, onSkip, onSkipVersion }: UpdateModalProps) {
  const isMajor = release.releaseType === 'major';

  const openStore = () => {
    const url = Platform.OS === 'ios' ? release.iosUrl : release.androidUrl;
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal
      visible
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={isMajor ? undefined : onSkip}
    >
      <View className="flex-1 bg-surface-900 px-6 pt-16 pb-10">
        {/* Header */}
        <View className="items-center mb-8">
          <View
            className={`w-20 h-20 rounded-3xl items-center justify-center mb-5 ${
              isMajor ? 'bg-red-500/20' : 'bg-primary-500/20'
            }`}
          >
            <Ionicons
              name={isMajor ? 'rocket' : 'arrow-up-circle'}
              size={40}
              color={isMajor ? '#EF4444' : '#6366F1'}
            />
          </View>

          <View
            className={`px-3 py-1 rounded-full mb-3 ${
              isMajor ? 'bg-red-500/20' : 'bg-primary-500/20'
            }`}
          >
            <Text
              className={`text-xs font-semibold uppercase tracking-wider ${
                isMajor ? 'text-red-400' : 'text-primary-400'
              }`}
            >
              {isMajor ? 'Required Update' : 'Update Available'}
            </Text>
          </View>

          <Text className="text-slate-50 text-2xl font-bold text-center">
            Version {release.version}
          </Text>
          <Text className="text-slate-400 text-sm text-center mt-2">
            {isMajor
              ? 'This update is required to continue using CardVault.'
              : 'A new version of CardVault is available.'}
          </Text>
        </View>

        {/* Release Notes */}
        <View className="flex-1 mb-6">
          <Text className="text-slate-400 text-xs uppercase tracking-widest mb-3">
            What's New
          </Text>
          <View className="bg-surface-800 rounded-2xl p-4 border border-surface-700 flex-1">
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-slate-200 text-sm leading-6">
                {release.releaseNotes}
              </Text>
            </ScrollView>
          </View>
        </View>

        {/* Actions */}
        <View className="gap-y-3">
          <TouchableOpacity
            onPress={openStore}
            className={`rounded-2xl py-4 items-center justify-center flex-row gap-x-2 ${
              isMajor ? 'bg-red-500' : 'bg-primary-500'
            }`}
          >
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text className="text-white text-base font-semibold">Update Now</Text>
          </TouchableOpacity>

          {!isMajor && (
            <>
              <TouchableOpacity
                onPress={onSkip}
                className="bg-surface-800 rounded-2xl py-4 items-center justify-center border border-surface-700"
              >
                <Text className="text-slate-300 text-base font-medium">Remind Me Later</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onSkipVersion} className="py-3 items-center">
                <Text className="text-slate-500 text-sm">Skip This Version</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
