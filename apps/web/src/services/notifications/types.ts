import { Notification } from '@/lib/mockData';

export interface FetchResult {
  notifications: Notification[];
  hasMore: boolean;
}

export interface NotificationService {
  fetch: (userId: string, offset: number, limit: number) => Promise<FetchResult>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  create: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<Notification>;
  delete: (notificationId: string) => Promise<void>;
}
