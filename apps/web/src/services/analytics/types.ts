export type AnalyticsEventType =
  | 'signup'
  | 'login'
  | 'logout'
  | 'profile_updated'
  | 'roadmap_started'
  | 'roadmap_completed'
  | 'subunit_completed'
  | 'message_sent'
  | 'thread_created'
  | 'team_joined'
  | 'team_created'
  | 'team_left'
  | 'request_sent'
  | 'request_accepted'
  | 'request_declined'
  | 'goal_created'
  | 'goal_completed'
  | 'badge_earned'
  | 'points_earned'
  | 'page_view';

export type EntityType =
  | 'user'
  | 'team'
  | 'roadmap'
  | 'unit'
  | 'subunit'
  | 'message'
  | 'request'
  | 'goal'
  | 'badge';

export interface AnalyticsEvent {
  id: string;
  userId: string | null;
  teamId: string | null;
  eventType: AnalyticsEventType;
  entityType: EntityType | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface TrackEventParams {
  eventType: AnalyticsEventType;
  teamId?: string;
  entityType?: EntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
}
