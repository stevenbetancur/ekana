import { localChatService } from './chat.local';
import { supabaseChatService } from './chat.supabase';
import { ChatService } from './types';

const dataMode = import.meta.env.VITE_DATA_MODE || 'local';

/**
 * Chat Service Router
 * 
 * Routes to the appropriate implementation based on VITE_DATA_MODE:
 * - 'supabase': Uses Supabase backend with real-time subscriptions
 * - 'local' (default): Uses localStorage with mock data fallback
 */
export const chatService: ChatService =
  dataMode === 'supabase' ? supabaseChatService : localChatService;

export * from './types';




