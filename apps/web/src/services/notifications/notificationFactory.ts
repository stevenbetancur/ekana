import { Notification, NotificationLevel, NotificationType } from '@/lib/mockData';

type NotificationPayload = Omit<Notification, 'id' | 'createdAt'>;

export const notificationFactory = {
  pointsEarned: (
    userId: string,
    points: number,
    reason: string,
    teamId?: string
  ): NotificationPayload => ({
    userId,
    type: 'POINTS_EARNED' as NotificationType,
    level: 'success' as NotificationLevel,
    title: 'Points Earned!',
    message: `You earned ${points} points for ${reason}`,
    read: false,
    metadata: {
      points,
      teamId,
    },
  }),

  teamInvite: (
    userId: string,
    senderName: string,
    teamName: string,
    teamId: string,
    senderId: string
  ): NotificationPayload => ({
    userId,
    type: 'TEAM_INVITE' as NotificationType,
    level: 'info' as NotificationLevel,
    title: 'Team Invitation',
    message: `${senderName} invited you to join "${teamName}"`,
    read: false,
    link: '/inbox',
    metadata: {
      teamId,
      senderId,
    },
  }),

  badgeEarned: (
    userId: string,
    badgeName: string,
    badgeIcon: string = '🏆'
  ): NotificationPayload => ({
    userId,
    type: 'BADGE_EARNED' as NotificationType,
    level: 'success' as NotificationLevel,
    title: 'New Badge Unlocked!',
    message: `You earned the "${badgeName}" badge`,
    read: false,
    metadata: {
      badgeIcon,
    },
  }),

  goalCompleted: (
    userId: string,
    goalName: string,
    teamId?: string
  ): NotificationPayload => ({
    userId,
    type: 'GOAL_COMPLETED' as NotificationType,
    level: 'success' as NotificationLevel,
    title: 'Goal Completed!',
    message: `Congratulations! You completed "${goalName}"`,
    read: false,
    link: teamId ? `/team/${teamId}` : undefined,
    metadata: {
      teamId,
    },
  }),

  newMessage: (
    userId: string,
    senderName: string,
    preview: string,
    link: string,
    senderId: string
  ): NotificationPayload => ({
    userId,
    type: 'NEW_MESSAGE' as NotificationType,
    level: 'info' as NotificationLevel,
    title: 'New Message',
    message: `${senderName}: ${preview.substring(0, 50)}${preview.length > 50 ? '...' : ''}`,
    read: false,
    link,
    metadata: {
      senderId,
    },
  }),
};
