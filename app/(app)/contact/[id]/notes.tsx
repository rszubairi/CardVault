import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import {
  createAudioPlayer,
  AudioPlayer,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from 'expo-audio';
import { format } from 'date-fns';
import Card from '../../../../src/components/ui/Card';
import { useAuthStore } from '../../../../src/stores/authStore';

type RecordingState = 'idle' | 'recording' | 'processing';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function VoiceNoteRow({ audioUrl, duration }: { audioUrl: string; duration: string }) {
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    return () => {
      playerRef.current?.remove();
      playerRef.current = null;
    };
  }, []);

  const toggle = async () => {
    if (playing && playerRef.current) {
      playerRef.current.pause();
      setPlaying(false);
      return;
    }
    if (playerRef.current) {
      playerRef.current.play();
      setPlaying(true);
      return;
    }
    try {
      const player = createAudioPlayer(audioUrl);
      playerRef.current = player;
      player.play();
      setPlaying(true);

      // Poll for playback finished
      const checkInterval = setInterval(() => {
        if (player.currentTime >= player.duration - 0.5) {
          clearInterval(checkInterval);
          setPlaying(false);
          playerRef.current = null;
        }
      }, 500);
    } catch {
      Alert.alert('Playback Error', 'Could not play voice note.');
    }
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      className="flex-row items-center bg-primary-900/40 rounded-xl px-4 py-3 mt-2"
    >
      <View className="w-8 h-8 bg-primary-500 rounded-full items-center justify-center mr-3">
        <Ionicons name={playing ? 'pause' : 'play'} size={16} color="#fff" />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          {[...Array(12)].map((_, i) => (
            <View
              key={i}
              className="bg-primary-400 rounded-full w-1"
              style={{ height: 6 + Math.sin(i * 0.8) * 10 }}
            />
          ))}
        </View>
      </View>
      <Text className="text-slate-400 text-xs ml-3">{duration}</Text>
    </TouchableOpacity>
  );
}

export default function ContactNotesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const notes = useQuery(api.notes.list, { contactId: id as Id<'contacts'> });
  const createNote = useMutation(api.notes.create);
  const deleteNote = useMutation(api.notes.remove);
  const getUploadUrl = useMutation(api.notes.generateUploadUrl);

  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setDuration] = useState(0);
  const recorderRef = useRef<import('expo-audio').AudioRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (recordingState === 'recording') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recordingState, pulseAnim]);

  const startRecording = async () => {
    const { status } = await requestRecordingPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Microphone Access', 'Please allow microphone access in Settings to record voice notes.');
      return;
    }
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
        shouldRouteThroughEarpiece: false,
      });

      const { AudioRecorder } = await import('expo-audio');
      const recorder = new AudioRecorder(RecordingPresets.HIGH_QUALITY);
      await recorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
      recorder.record();
      recorderRef.current = recorder;
      setRecordingState('recording');
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current || !user) return;
    clearInterval(timerRef.current!);
    setRecordingState('processing');

    try {
      const recorder = recorderRef.current;
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: false,
        shouldPlayInBackground: false,
        interruptionMode: 'mixWithOthers',
      });
      const uri = recorder.uri || '';
      const duration = recordingDuration;

      // Upload audio to Convex storage (falls back to local URI in dev builds)
      let audioUrl = uri;
      try {
        const uploadUrl = await getUploadUrl({});
        const res = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'audio/m4a' },
          body: await (await fetch(uri)).blob(),
        });
        const { storageId } = await res.json();
        audioUrl = storageId;
      } catch {
        // Dev build: store local URI
      }

      await createNote({
        contactId: id as Id<'contacts'>,
        userId: user._id,
        content: `Voice note (${formatDuration(duration)})`,
        type: 'voice',
        audioUrl,
      });
    } catch {
      Alert.alert('Error', 'Could not save voice note.');
    } finally {
      recorderRef.current = null;
      setRecordingState('idle');
      setDuration(0);
    }
  };

  const handleAdd = async () => {
    if (!text.trim() || !user) return;
    setSaving(true);
    try {
      await createNote({
        contactId: id as Id<'contacts'>,
        userId: user._id,
        content: text.trim(),
        type: 'text',
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
        <Text className="flex-1 text-slate-50 text-lg font-bold">Notes</Text>
        <TouchableOpacity onPress={() => router.push(`/(app)/contact/${id}/timeline`)}>
          <Ionicons name="time-outline" size={22} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>
          {notes && notes.length > 0 ? (
            notes.map((note) => (
              <Card key={note._id} className="p-4 mb-3">
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name={note.type === 'voice' ? 'mic' : 'document-text-outline'}
                      size={14}
                      color={note.type === 'voice' ? '#6366F1' : '#475569'}
                    />
                    <Text className="text-slate-500 text-xs uppercase tracking-wide">
                      {note.type === 'voice' ? 'Voice Note' : 'Note'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(note._id as Id<'notes'>)}>
                    <Ionicons name="trash-outline" size={16} color="#475569" />
                  </TouchableOpacity>
                </View>

                {note.type === 'voice' && note.audioUrl ? (
                  <VoiceNoteRow
                    audioUrl={note.audioUrl}
                    duration={note.content.match(/\((.+)\)/)?.[1] ?? ''}
                  />
                ) : (
                  <Text className="text-slate-200 text-sm leading-6 mt-2">{note.content}</Text>
                )}

                <Text className="text-slate-500 text-xs mt-3">
                  {format(new Date(note.createdAt), 'MMM d, yyyy · h:mm a')}
                </Text>
              </Card>
            ))
          ) : (
            <View className="items-center py-12">
              <Ionicons name="document-text-outline" size={48} color="#334155" />
              <Text className="text-slate-500 text-sm mt-3">No notes yet</Text>
            </View>
          )}
        </ScrollView>

        {/* Recording indicator */}
        {recordingState === 'recording' && (
          <View className="mx-5 mb-3 bg-red-900/30 border border-red-700/50 rounded-2xl px-5 py-3 flex-row items-center">
            <Animated.View
              style={{ transform: [{ scale: pulseAnim }] }}
              className="w-3 h-3 bg-red-500 rounded-full mr-3"
            />
            <Text className="text-red-400 text-sm font-medium flex-1">
              Recording... {formatDuration(recordingDuration)}
            </Text>
            <TouchableOpacity
              onPress={stopRecording}
              className="bg-red-500 rounded-full w-9 h-9 items-center justify-center"
            >
              <Ionicons name="stop" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {recordingState === 'processing' && (
          <View className="mx-5 mb-3 bg-surface-800 rounded-2xl px-5 py-3 flex-row items-center">
            <Ionicons name="cloud-upload-outline" size={18} color="#6366F1" />
            <Text className="text-slate-400 text-sm ml-3">Saving voice note...</Text>
          </View>
        )}

        {/* Input bar */}
        {recordingState === 'idle' && (
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
                onPress={startRecording}
                className="ml-2 w-9 h-9 rounded-full items-center justify-center bg-surface-600"
              >
                <Ionicons name="mic-outline" size={18} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdd}
                disabled={!text.trim() || saving}
                className={`ml-2 w-9 h-9 rounded-full items-center justify-center ${text.trim() ? 'bg-primary-500' : 'bg-surface-600'}`}
              >
                <Ionicons name="send" size={16} color={text.trim() ? '#fff' : '#64748B'} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}