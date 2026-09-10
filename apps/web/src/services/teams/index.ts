import { localTeamService } from './teams.local';
import { supabaseTeamService } from './teams.supabase';
import { TeamService } from './types';

const dataMode = import.meta.env.VITE_DATA_MODE || 'supabase';

/**
 * Team Service Router
 * 
 * Routes to the appropriate implementation based on VITE_DATA_MODE:
 * - 'supabase': Uses Supabase backend
 * - 'local' (default): Uses localStorage with mock data fallback
 */
export const teamService: TeamService =
  dataMode === 'supabase' ? supabaseTeamService : localTeamService;

export * from './types';








