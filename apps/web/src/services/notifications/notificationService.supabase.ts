import { supabase } from '@/integrations/supabase/client';
import { mapNotification } from '@/lib/supabase-mapper';
import { Notification } from '@/lib/mockData';
import { FetchResult, NotificationService } from './types';

/**
 * Supabase implementation of NotificationService.
 * 
 * Uses the notifications table with proper enum types for:
 * - notification_type: TEAM_INVITE, NEW_MESSAGE, GOAL_COMPLETED, BADGE_EARNED, POINTS_EARNED, etc.
 * - notification_level: info, success, warning, error
 */
export const supabaseNotificationService: NotificationService = {
  /**
   * Fetch paginated notifications for a user.
   */
  async fetch(userId: string, offset: number, limit: number): Promise<FetchResult> {
    console.log('🔍 [NotificationService] Fetching notifications:', { userId, offset, limit });

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('❌ [NotificationService] Failed to fetch notifications:', error);
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    const notifications = (data || []).map((row) => mapNotification(row as Record<string, unknown>));
    const hasMore = count ? offset + limit < count : false;

    console.log('✅ [NotificationService] Fetched notifications:', notifications.length, 'hasMore:', hasMore);
    return { notifications, hasMore };
  },

  /**
   * Mark a notification as read.
   */
  async markAsRead(notificationId: string): Promise<void> {
    console.log('📖 [NotificationService] Marking as read:', notificationId);

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('❌ [NotificationService] Failed to mark as read:', error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    console.log('✅ [NotificationService] Marked as read');
  },

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId: string): Promise<void> {
    console.log('📖 [NotificationService] Marking all as read for user:', userId);

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('❌ [NotificationService] Failed to mark all as read:', error);
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }

    console.log('✅ [NotificationService] All notifications marked as read');
  },

  /**
   * Create a new notification.
   */
  async create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    console.log('📤 [NotificationService] Creating notification:', notification.type);

    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        level: notification.level,
        title: notification.title,
        message: notification.message,
        read: notification.read || false,
        link: notification.link || null,
        metadata: notification.metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [NotificationService] Failed to create notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    console.log('✅ [NotificationService] Notification created:', data.id);
    return mapNotification(data as Record<string, unknown>);
  },

  /**
   * Delete a notification.
   */
  async delete(notificationId: string): Promise<void> {
    console.log('🗑️ [NotificationService] Deleting notification:', notificationId);

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('❌ [NotificationService] Failed to delete notification:', error);
      throw new Error(`Failed to delete notification: ${error.message}`);
    }

    console.log('✅ [NotificationService] Notification deleted');
  },
};

/**
 * Subscribe to real-time notification updates for a user.
 * Can be used separately from the service for real-time features.
 */
export const subscribeToNotifications = (
  userId: string,
  onNotification: (notification: Notification) => void
): (() => void) => {
  console.log('🔔 [NotificationService] Subscribing to notifications:', userId);

  const channel = supabase
    .channel(`user-notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('📨 [NotificationService] New notification received:', payload.new);
        const notification = mapNotification(payload.new as Record<string, unknown>);
        onNotification(notification);
      }
    )
    .subscribe();

  return () => {
    console.log('🔕 [NotificationService] Unsubscribing from notifications:', userId);
    supabase.removeChannel(channel);
  };
};
