import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import type { MeResponse, ProfileDto, ProfileUpdate } from '@ekana/shared';
import type { Db } from '../../db/client.js';
import { profiles, teamMembers, users } from '../../db/schema/index.js';
import { notFound } from '../../lib/errors.js';
import { formatBirthDate, toProfileDto } from './mapper.js';

const MAX_PROFILES = 500;

// Idempotente: el hook de registro lo llama y GET /me lo vuelve a asegurar por si el hook falló.
export async function ensureProfile(db: Db, userId: string): Promise<void> {
  await db.insert(profiles).ignore().values({ id: userId });
}

function selectProfiles(db: Db, where: SQL | undefined, limit: number) {
  return db
    .select({
      user: users,
      profile: profiles,
      hasActiveTeam: sql<number>`exists(select 1 from ${teamMembers} where ${teamMembers.userId} = ${users.id})`,
    })
    .from(users)
    .innerJoin(profiles, eq(profiles.id, users.id))
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limit);
}

export async function getMe(db: Db, userId: string): Promise<MeResponse> {
  await ensureProfile(db, userId);
  const [row] = await selectProfiles(db, eq(users.id, userId), 1);
  if (!row) throw notFound('Usuario no encontrado');
  const { user } = row;
  return {
    user: { id: user.id, email: user.email, name: user.name, image: user.image ?? null, emailVerified: user.emailVerified },
    profile: toProfileDto(user, row.profile, Boolean(Number(row.hasActiveTeam)), { includePrivate: true }),
  };
}

export async function listProfiles(db: Db, viewerId: string): Promise<ProfileDto[]> {
  const rows = await selectProfiles(db, eq(users.emailVerified, true), MAX_PROFILES);
  return rows.map((row) =>
    toProfileDto(row.user, row.profile, Boolean(Number(row.hasActiveTeam)), { includePrivate: row.user.id === viewerId }),
  );
}

export async function getProfile(db: Db, viewerId: string, id: string): Promise<ProfileDto> {
  const [row] = await selectProfiles(db, and(eq(users.id, id), eq(users.emailVerified, true)), 1);
  if (!row) throw notFound('Usuario no encontrado');
  return toProfileDto(row.user, row.profile, Boolean(Number(row.hasActiveTeam)), { includePrivate: id === viewerId });
}

function withDefined(base: Record<string, unknown>, updates: Record<string, unknown>): Record<string, unknown> {
  return { ...base, ...Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined)) };
}

export async function updateMyProfile(db: Db, userId: string, patch: ProfileUpdate): Promise<MeResponse> {
  await ensureProfile(db, userId);
  await db.transaction(async (tx) => {
    const [current] = await tx.select().from(profiles).where(eq(profiles.id, userId)).for('update');
    if (!current) throw notFound('Perfil no encontrado');

    const userChanges: Partial<typeof users.$inferInsert> = {};
    if (patch.name !== undefined) userChanges.name = patch.name;
    if (patch.avatar !== undefined) userChanges.image = patch.avatar === '' ? null : patch.avatar;
    if (Object.keys(userChanges).length > 0) await tx.update(users).set(userChanges).where(eq(users.id, userId));

    const profileChanges: Partial<typeof profiles.$inferInsert> = {
      onboardingData: withDefined(current.onboardingData, {
        subject: patch.subject,
        goal: patch.goal,
        level: patch.level,
        weeklyHours: patch.weeklyHours,
        communicationMethods: patch.communicationMethods,
      }),
      preferences: withDefined(current.preferences, {
        languages: patch.languages,
        interests: patch.interests,
        availability: patch.availability,
      }),
      schedule: patch.schedule ? { ...current.schedule, ...patch.schedule } : current.schedule,
    };
    if (patch.bio !== undefined) profileChanges.bio = patch.bio;
    if (patch.location !== undefined) profileChanges.location = patch.location;
    if (patch.birthDate !== undefined) profileChanges.birthDate = patch.birthDate ? formatBirthDate(patch.birthDate) : null;
    if (patch.activeCourse !== undefined) profileChanges.activeCourse = patch.activeCourse;
    if (patch.profileComplete !== undefined) profileChanges.profileComplete = patch.profileComplete;
    await tx.update(profiles).set(profileChanges).where(eq(profiles.id, userId));
  });
  return getMe(db, userId);
}
