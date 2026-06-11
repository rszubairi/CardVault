import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { format } from 'date-fns';
import Card from '../../../../src/components/ui/Card';
import { useAuthStore } from '../../../../src/stores/authStore';

export default function ContactNotesScreen() {
  const { id }       = useLocalSearchParams<{ id: string }>();
  const router       = useRouter();
  const { user }     = useAuthStore();
  const notes        = useQuery(api.notes.list, { contactId: id as Id<'contacts'> });
  const createNote   = useMutation(api.notes.create);
  const deleteNote   = useMutation(api.notes.remove);

  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!text.trim() || !user) return;
    setSaving(true);
    try {
      await createNote({
        contactId: id as Id<'contacts'>,
        userId:    user._id,
        content:   text.trim(),
        type:      'text',
      });
      setText('');
    } catch {
      Alert.alert('Error', 'Could not save note.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (noteId: Id<'notes'>) => {
    Alert.alert('Delete Note', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteNote({ noteId }) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="text-slate-50 text-lg font-bold">Notes</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>
          {notes && notes.length > 0 ? (
            notes.map((note) => (
              <Card key={note._id} className="p-4 mb-3">
                <Text className="text-slate-200 text-sm leading-6">{note.content}</Text>
                <View className="flex-row items-center justify-between mt-3">
                  <Text className="text-slate-500 text-xs">
                    {format(new Date(note.createdAt), 'MMM d, yyyy · h:mm a')}
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(note._id as Id<'notes'>)}>
                    <Ionicons name="trash-outline" size={16} color="#475569" />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          ) : (
            <View className="items-center py-12">
              <Ionicons name="document-text-outline" size={48} color="#334155" />
              <Text className="text-slate-500 text-sm mt-3">No notes yet</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View className="px-5 pb-4 pt-2 border-t border-surface-800">
          <View className="flex-row items-end bg-surface-800 rounded-2xl px-4 py-3 border border-surface-700">
            <TextInput
              className="flex-1 text-slate-100 text-sm max-h-32"
              placeholder="Add a note..."
              placeholderTextColor="#64748B"
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!text.trim() || saving}
              className={`ml-3 w-9 h-9 rounded-full items-center justify-center ${text.trim() ? 'bg-primary-500' : 'bg-surface-600'}`}
            >
              <Ionicons name="send" size={16} color={text.trim() ? '#fff' : '#64748B'} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
