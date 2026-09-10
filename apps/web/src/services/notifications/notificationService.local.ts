import { Notification, mockNotifications } from '@/lib/mockData';
import { FetchResult, NotificationService } from './types';

const STORAGE_KEY = 'ekana-notifications';
const STORAGE_VERSION = '1.0';

interface StorageEnvelope {
  version: string;
  lastUpdated: string;
  data: Notification[];
}

const loadNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const envelope: StorageEnvelope = JSON.parse(stored);
      if (envelope.version === STORAGE_VERSION) {
        return envelope.data;
      }
    }
  } catch (error) {
    console.warn('Failed to load notifications from localStorage:', error);
  }
  // Seed from mock data
  saveNotifications(mockNotifications);
  return mockNotifications;
};

const saveNotifications = (notifications: Notification[]): void => {
  try {
    const envelope: StorageEnvelope = {
      version: STORAGE_VERSION,
      lastUpdated: new Date().toISOString(),
      data: notifications,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch (error) {
    console.error('Failed to save notifications to localStorage:', error);
  }
};

export const localNotificationService: NotificationService = {
  fetch: async (userId: string, offset: number, limit: number): Promise<FetchResult> => {
    const all = loadNotifications();
    const userNotifications = all
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const paginated = userNotifications.slice(offset, offset + limit);
    const hasMore = offset + limit < userNotifications.length;
    
    return Promise.resolve({ notifications: paginated, hasMore });
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    const all = loadNotifications();
    const updated = all.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    saveNotifications(updated);
    return Promise.resolve();
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    const all = loadNotifications();
    const updated = all.map((n) =>
      n.userId === userId ? { ...n, read: true } : n
    );
    saveNotifications(updated);
    return Promise.resolve();
  },

  create: async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> => {
    const all = loadNotifications();
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newNotification, ...all];
    saveNotifications(updated);
    return Promise.resolve(newNotification);
  },

  delete: async (notificationId: string): Promise<void> => {
    const all = loadNotifications();
    const updated = all.filter((n) => n.id !== notificationId);
    saveNotifications(updated);
    return Promise.resolve();
  },
};
