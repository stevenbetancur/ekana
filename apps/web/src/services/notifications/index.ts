import { localNotificationService } from './notificationService.local';
import { supabaseNotificationService, subscribeToNotifications } from './notificationService.supabase';
import { NotificationService } from './types';

const dataMode = import.meta.env.VITE_DATA_MODE || 'local';

export const notificationService: NotificationService =
  dataMode === 'supabase' ? supabaseNotificationService : localNotificationService;

// Re-export for real-time subscription (Supabase mode only)
export { subscribeToNotifications };

export * from './types';
export * from './notificationFactory';
