import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Notification } from '@/lib/mockData';
import { notificationService, subscribeToNotifications } from '@/services/notifications';
import { useAuth } from './AuthContext';

const dataMode = import.meta.env.VITE_DATA_MODE || 'local';
const POLL_INTERVAL = 30000; // 30 seconds (used for local mode only)
const PAGE_SIZE = 20;
const MAX_NOTIFICATIONS = 200; // Memory safety cap

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<Notification>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);

  // Derived state
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Merge, deduplicate, sort, and cap notifications
  const mergeNotifications = useCallback((newNotifs: Notification[], existing: Notification[]): Notification[] => {
    const combined = [...newNotifs, ...existing];
    const unique = new Map(combined.map((n) => [n.id, n]));
    const sorted = Array.from(unique.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sorted.slice(0, MAX_NOTIFICATIONS);
  }, []);

  // Initial fetch
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const result = await notificationService.fetch(user.id, 0, PAGE_SIZE);
      setNotifications(mergeNotifications(result.notifications, []));
      setHasMore(result.hasMore);
      setOffset(PAGE_SIZE);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, mergeNotifications]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (!user?.id || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await notificationService.fetch(user.id, offset, PAGE_SIZE);
      setNotifications((prev) => mergeNotifications(result.notifications, prev));
      setHasMore(result.hasMore);
      setOffset((prev) => prev + PAGE_SIZE);
    } catch (error) {
      console.error('Failed to load more notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, offset, isLoading, hasMore, mergeNotifications]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [user?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.delete(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  // Create notification
  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotif = await notificationService.create(notification);
    setNotifications((prev) => mergeNotifications([newNotif], prev));
    return newNotif;
  }, [mergeNotifications]);

  // Initial fetch when user changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time updates: Use subscriptions for Supabase, polling for local
  useEffect(() => {
    if (!user?.id) return;

    // Supabase mode: Use real-time subscriptions
    if (dataMode === 'supabase') {
      console.log('🔔 [NotificationContext] Using real-time subscriptions');
      const unsubscribe = subscribeToNotifications(user.id, (notification) => {
        setNotifications((prev) => mergeNotifications([notification], prev));
      });

      return () => {
        unsubscribe();
      };
    }

    // Local mode: Use smart polling with tab visibility check
    const poll = async () => {
      // Skip polling if tab is hidden
      if (document.hidden) return;

      try {
        const result = await notificationService.fetch(user.id, 0, PAGE_SIZE);
        setNotifications((prev) => mergeNotifications(result.notifications, prev));
      } catch (error) {
        console.error('Polling failed:', error);
      }
    };

    const intervalId = setInterval(poll, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [user?.id, mergeNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        hasMore,
        isLoading,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        createNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
