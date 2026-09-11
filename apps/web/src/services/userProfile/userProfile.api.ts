import type { MeResponse, ProfileDto, ProfilesResponse, ProfileUpdate } from '@ekana/shared';
import { api, ApiError } from '@/lib/api';
import type { UserProfile } from './types';

const EDITABLE_KEYS = [
  'name',
  'avatar',
  'bio',
  'location',
  'birthDate',
  'subject',
  'goal',
  'level',
  'weeklyHours',
  'communicationMethods',
  'languages',
  'interests',
  'availability',
  'schedule',
  'activeCourse',
  'profileComplete',
] as const;

function toUserProfile(dto: ProfileDto): UserProfile {
  return { ...dto, activeCourse: dto.activeCourse ?? undefined };
}

// Solo campos editables; los idiomas incompletos del formulario de onboarding se descartan.
function toUpdatePayload(updates: Partial<UserProfile>): ProfileUpdate {
  const payload: Record<string, unknown> = {};
  for (const key of EDITABLE_KEYS) {
    if (updates[key] !== undefined) payload[key] = updates[key];
  }
  if (updates.languages) {
    payload.languages = updates.languages.filter((l) => l.language.trim() !== '' && l.proficiency.trim() !== '');
  }
  return payload as ProfileUpdate;
}

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { profiles } = await api.get<ProfilesResponse>('/v1/profiles');
  return profiles.map(toUserProfile);
}

export async function updateProfile(_userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  const me = await api.patch<MeResponse>('/v1/me/profile', toUpdatePayload(updates));
  return toUserProfile(me.profile);
}

export async function getProfileById(id: string): Promise<UserProfile | null> {
  try {
    return toUserProfile(await api.get<ProfileDto>(`/v1/profiles/${id}`));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
