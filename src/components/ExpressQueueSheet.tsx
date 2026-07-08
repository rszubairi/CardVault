import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useScanQueueStore, ScanQueueItem } from '../stores/scanQueueStore';
import { useAppTheme } from '../theme/useAppTheme';

function statusMeta(item: ScanQueueItem, theme: ReturnType<typeof useAppTheme>) {
  switch (item.status) {
    case 'processing':
      return { icon: 'time-outline' as const, color: theme.accent, label: 'Processing...' };
    case 'saved':
      return { icon: 'checkmark-circle' as const, color: theme.success, label: item.contactName ?? 'Saved' };
    case 'duplicate':
      return { icon: 'copy-outline' as const, color: theme.warning, label: item.message ?? 'Duplicate' };
    case 'needs_review':
      return { icon: 'alert-circle-outline' as const, color: theme.warning, label: item.message ?? 'Needs review' };
    case 'error':
      return { icon: 'close-circle-outline' as const, color: theme.error, label: item.message ?? 'Failed' };
  }
}

export default function ExpressQueueSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useAppTheme();
  const router = useRouter();
  const items = useScanQueueStore((s) => s.items);
  const dismissItem = useScanQueueStore((s) => s.dismissItem);
  const clearResolved = useScanQueueStore((s) => s.clearResolved);

  const handlePress = (item: ScanQueueItem) => {
    if (item.status === 'processing') return;
    onClose();
    if (item.status === 'saved' && item.contactId) {
      router.push({ pathname: '/(app)/contact/[id]', params: { id: item.contactId } });
    } else if (item.status === 'duplicate' && item.contactId) {
      router.push({ pathname: '/(app)/contact/[id]', params: { id: item.contactId } });
    } else if (item.status === 'needs_review' || item.status === 'error') {
      router.push({ pathname: '/(app)/scan/result', params: { imageUri: item.imageUri } });
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '75%', paddingBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700', flex: 1 }}>Express Scan Queue</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {items.length === 0 ? (
            <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 32 }}>
              No cards scanned yet this session.
            </Text>
          ) : (
            <ScrollView style={{ paddingHorizontal: 20 }}>
              {items.map((item) => {
                const meta = statusMeta(item, theme);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handlePress(item)}
                    disabled={item.status === 'processing'}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}
                  >
                    <Image source={{ uri: item.imageUri }} style={{ width: 44, height: 32, borderRadius: 6, marginRight: 12, backgroundColor: theme.surfaceAlt }} />
                    {item.status === 'processing' ? (
                      <ActivityIndicator color={theme.accent} size="small" style={{ marginRight: 10 }} />
                    ) : (
                      <Ionicons name={meta!.icon} size={18} color={meta!.color} style={{ marginRight: 10 }} />
                    )}
                    <Text style={{ color: theme.textPrimary, fontSize: 14, flex: 1 }} numberOfLines={1}>
                      {meta!.label}
                    </Text>
                    {item.status !== 'processing' && (
                      <TouchableOpacity onPress={() => dismissItem(item.id)} hitSlop={8}>
                        <Ionicons name="close" size={16} color={theme.textMuted} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {items.some((i) => i.status !== 'processing') && (
            <TouchableOpacity
              onPress={clearResolved}
              style={{ marginTop: 16, marginHorizontal: 20, paddingVertical: 12, alignItems: 'center', backgroundColor: theme.surfaceAlt, borderRadius: 12 }}
            >
              <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '500' }}>Clear Completed</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}
