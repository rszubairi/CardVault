import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export interface CalendarEvent {
  id: string;
  title: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  calendarId: string;
  calendarSource?: string;
}

export async function requestCalendarPermission(): Promise<boolean> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  return status === 'granted';
}

export async function getCalendarEvents(
  windowMs = 48 * 60 * 60 * 1000,
): Promise<CalendarEvent[]> {
  const granted = await requestCalendarPermission();
  if (!granted) return [];

  try {
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const calendarIds = calendars.map((c) => c.id);

    if (calendarIds.length === 0) return [];

    const now   = new Date();
    const start = new Date(now.getTime() - windowMs);
    const end   = new Date(now.getTime() + windowMs);

    const events = await Calendar.getEventsAsync(calendarIds, start, end);

    return events
      .filter((e) => e.title && e.startDate)
      .map((e) => ({
        id:             e.id,
        title:          e.title,
        location:       e.location ?? undefined,
        startDate:      new Date(e.startDate),
        endDate:        e.endDate ? new Date(e.endDate) : undefined,
        calendarId:     e.calendarId,
        calendarSource: calendars.find((c) => c.id === e.calendarId)?.title,
      }));
  } catch {
    return [];
  }
}

export function findCurrentEvent(events: CalendarEvent[]): CalendarEvent | null {
  const now = Date.now();
  return (
    events.find((e) => {
      const start = e.startDate.getTime();
      const end   = e.endDate?.getTime() ?? start + 2 * 60 * 60 * 1000;
      return now >= start - 30 * 60 * 1000 && now <= end + 30 * 60 * 1000;
    }) ?? null
  );
}
