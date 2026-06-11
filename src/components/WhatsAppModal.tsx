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
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface-800 rounded-t-3xl p-5 pb-10">
          <View className="flex-row items-center mb-4">
            <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            <Text className="text-slate-50 text-lg font-bold ml-2 flex-1">Send Introduction</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text className="text-slate-400 text-xs mb-2">
            To: {contact.mobile ?? contact.phone}
          </Text>

          <TextInput
            className="bg-surface-700 rounded-xl p-4 text-slate-100 text-sm leading-6 min-h-[140px]"
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
          />

          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              className="flex-1 bg-surface-700 rounded-xl py-3 items-center"
              onPress={() => setMessage(generateWhatsAppIntro({ contact, senderName, eventName }))}
            >
              <Text className="text-slate-400 text-sm font-medium">Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-2 bg-[#25D366] rounded-xl py-3 px-6 flex-row items-center justify-center"
              onPress={handleSend}
            >
              <Ionicons name="send" size={16} color="#fff" />
              <Text className="text-white text-sm font-semibold ml-2">Send on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
