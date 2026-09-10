import * as local from './userProfile.local';
import * as supabase from './userProfile.supabase';

const DATA_MODE = import.meta.env.VITE_DATA_MODE || 'supabase';

console.log('🔧 [Service] DATA_MODE:', DATA_MODE);
export const userProfileService = DATA_MODE === 'supabase' ? supabase : local;

// Re-export types
export type { UserProfile } from './types';
export { defaultProfile } from './types';
