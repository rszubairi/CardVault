import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Contact } from '../types';
import { generateWhatsAppIntro } from '../lib/aiMessages';
import { useAppTheme } from '../theme/useAppTheme';

interface Props {
  visible: boolean;
  contact: Contact;
  senderName: string;
  eventName?: string;
  onClose: () => void;
  onSent: () => void;
}

export default function WhatsAppModal({
  visible, contact, senderName, eventName, onClose, onSent,
}: Props) {
  const [message, setMessage] = useState(() =>
    generateWhatsAppIntro({ contact, senderName, eventName }),
  );
  const theme = useAppTheme();

  const handleSend = async () => {
    const number = (contact.mobile ?? contact.phone)!.replace(/[^\d+]/g, '');
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('WhatsApp Not Found', 'Please install WhatsApp to send messages.');
      return;
    }
    await Linking.openURL(url);
    onSent();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: theme.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 }}>
          <View className="flex-row items-center mb-4">
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700', marginLeft: 8, flex: 1 }}>Send Introduction</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 8 }}>
            To: {contact.mobile ?? contact.phone}
          </Text>

          <TextInput
            style={{ backgroundColor: theme.surfaceAlt, borderRadius: 12, padding: 16, color: theme.textPrimary, fontSize: 14, lineHeight: 22, minHeight: 140 }}
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
          />

          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: theme.surfaceAlt, borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}
              onPress={() => setMessage(generateWhatsAppIntro({ contact, senderName, eventName }))}
            >
              <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: '500' }}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-2"
              style={{ backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              onPress={handleSend}
            >
              <Ionicons name="send" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>Send on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
