import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  uptimeSeconds: z.number(),
  timestamp: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const dbHealthResponseSchema = z.object({
  status: z.literal('ok'),
  latencyMs: z.number(),
});
export type DbHealthResponse = z.infer<typeof dbHealthResponseSchema>;
