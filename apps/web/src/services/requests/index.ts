import { localRequestService } from './requests.local';
import { supabaseRequestService } from './requests.supabase';
import { RequestService } from './types';

const dataMode = import.meta.env.VITE_DATA_MODE || 'local';

/**
 * Request Service Router
 * 
 * Routes to the appropriate implementation based on VITE_DATA_MODE:
 * - 'supabase': Uses Supabase backend with real-time subscriptions
 * - 'local' (default): Uses localStorage with mock data fallback
 */
export const requestService: RequestService =
  dataMode === 'supabase' ? supabaseRequestService : localRequestService;

export * from './types';




