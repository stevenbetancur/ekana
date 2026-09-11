import { z } from 'zod';

export const MIN_AGE = 13;

export interface BirthDate {
  year: string;
  month: string;
  day: string;
}

// Acepta campos opcionales: el front compila sin strictNullChecks y ahí zod infiere todo como opcional.
export function ageFromBirthDate(birthDate: Partial<BirthDate>, now: Date = new Date()): number | null {
  const year = Number(birthDate.year);
  const month = Number(birthDate.month);
  const day = Number(birthDate.day);
  if (!year || !month || !day) return null;
  let age = now.getFullYear() - year;
  const monthDiff = now.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) age--;
  return age;
}

function isRealDate({ year, month, day }: BirthDate): boolean {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() === Number(year) && date.getUTCMonth() === Number(month) - 1 && date.getUTCDate() === Number(day)
  );
}

export const birthDateSchema = z
  .object({
    year: z.string().regex(/^\d{4}$/),
    month: z.string().regex(/^\d{1,2}$/),
    day: z.string().regex(/^\d{1,2}$/),
  })
  .refine(isRealDate, { message: 'Fecha de nacimiento inválida' })
  .refine((birthDate) => Number(birthDate.year) >= 1900, { message: 'Año de nacimiento inválido' })
  .refine((birthDate) => (ageFromBirthDate(birthDate) ?? 0) >= MIN_AGE, {
    message: `Debes tener al menos ${MIN_AGE} años`,
  });

const shortText = (max: number) => z.string().trim().max(max);

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    avatar: z.union([z.string().url().max(2048), z.literal('')]),
    bio: z.string().max(500),
    location: shortText(100),
    birthDate: birthDateSchema.nullable(),
    subject: shortText(100),
    goal: shortText(100),
    level: shortText(50),
    weeklyHours: z.number().int().min(0).max(168),
    communicationMethods: z.array(shortText(50)).max(20),
    languages: z
      .array(z.object({ language: z.string().trim().min(1).max(50), proficiency: z.string().trim().min(1).max(30) }))
      .max(20),
    interests: z.array(shortText(50)).max(50),
    availability: z.array(shortText(50)).max(50),
    schedule: z.object({ weekdays: z.array(shortText(30)).max(10), weekend: z.array(shortText(30)).max(10) }),
    activeCourse: shortText(255),
    profileComplete: z.boolean(),
  })
  .partial()
  .strict();
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

export interface ProfileDto {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  location: string;
  /** Solo en el perfil propio; para otros usuarios es null (se expone `age`). */
  birthDate: BirthDate | null;
  age: number | null;
  subject: string;
  goal: string;
  level: string;
  weeklyHours: number;
  communicationMethods: string[];
  languages: { language: string; proficiency: string }[];
  interests: string[];
  availability: string[];
  schedule: { weekdays: string[]; weekend: string[] };
  isPremium: boolean;
  profileComplete: boolean;
  hasActiveTeam: boolean;
  activeCourse: string | null;
}

export interface MeResponse {
  user: { id: string; email: string; name: string; image: string | null; emailVerified: boolean };
  profile: ProfileDto;
}

export interface ProfilesResponse {
  profiles: ProfileDto[];
}
