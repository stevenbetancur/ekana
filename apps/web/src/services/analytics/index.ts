import * as local from './analytics.local';
import * as supabaseService from './analytics.supabase';

const DATA_MODE = import.meta.env.VITE_DATA_MODE || 'local';

const service = DATA_MODE === 'supabase' ? supabaseService : local;

export const analyticsService = {
  trackEvent: service.trackEvent,
  getEvents: service.getEvents,
  clearEvents: service.clearEvents,
};

// Re-export types
export type { AnalyticsEvent, AnalyticsEventType, EntityType, TrackEventParams } from './types';
