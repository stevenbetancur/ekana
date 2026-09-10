/**
 * System Health Composer
 *
 * Composes data from health.service.ts into a unified system status object.
 * This is the top-level API for system health checks.
 */

import { systemHealthService, HealthStatus } from './health.service';

export type SystemStatus = 'ok' | 'degraded';

export interface SystemHealthResult {
  status: SystemStatus;
  db: HealthStatus;
  auth: HealthStatus;
  timestamp: string;
}

/**
 * Determines overall system status based on individual check results.
 */
function computeStatus(db: HealthStatus, auth: HealthStatus): SystemStatus {
  return db === 'ok' && auth === 'ok' ? 'ok' : 'degraded';
}

/**
 * Returns a unified system health status.
 * Never throws - failures are reflected in the status field.
 */
export async function getSystemHealth(): Promise<SystemHealthResult> {
  const { db, auth, clientTime } = await systemHealthService.checkAll();

  return {
    status: computeStatus(db, auth),
    db,
    auth,
    timestamp: clientTime,
  };
}

/**
 * Re-export service for direct access if needed.
 */
export { systemHealthService } from './health.service';








