import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { getCalendarEvents, findCurrentEvent, CalendarEvent } from '../lib/calendar';
import Card from './ui/Card';

interface Props {
  visible: boolean;
  onSelect: (event: CalendarEvent | null) => void;
  onDismiss: () => void;
}

export default function EventPicker({ visible, onSelect, onDismiss }: Props) {
  const [events,    setEvents]   = useState<CalendarEvent[]>([]);
  const [loading,   setLoading]  = useState(true);
  const [suggested, setSuggested] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getCalendarEvents()
      .then((evts) => {
        setEvents(evts);
        setSuggested(findCurrentEvent(evts));
      })
      .finally(() => setLoading(false));
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface-800 rounded-t-3xl max-h-[70%]">
          {/* Header */}
          <View className="flex-row items-center px-5 py-4 border-b border-surface-700">
            <Text className="text-slate-50 text-lg font-bold flex-1">Where did you meet?</Text>
            <TouchableOpacity onPress={onDismiss}>
              <Ionicons name="close" size={22} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#6366F1" />
              <Text className="text-slate-400 text-sm mt-3">Loading calendar events...</Text>
            </View>
          ) : (
            <FlatList
              data={events}
              keyExtractor={(e) => e.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              ListHeaderComponent={
                <>
                  {/* AI suggestion */}
                  {suggested && (
                    <View className="mb-4">
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="flash" size={14} color="#FBBF24" />
                        <Text className="text-amber-400 text-xs font-semibold ml-1 uppercase tracking-wide">
                          AI Suggestion
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => { onSelect(suggested); onDismiss(); }}
                        className="bg-primary-900/60 border border-primary-700 rounded-2xl p-4"
                      >
                        <Text className="text-slate-50 text-base font-semibold">{suggested.title}</Text>
                        {suggested.location && (
                          <Text className="text-slate-400 text-sm mt-0.5">{suggested.location}</Text>
                        )}
                        <Text className="text-primary-400 text-xs mt-1">
                          You're likely here right now
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* No event option */}
                  <TouchableOpacity
                    onPress={() => { onSelect(null); onDismiss(); }}
                    className="flex-row items-center bg-surface-700 rounded-2xl px-4 py-3 mb-3"
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#64748B" />
                    <Text className="text-slate-400 text-sm ml-3">No event — skip</Text>
                  </TouchableOpacity>

                  {events.length > 0 && (
                    <Text className="text-slate-500 text-xs uppercase tracking-widest mb-2 px-1">
                      Nearby Events
                    </Text>
                  )}
                </>
              }
              ListEmptyComponent={
                <View className="items-center py-8">
                  <Ionicons name="calendar-outline" size={40} color="#334155" />
                  <Text className="text-slate-500 text-sm mt-3 text-center">
                    No calendar events found in the last 48 hours.
                  </Text>
                </View>
              }
              renderItem={({ item }) =>
                item.id === suggested?.id ? null : (
                  <TouchableOpacity
                    onPress={() => { onSelect(item); onDismiss(); }}
                    className="flex-row items-center bg-surface-700 rounded-2xl px-4 py-3 mb-2"
                  >
                    <Ionicons name="calendar-outline" size={18} color="#6366F1" />
                    <View className="flex-1 ml-3">
                      <Text className="text-slate-200 text-sm font-medium">{item.title}</Text>
                      <Text className="text-slate-500 text-xs mt-0.5">
                        {format(item.startDate, 'EEE, MMM d · h:mm a')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
