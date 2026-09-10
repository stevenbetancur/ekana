import { randomUUID } from 'node:crypto';
import { profiles, roadmaps, subunits, teams, units, users } from '../../src/db/schema/index.js';
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

export async function createRoadmap(ownerId: string, overrides: Partial<typeof roadmaps.$inferInsert> = {}) {
  const id = overrides.id ?? randomUUID();
  await testDb.insert(roadmaps).values({ title: 'Roadmap Test', ownerType: 'USER', ...overrides, id, ownerId });
  return { id };
}

export async function createUnitWithSubunit(roadmapId: string) {
  const unitId = randomUUID();
  const subunitId = randomUUID();
  await testDb.insert(units).values({ id: unitId, roadmapId, title: 'Unidad 1', sequenceOrder: 1 });
  await testDb.insert(subunits).values({ id: subunitId, unitId, title: 'Lección 1', type: 'video', sequenceOrder: 1 });
  return { unitId, subunitId };
}
