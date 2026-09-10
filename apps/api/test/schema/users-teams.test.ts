import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { profiles, teamMembers, teams, users } from '../../src/db/schema/index.js';
import { closeTestDb, ER_DATA_TRUNCATED, ER_DUP_ENTRY, expectDbError, resetDb, testDb, testPool } from '../helpers/db.js';
import { createTeam, createUser } from '../helpers/factories.js';

beforeEach(resetDb);
afterAll(closeTestDb);

describe('users y profiles', () => {
  it('el email es único sin distinguir mayúsculas', async () => {
    await createUser({ email: 'Ana@Ekana.com' });
    await expectDbError(createUser({ email: 'ana@ekana.com' }), ER_DUP_ENTRY);
  });

  it('borrar un usuario borra su perfil y sus membresías', async () => {
    const user = await createUser();
    const team = await createTeam();
    await testDb.insert(teamMembers).values({ teamId: team.id, userId: user.id, role: 'admin' });

    await testDb.delete(users).where(eq(users.id, user.id));

    expect(await testDb.select().from(profiles).where(eq(profiles.id, user.id))).toHaveLength(0);
    expect(await testDb.select().from(teamMembers).where(eq(teamMembers.userId, user.id))).toHaveLength(0);
  });

  it('los JSON del perfil tienen valor por defecto {}', async () => {
    const user = await createUser();
    const [profile] = await testDb.select().from(profiles).where(eq(profiles.id, user.id));
    expect(profile?.preferences).toEqual({});
    expect(profile?.isPremium).toBe(false);
  });
});

describe('teams y team_members', () => {
  it('un usuario no puede estar dos veces en el mismo equipo', async () => {
    const user = await createUser();
    const team = await createTeam();
    await testDb.insert(teamMembers).values({ teamId: team.id, userId: user.id });
    await expectDbError(testDb.insert(teamMembers).values({ teamId: team.id, userId: user.id }), ER_DUP_ENTRY);
  });

  it('el rol por defecto es member y un rol inválido se rechaza (modo estricto)', async () => {
    const user = await createUser();
    const team = await createTeam();
    await testDb.insert(teamMembers).values({ teamId: team.id, userId: user.id });
    const [member] = await testDb.select().from(teamMembers).where(eq(teamMembers.teamId, team.id));
    expect(member?.role).toBe('member');

    const other = await createUser();
    await expectDbError(
      testPool.query('INSERT INTO team_members (team_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW(3))', [
        team.id,
        other.id,
        'owner',
      ]),
      ER_DATA_TRUNCATED,
    );
  });

  it('updatedAt cambia al actualizar con Drizzle', async () => {
    const team = await createTeam();
    const [before] = await testDb.select().from(teams).where(eq(teams.id, team.id));
    await new Promise((resolve) => setTimeout(resolve, 20));
    await testDb.update(teams).set({ name: 'Renombrado' }).where(eq(teams.id, team.id));
    const [after] = await testDb.select().from(teams).where(eq(teams.id, team.id));
    expect(after!.updatedAt.getTime()).toBeGreaterThan(before!.updatedAt.getTime());
  });
});
