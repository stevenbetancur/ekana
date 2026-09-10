/**
 * Health Service Index
 *
 * Public API for the health service module.
 * Follows the same export pattern as userProfile/index.ts
 */

// Main composer function (primary API)
export { getSystemHealth } from './systemHealth';

// Service for granular access
export { systemHealthService } from './health.service';

// Types
export type { SystemHealthResult, SystemStatus } from './systemHealth';
export type { HealthCheckResult, HealthStatus } from './health.service';








