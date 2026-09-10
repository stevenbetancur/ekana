/**
 * Health Service
 *
 * Low-level health check functions for individual system components.
 * Follows the same pattern as userProfile.supabase.ts
 */

import { supabase } from '@/integrations/supabase/client';
import { api } from '@/lib/api';
import { safeAsyncCheck, getClientTimestamp } from '@/utils/health.utils';

export type HealthStatus = 'ok' | 'error';

export interface HealthCheckResult {
  db: HealthStatus;
  auth: HealthStatus;
  clientTime: string;
}

/**
 * Checks database connectivity through the Ekana API (/api/health/db).
 * Never throws - returns 'ok' or 'error'.
 */
export async function checkDb(): Promise<HealthStatus> {
  return safeAsyncCheck(async () => {
    await api.get('/health/db');
  });
}

/**
 * Checks auth service by attempting to get current session.
 * Never throws - returns 'ok' or 'error'.
 */
export async function checkAuth(): Promise<HealthStatus> {
  return safeAsyncCheck(async () => {
    const { error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }
  });
}

/**
 * Runs all health checks in parallel and returns combined results.
 * Never throws - individual check failures are captured in the result.
 */
export async function checkAll(): Promise<HealthCheckResult> {
  const [db, auth] = await Promise.all([checkDb(), checkAuth()]);

  return {
    db,
    auth,
    clientTime: getClientTimestamp(),
  };
}

/**
 * Service object for consistent export pattern with other services.
 */
export const systemHealthService = {
  checkDb,
  checkAuth,
  checkAll,
};








