import type { Db } from '../../db/client.js';
import { profiles } from '../../db/schema/index.js';

// Idempotente: el hook de registro lo llama y GET /me lo vuelve a asegurar por si el hook falló.
export async function ensureProfile(db: Db, userId: string): Promise<void> {
  await db.insert(profiles).ignore().values({ id: userId });
}
