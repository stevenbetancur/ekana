import { randomUUID } from 'node:crypto';
import { profiles, teams, users } from '../../src/db/schema/index.js';
import { testDb } from './db.js';

export async function createUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const id = overrides.id ?? randomUUID();
  const email = overrides.email ?? `${id}@test.local`;
  await testDb.insert(users).values({ name: 'Usuario Test', ...overrides, id, email });
  await testDb.insert(profiles).values({ id });
  return { id, email };
}

export async function createTeam(overrides: Partial<typeof teams.$inferInsert> = {}) {
  const id = overrides.id ?? randomUUID();
  await testDb.insert(teams).values({ name: 'Equipo Test', ...overrides, id });
  return { id };
}
