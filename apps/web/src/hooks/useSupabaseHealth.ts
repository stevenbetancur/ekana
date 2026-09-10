import { useState, useEffect, useCallback } from 'react';
import { checkSupabaseHealth, HealthCheckResult, logHealthCheck } from '@/lib/supabaseHealth';

interface UseSupabaseHealthOptions {
  autoCheck?: boolean;
  intervalMs?: number;
  logResults?: boolean;
}

export function useSupabaseHealth(options: UseSupabaseHealthOptions = {}) {
  const { autoCheck = false, intervalMs = 60000, logResults = false } = options;
  
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const check = useCallback(async () => {
    setIsChecking(true);
    try {
      const result = await checkSupabaseHealth();
      setHealth(result);
      if (logResults) {
        logHealthCheck(result);
      }
      return result;
    } finally {
      setIsChecking(false);
    }
  }, [logResults]);

  useEffect(() => {
    if (autoCheck) {
      check();
      
      const interval = setInterval(check, intervalMs);
      return () => clearInterval(interval);
    }
  }, [autoCheck, intervalMs, check]);

  return {
    health,
    isChecking,
    check,
    isHealthy: health?.status === 'healthy',
    isDegraded: health?.status === 'degraded',
    isUnhealthy: health?.status === 'unhealthy',
  };
}
