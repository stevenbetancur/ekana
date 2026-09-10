import { localRoadmapService } from './roadmaps.local';
import { supabaseRoadmapService } from './roadmaps.supabase';
import { RoadmapService } from './types';

const dataMode = import.meta.env.VITE_DATA_MODE || 'supabase';

/**
 * Roadmap Service Router
 * 
 * Routes to the appropriate implementation based on VITE_DATA_MODE:
 * - 'supabase': Uses Supabase backend
 * - 'local' (default): Uses localStorage with mock data fallback
 */
export const roadmapService: RoadmapService =
  dataMode === 'supabase' ? supabaseRoadmapService : localRoadmapService;

export * from './types';

