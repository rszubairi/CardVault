import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { format } from 'date-fns';
import Card from '../../../src/components/ui/Card';

export default function EventDetailScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const event   = useQuery(api.events.getById, { eventId: id as Id<'events'> });

  return (
    <SafeAreaView className="flex-1 bg-surface-900" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-5 py-4 border-b border-surface-800">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <Text className="text-slate-50 text-lg font-bold flex-1">
          {event?.title ?? 'Event'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {event && (
          <Card className="p-5">
            <Text className="text-slate-50 text-xl font-bold mb-4">{event.title}</Text>
            {event.location && (
              <View className="flex-row items-center mb-2">
                <Ionicons name="location-outline" size={16} color="#6366F1" />
                <Text className="text-slate-300 text-sm ml-2">{event.location}</Text>
              </View>
            )}
            <View className="flex-row items-center">
              <Ionicons name="calendar-outline" size={16} color="#6366F1" />
              <Text className="text-slate-300 text-sm ml-2">
                {format(new Date(event.date), 'PPP')}
              </Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
