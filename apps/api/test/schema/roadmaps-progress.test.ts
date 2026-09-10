import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { activations, progressTracking, roadmaps, subunits, teams, units, userEntitlements } from '../../src/db/schema/index.js';
import { closeTestDb, ER_DUP_ENTRY, expectDbError, resetDb, testDb } from '../helpers/db.js';
import { createRoadmap, createTeam, createUnitWithSubunit, createUser } from '../helpers/factories.js';

beforeEach(resetDb);
afterAll(closeTestDb);

describe('activations', () => {
  it('no permite activar dos veces el mismo roadmap personal', async () => {
    const user = await createUser();
    const roadmap = await createRoadmap(user.id);
    await testDb.insert(activations).values({ userId: user.id, roadmapId: roadmap.id });
    await expectDbError(testDb.insert(activations).values({ userId: user.id, roadmapId: roadmap.id }), ER_DUP_ENTRY);
  });

  it('permite el mismo roadmap en modo personal y en equipos distintos', async () => {
    const user = await createUser();
    const roadmap = await createRoadmap(user.id);
    const teamA = await createTeam();
    const teamB = await createTeam();
    await testDb.insert(activations).values([
      { userId: user.id, roadmapId: roadmap.id },
      { userId: user.id, roadmapId: roadmap.id, teamId: teamA.id },
      { userId: user.id, roadmapId: roadmap.id, teamId: teamB.id },
    ]);
    expect(await testDb.select().from(activations).where(eq(activations.userId, user.id))).toHaveLength(3);
  });

  it('borrar un equipo borra sus activaciones y su progreso, pero no las personales', async () => {
    const user = await createUser();
    const roadmap = await createRoadmap(user.id);
    const { subunitId } = await createUnitWithSubunit(roadmap.id);
    const team = await createTeam();
    const [personalId, teamActivationId] = [crypto.randomUUID(), crypto.randomUUID()];
    await testDb.insert(activations).values([
      { id: personalId, userId: user.id, roadmapId: roadmap.id },
      { id: teamActivationId, userId: user.id, roadmapId: roadmap.id, teamId: team.id },
    ]);
    await testDb.insert(progressTracking).values({ userId: user.id, subunitId, activationId: teamActivationId });

    await testDb.delete(teams).where(eq(teams.id, team.id));

    const remaining = await testDb.select().from(activations);
    expect(remaining.map((a) => a.id)).toEqual([personalId]);
    expect(await testDb.select().from(progressTracking)).toHaveLength(0);
  });
});

describe('progress_tracking', () => {
  it('no permite completar dos veces la misma subunidad en la misma activación', async () => {
    const user = await createUser();
    const roadmap = await createRoadmap(user.id);
    const { subunitId } = await createUnitWithSubunit(roadmap.id);
    const activationId = crypto.randomUUID();
    await testDb.insert(activations).values({ id: activationId, userId: user.id, roadmapId: roadmap.id });
    await testDb.insert(progressTracking).values({ userId: user.id, subunitId, activationId });
    await expectDbError(testDb.insert(progressTracking).values({ userId: user.id, subunitId, activationId }), ER_DUP_ENTRY);
  });
});

describe('roadmaps', () => {
  it('borrar un roadmap borra sus unidades y subunidades', async () => {
    const user = await createUser();
    const roadmap = await createRoadmap(user.id);
    await createUnitWithSubunit(roadmap.id);
    await testDb.delete(roadmaps).where(eq(roadmaps.id, roadmap.id));
    expect(await testDb.select().from(units)).toHaveLength(0);
    expect(await testDb.select().from(subunits)).toHaveLength(0);
  });

  it('un usuario tiene como máximo un entitlement por roadmap', async () => {
    const user = await createUser();
    const roadmap = await createRoadmap(user.id);
    await testDb.insert(userEntitlements).values({ userId: user.id, roadmapId: roadmap.id, accessType: 'full' });
    await expectDbError(
      testDb.insert(userEntitlements).values({ userId: user.id, roadmapId: roadmap.id, accessType: 'trial' }),
      ER_DUP_ENTRY,
    );
  });
});
