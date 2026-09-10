import { supabase } from '@/integrations/supabase/client';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    connection: boolean;
    auth: boolean;
    database: boolean;
  };
  latencyMs: number;
  error?: string;
}

/**
 * Performs a health check on Supabase connection
 * Use this before critical operations or on app startup
 */
export async function checkSupabaseHealth(): Promise<HealthCheckResult> {
  const startTime = performance.now();
  const result: HealthCheckResult = {
    status: 'unhealthy',
    timestamp: new Date().toISOString(),
    checks: {
      connection: false,
      auth: false,
      database: false,
    },
    latencyMs: 0,
  };

  try {
    // Check 1: Basic connection (auth service responds)
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    result.checks.auth = !sessionError;
    result.checks.connection = !sessionError;

    // Check 2: Database query (simple select)
    const { error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    result.checks.database = !dbError;

    // Determine overall status
    const allHealthy = Object.values(result.checks).every(Boolean);
    const someHealthy = Object.values(result.checks).some(Boolean);
    
    result.status = allHealthy ? 'healthy' : someHealthy ? 'degraded' : 'unhealthy';
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    result.status = 'unhealthy';
  }

  result.latencyMs = Math.round(performance.now() - startTime);
  return result;
}

/**
 * Backs up localStorage data before migration
 * Returns a JSON string that can be saved/restored
 */
export function backupLocalData(): string {
  const backup: Record<string, string | null> = {};
  const keysToBackup = [
    'ekana_user',
    'ekana_auth_version',
    'ekana-user-settings',
    'ekana-user-profile',
    'ekana-roadmaps',
    'ekana-teams',
    'ekana-team-members',
    'ekana-team-goals',
    'ekana-progress',
    'ekana-messages',
    'ekana-notifications',
    'ekana-requests',
    'ekana-point-events',
    'ekana-badge-events',
  ];

  keysToBackup.forEach(key => {
    backup[key] = localStorage.getItem(key);
  });

  // Also backup any celebration flags
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('ekana_celebrated_')) {
      backup[key] = localStorage.getItem(key);
    }
  }

  return JSON.stringify({
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: backup,
  }, null, 2);
}

/**
 * Restores localStorage data from backup
 */
export function restoreLocalData(backupJson: string): boolean {
  try {
    const backup = JSON.parse(backupJson);
    if (!backup.data || typeof backup.data !== 'object') {
      console.error('Invalid backup format');
      return false;
    }

    Object.entries(backup.data).forEach(([key, value]) => {
      if (value !== null) {
        localStorage.setItem(key, value as string);
      }
    });

    console.log(`✅ Restored ${Object.keys(backup.data).length} localStorage entries from backup (${backup.timestamp})`);
    return true;
  } catch (error) {
    console.error('Failed to restore backup:', error);
    return false;
  }
}

/**
 * Logs health check result to console with formatting
 */
export function logHealthCheck(result: HealthCheckResult): void {
  const statusEmoji = {
    healthy: '✅',
    degraded: '⚠️',
    unhealthy: '❌',
  };

  console.group(`${statusEmoji[result.status]} Supabase Health Check`);
  console.log(`Status: ${result.status.toUpperCase()}`);
  console.log(`Latency: ${result.latencyMs}ms`);
  console.log(`Timestamp: ${result.timestamp}`);
  console.table(result.checks);
  if (result.error) {
    console.error('Error:', result.error);
  }
  console.groupEnd();
}
