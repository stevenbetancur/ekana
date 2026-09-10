export const USER_ROLES = ['admin', 'member'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const NOTIFICATION_TYPES = [
  'TEAM_INVITE',
  'NEW_MESSAGE',
  'GOAL_COMPLETED',
  'BADGE_EARNED',
  'POINTS_EARNED',
  'HANDLER_TRIGGERED',
  'BEST_RESPONSE',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_LEVELS = ['info', 'success', 'warning', 'error'] as const;
export type NotificationLevel = (typeof NOTIFICATION_LEVELS)[number];

export const ROADMAP_OWNER_TYPES = ['USER', 'TEAM', 'THIRD_PARTY'] as const;
export type RoadmapOwnerType = (typeof ROADMAP_OWNER_TYPES)[number];

export const REQUEST_TYPES = ['CREATE_TEAM', 'INVITE_TO_TEAM', 'REQUEST_TO_JOIN'] as const;
export type RequestType = (typeof REQUEST_TYPES)[number];

export const REQUEST_STATUSES = ['pending', 'accepted', 'rejected', 'expired'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
