import { supabase } from '@/integrations/supabase/client';
import { AnalyticsEvent, TrackEventParams } from './types';

export async function trackEvent(
  userId: string | null,
  params: TrackEventParams
): Promise<AnalyticsEvent | null> {
  try {
    // analytics_events table is newly created, use RPC or direct SQL
    // For now, use type casting since types may not be regenerated yet
    const { data, error } = await (supabase as any)
      .from('analytics_events')
      .insert({
        user_id: userId,
        team_id: params.teamId || null,
        event_type: params.eventType,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
        metadata: params.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to track analytics event:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      teamId: data.team_id,
      eventType: data.event_type,
      entityType: data.entity_type,
      entityId: data.entity_id,
      metadata: data.metadata || {},
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return null;
  }
}

export async function getEvents(
  userId?: string,
  eventType?: string,
  limit = 50
): Promise<AnalyticsEvent[]> {
  try {
    let query = (supabase as any)
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch analytics events:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      teamId: row.team_id,
      eventType: row.event_type,
      entityType: row.entity_type,
      entityId: row.entity_id,
      metadata: row.metadata || {},
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return [];
  }
}

export async function clearEvents(): Promise<void> {
  // No-op for Supabase - events are retained
  console.warn('clearEvents is not supported for Supabase analytics');
}
