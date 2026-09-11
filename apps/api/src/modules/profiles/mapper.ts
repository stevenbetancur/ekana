import { ageFromBirthDate, type BirthDate, type ProfileDto } from '@ekana/shared';
import type { profiles, users } from '../../db/schema/index.js';

type UserRow = typeof users.$inferSelect;
type ProfileRow = typeof profiles.$inferSelect;

const DEFAULT_LANGUAGES = [{ language: 'English', proficiency: 'Native' }];
const DEFAULT_WEEKLY_HOURS = 5;

const asString = (value: unknown): string => (typeof value === 'string' ? value : '');
const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function asLanguages(value: unknown): ProfileDto['languages'] {
  if (!Array.isArray(value)) return DEFAULT_LANGUAGES;
  return value.filter(
    (item): item is { language: string; proficiency: string } =>
      typeof item === 'object' && item !== null && typeof item.language === 'string' && typeof item.proficiency === 'string',
  );
}

export function parseBirthDate(value: string | null): BirthDate | null {
  if (!value) return null;
  const [year, month, day] = value.split('-');
  return year && month && day ? { year, month, day } : null;
}

export function formatBirthDate(birthDate: BirthDate): string {
  return `${birthDate.year}-${birthDate.month.padStart(2, '0')}-${birthDate.day.padStart(2, '0')}`;
}

export function toProfileDto(
  user: UserRow,
  profile: ProfileRow,
  hasActiveTeam: boolean,
  { includePrivate }: { includePrivate: boolean },
): ProfileDto {
  const onboarding = profile.onboardingData;
  const preferences = profile.preferences;
  const birthDate = parseBirthDate(profile.birthDate);
  return {
    id: user.id,
    name: user.name,
    avatar: user.image ?? '',
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    birthDate: includePrivate ? birthDate : null,
    age: birthDate ? ageFromBirthDate(birthDate) : null,
    subject: asString(onboarding.subject),
    goal: asString(onboarding.goal),
    level: asString(onboarding.level),
    weeklyHours: typeof onboarding.weeklyHours === 'number' ? onboarding.weeklyHours : DEFAULT_WEEKLY_HOURS,
    communicationMethods: asStringArray(onboarding.communicationMethods),
    languages: asLanguages(preferences.languages),
    interests: asStringArray(preferences.interests),
    availability: asStringArray(preferences.availability),
    schedule: { weekdays: asStringArray(profile.schedule.weekdays), weekend: asStringArray(profile.schedule.weekend) },
    isPremium: profile.isPremium,
    profileComplete: profile.profileComplete,
    hasActiveTeam,
    activeCourse: profile.activeCourse ?? null,
  };
}
