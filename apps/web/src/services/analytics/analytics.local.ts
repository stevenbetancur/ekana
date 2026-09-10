import { AnalyticsEvent, TrackEventParams } from './types';

const STORAGE_KEY = 'ekana-analytics-events';
const MAX_LOCAL_EVENTS = 100; // Limit local storage

function getStoredEvents(): AnalyticsEvent[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveEvents(events: AnalyticsEvent[]): void {
  // Keep only the most recent events
  const trimmed = events.slice(-MAX_LOCAL_EVENTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export async function trackEvent(
  userId: string | null,
  params: TrackEventParams
): Promise<AnalyticsEvent | null> {
  const event: AnalyticsEvent = {
    id: crypto.randomUUID(),
    userId,
    teamId: params.teamId || null,
    eventType: params.eventType,
    entityType: params.entityType || null,
    entityId: params.entityId || null,
    metadata: params.metadata || {},
    createdAt: new Date().toISOString(),
  };

  const events = getStoredEvents();
  events.push(event);
  saveEvents(events);

  console.log(`📊 [Analytics] ${params.eventType}`, {
    userId,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: params.metadata,
  });

  return event;
}

export async function getEvents(
  userId?: string,
  eventType?: string,
  limit = 50
): Promise<AnalyticsEvent[]> {
  let events = getStoredEvents();

  if (userId) {
    events = events.filter(e => e.userId === userId);
  }

  if (eventType) {
    events = events.filter(e => e.eventType === eventType);
  }

  return events.slice(-limit).reverse();
}

export async function clearEvents(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
}
